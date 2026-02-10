import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import TimeSpinner from '../../components/TimeSpinner';
import { timeBlocksService } from '../../services/timeBlocksService';

const TimeBlockModal = ({ isOpen, onClose, onSaved, block = null, workingHours, selectedDate }) => {
    const isEdit = !!block;
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState(null);
    const [conflicts, setConflicts] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showRecurringChoice, setShowRecurringChoice] = useState(false);
    const [recurringAction, setRecurringAction] = useState(null); // 'single' | 'all'

    const [formData, setFormData] = useState({
        mode: 'single', // 'single' or 'multiday'
        date: '',
        startDate: '',
        endDate: '',
        startTime: '12:00',
        endTime: '13:00',
        is_recurring: false,
        recurrence_pattern: 'daily',
        recurrence_days: [],
        recurrence_end_date: '',
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            setError(null);
            setConflicts([]);
            setShowDeleteConfirm(false);
            setShowRecurringChoice(false);
            setRecurringAction(null);

            if (block) {
                // Edit mode - populate from block
                const start = new Date(block.start_datetime);
                const end = new Date(block.end_datetime);
                setFormData({
                    mode: 'single',
                    date: start.toISOString().split('T')[0],
                    startDate: '',
                    endDate: '',
                    startTime: `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`,
                    endTime: `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`,
                    is_recurring: block.is_recurring || false,
                    recurrence_pattern: block.recurrence_pattern || 'daily',
                    recurrence_days: block.recurrence_days || [],
                    recurrence_end_date: block.recurrence_end_date ? new Date(block.recurrence_end_date).toISOString().split('T')[0] : '',
                    notes: block.notes || ''
                });
            } else {
                // Create mode
                const dateStr = selectedDate 
                    ? (typeof selectedDate === 'string' ? selectedDate : selectedDate.toISOString().split('T')[0])
                    : new Date().toISOString().split('T')[0];
                setFormData({
                    mode: 'single',
                    date: dateStr,
                    startDate: dateStr,
                    endDate: dateStr,
                    startTime: '12:00',
                    endTime: '13:00',
                    is_recurring: false,
                    recurrence_pattern: 'daily',
                    recurrence_days: [],
                    recurrence_end_date: '',
                    notes: ''
                });
            }
        }
    }, [isOpen, block, selectedDate]);

    const dayNames = ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'];

    const toggleRecurrenceDay = (dayIndex) => {
        setFormData(prev => ({
            ...prev,
            recurrence_days: prev.recurrence_days.includes(dayIndex)
                ? prev.recurrence_days.filter(d => d !== dayIndex)
                : [...prev.recurrence_days, dayIndex]
        }));
    };

    const validate = () => {
        // Validate times
        const [startH, startM] = formData.startTime.split(':').map(Number);
        const [endH, endM] = formData.endTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        if (endMinutes <= startMinutes) {
            setError('A záró időpontnak a kezdő időpont után kell lennie');
            return false;
        }

        if (formData.mode === 'single' && !formData.date) {
            setError('Dátum megadása kötelező');
            return false;
        }

        if (formData.mode === 'multiday') {
            if (!formData.startDate || !formData.endDate) {
                setError('Kezdő és záró dátum megadása kötelező');
                return false;
            }
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            if (end < start) {
                setError('A záró dátumnak a kezdő dátum után kell lennie');
                return false;
            }
            const diffDays = (end - start) / (1000 * 60 * 60 * 24);
            if (diffDays > 30) {
                setError('A szünet maximális időtartama 30 nap');
                return false;
            }
        }

        // Past check
        if (formData.mode === 'single' && !formData.is_recurring) {
            const checkDate = new Date(formData.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (checkDate < today) {
                setError('Múltbeli időpontra nem lehet szünetet létrehozni');
                return false;
            }
        }

        if (formData.is_recurring && formData.recurrence_pattern === 'weekly' && formData.recurrence_days.length === 0) {
            setError('Heti ismétlődéshez válasszon legalább egy napot');
            return false;
        }

        return true;
    };

    const handleSave = async (targetInstance = 'all') => {
        setError(null);
        setConflicts([]);

        if (!validate()) return;

        setSaving(true);
        try {
            if (formData.mode === 'multiday' && !isEdit) {
                // Create separate all-day blocks for each day
                const start = new Date(formData.startDate);
                const end = new Date(formData.endDate);
                let hasError = false;

                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    const result = await timeBlocksService.createTimeBlock({
                        start_datetime: `${dateStr}T${formData.startTime}:00`,
                        end_datetime: `${dateStr}T${formData.endTime}:00`,
                        is_recurring: false,
                        notes: formData.notes || null
                    });

                    if (!result.success) {
                        if (result.conflicts) {
                            setConflicts(result.conflicts);
                        }
                        setError(result.message || 'Hiba történt a szünet létrehozásakor');
                        hasError = true;
                        break;
                    }
                }

                if (!hasError) {
                    onSaved?.();
                    onClose();
                }
            } else if (isEdit) {
                // Update existing block
                const dateStr = formData.date;
                const result = await timeBlocksService.updateTimeBlock(block.id, {
                    start_datetime: `${dateStr}T${formData.startTime}:00`,
                    end_datetime: `${dateStr}T${formData.endTime}:00`,
                    is_recurring: formData.is_recurring,
                    recurrence_pattern: formData.is_recurring ? formData.recurrence_pattern : null,
                    recurrence_days: formData.is_recurring && formData.recurrence_pattern === 'weekly' ? formData.recurrence_days : null,
                    recurrence_end_date: formData.is_recurring && formData.recurrence_end_date ? formData.recurrence_end_date : null,
                    notes: formData.notes || null,
                    targetInstance
                });

                if (result.success) {
                    onSaved?.();
                    onClose();
                } else {
                    if (result.conflicts) setConflicts(result.conflicts);
                    setError(result.message);
                }
            } else {
                // Create single block
                const dateStr = formData.date;
                const result = await timeBlocksService.createTimeBlock({
                    start_datetime: `${dateStr}T${formData.startTime}:00`,
                    end_datetime: `${dateStr}T${formData.endTime}:00`,
                    is_recurring: formData.is_recurring,
                    recurrence_pattern: formData.is_recurring ? formData.recurrence_pattern : null,
                    recurrence_days: formData.is_recurring && formData.recurrence_pattern === 'weekly' ? formData.recurrence_days : null,
                    recurrence_end_date: formData.is_recurring && formData.recurrence_end_date ? formData.recurrence_end_date : null,
                    notes: formData.notes || null
                });

                if (result.success) {
                    onSaved?.();
                    onClose();
                } else {
                    if (result.conflicts) setConflicts(result.conflicts);
                    setError(result.message);
                }
            }
        } catch (err) {
            console.error('Save time block error:', err);
            setError('Hiba történt a mentés során');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (targetInstance = 'all') => {
        setDeleting(true);
        try {
            const instanceDate = block?.is_recurring ? formData.date : null;
            const result = await timeBlocksService.deleteTimeBlock(block.id, targetInstance, instanceDate);
            if (result.success) {
                onSaved?.();
                onClose();
            } else {
                setError(result.message);
            }
        } catch (err) {
            console.error('Delete time block error:', err);
            setError('Hiba történt a törlés során');
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleSaveClick = () => {
        if (isEdit && block?.is_recurring) {
            setShowRecurringChoice(true);
            setRecurringAction('save');
        } else {
            handleSave();
        }
    };

    const handleDeleteClick = () => {
        if (block?.is_recurring) {
            setShowRecurringChoice(true);
            setRecurringAction('delete');
        } else {
            setShowDeleteConfirm(true);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md my-8 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-dark-blue">
                            {isEdit ? 'Szünet szerkesztése' : 'Új Szünet'}
                        </h3>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {conflicts.length > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                            <p className="font-medium mb-2">Ütköző foglalások:</p>
                            <ul className="space-y-1">
                                {conflicts.map((c, i) => (
                                    <li key={i} className="text-xs">
                                        {c.user_name} - {c.service_name} ({new Date(c.start).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })} - {new Date(c.end).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })})
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Mode Toggle (only for create) */}
                    {!isEdit && (
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <label className="block text-sm font-medium text-gray-700 mb-3">Típus</label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, mode: 'single' })}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all text-sm ${
                                        formData.mode === 'single'
                                            ? 'bg-dark-blue text-white shadow-md'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:border-dark-blue'
                                    }`}
                                >
                                    Egy nap
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, mode: 'multiday', is_recurring: false })}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all text-sm ${
                                        formData.mode === 'multiday'
                                            ? 'bg-dark-blue text-white shadow-md'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:border-dark-blue'
                                    }`}
                                >
                                    Több nap (szabadság)
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Date Selection */}
                    {formData.mode === 'single' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dátum *</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kezdő dátum *</label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Záró dátum *</label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>
                    )}

                    {/* Time Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kezdő idő *</label>
                            <TimeSpinner
                                value={formData.startTime}
                                onChange={(timeString) => setFormData({ ...formData, startTime: timeString })}
                                minHour={workingHours?.openingHour || 0}
                                maxHour={workingHours?.closingHour || 24}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Záró idő *</label>
                            <TimeSpinner
                                value={formData.endTime}
                                onChange={(timeString) => setFormData({ ...formData, endTime: timeString })}
                                minHour={workingHours?.openingHour || 0}
                                maxHour={workingHours?.closingHour || 24}
                            />
                        </div>
                    </div>

                    {/* Recurring Toggle (only for single-day mode) */}
                    {formData.mode === 'single' && (
                        <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_recurring}
                                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-dark-blue focus:ring-dark-blue"
                                />
                                <span className="text-sm font-medium text-gray-700">Ismétlődő</span>
                            </label>

                            {formData.is_recurring && (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Ismétlődés</label>
                                        <select
                                            value={formData.recurrence_pattern}
                                            onChange={(e) => setFormData({ ...formData, recurrence_pattern: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent text-sm"
                                        >
                                            <option value="daily">Naponta</option>
                                            <option value="weekly">Hetente</option>
                                        </select>
                                    </div>

                                    {formData.recurrence_pattern === 'weekly' && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-2">Napok *</label>
                                            <div className="flex gap-1.5">
                                                {dayNames.map((name, index) => (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onClick={() => toggleRecurrenceDay(index)}
                                                        className={`w-9 h-9 rounded-lg text-xs font-medium transition-all ${
                                                            formData.recurrence_days.includes(index)
                                                                ? 'bg-dark-blue text-white shadow-md'
                                                                : 'bg-white text-gray-600 border border-gray-300 hover:border-dark-blue'
                                                        }`}
                                                    >
                                                        {name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Ismétlődés vége (opcionális)</label>
                                        <input
                                            type="date"
                                            value={formData.recurrence_end_date}
                                            onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent text-sm"
                                            min={formData.date || new Date().toISOString().split('T')[0]}
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Ha üresen hagyja, végtelenül ismétlődik</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Megjegyzés</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent resize-none"
                            rows={2}
                            placeholder="pl. Ebédszünet, Szabadság..."
                        />
                    </div>
                </div>

                {/* Recurring Choice Dialog */}
                {showRecurringChoice && (
                    <div className="p-4 mx-6 mb-2 bg-blue-50 border border-blue-200 rounded-xl">
                        <p className="text-sm font-medium text-blue-700 mb-3">
                            {recurringAction === 'save' ? 'Módosítás alkalmazása:' : 'Törlés alkalmazása:'}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setShowRecurringChoice(false);
                                    if (recurringAction === 'save') handleSave('single');
                                    else handleDelete('single');
                                }}
                                className="flex-1 py-2 px-3 bg-white text-blue-700 border border-blue-300 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                            >
                                Csak ez az alkalom
                            </button>
                            <button
                                onClick={() => {
                                    setShowRecurringChoice(false);
                                    if (recurringAction === 'save') handleSave('all');
                                    else handleDelete('all');
                                }}
                                className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                Összes jövőbeli
                            </button>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Dialog */}
                {showDeleteConfirm && (
                    <div className="p-4 mx-6 mb-2 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm font-medium text-red-700 mb-3">Biztosan törölni szeretné ezt a szünetet?</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-2 px-3 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Mégse
                            </button>
                            <button
                                onClick={() => handleDelete('all')}
                                disabled={deleting}
                                className="flex-1 py-2 px-3 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                            >
                                {deleting ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                ) : 'Törlés'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                    {isEdit && (
                        <button
                            onClick={handleDeleteClick}
                            disabled={saving || deleting}
                            className="py-2.5 px-4 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                        disabled={saving || deleting}
                    >
                        Mégse
                    </button>
                    <button
                        onClick={handleSaveClick}
                        disabled={saving || deleting}
                        className="flex-1 py-2.5 px-4 bg-dark-blue text-white font-medium rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                            isEdit ? 'Mentés' : 'Létrehozás'
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default TimeBlockModal;
