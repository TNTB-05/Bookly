import { useState, useEffect, useCallback } from 'react';
import { timeBlocksService } from '../../services/timeBlocksService';
import { authApi } from '../auth/auth';
import TimeBlockModal from './TimeBlockModal';

const AvailabilityManagement = () => {
    const [rawBlocks, setRawBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedBlock, setSelectedBlock] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'recurring', 'one-time'
    const [toast, setToast] = useState(null);
    const [workingHours, setWorkingHours] = useState({ openingHour: 8, closingHour: 20 });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchWorkingHours = useCallback(async () => {
        try {
            const response = await authApi.get('/api/provider/calendar/working-hours');
            const data = await response.json();
            if (data.success) {
                setWorkingHours({ openingHour: data.openingHour, closingHour: data.closingHour });
            }
        } catch (error) {
            console.error('Error fetching working hours:', error);
        }
    }, []);

    const fetchBlocks = useCallback(async () => {
        setLoading(true);
        try {
            const rawData = await timeBlocksService.getRawTimeBlocks();
            if (rawData.success) setRawBlocks(rawData.timeBlocks);
        } catch (error) {
            console.error('Error fetching blocks:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWorkingHours();
    }, [fetchWorkingHours]);

    useEffect(() => {
        fetchBlocks();
    }, [fetchBlocks]);

    const handleSaved = () => {
        fetchBlocks();
        showToast('Szünet sikeresen mentve');
    };

    const handleDeleteBlock = async (blockId) => {
        if (!confirm('Biztosan törölni szeretné ezt a szünetet?')) return;
        try {
            const result = await timeBlocksService.deleteTimeBlock(blockId);
            if (result.success) {
                fetchBlocks();
                showToast('Szünet sikeresen törölve');
            } else {
                showToast(result.message || 'Hiba történt', 'error');
            }
        } catch (error) {
            showToast('Hiba történt a törlés során', 'error');
        }
    };

    // Format time
    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
    };

    // Format date
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('hu-HU', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const filteredBlocks = rawBlocks.filter(block => {
        if (filter === 'recurring') return block.is_recurring;
        if (filter === 'one-time') return !block.is_recurring;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-bold text-dark-blue">Elérhetőség kezelése</h2>
                <button
                    onClick={() => { setSelectedBlock(null); setShowModal(true); }}
                    className="px-4 py-2 bg-dark-blue text-white rounded-xl font-medium hover:bg-blue-800 transition-colors shadow-md text-sm"
                >
                    + Új Szünet
                </button>
            </div>

            <div>
                <div>
                    <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 overflow-hidden">
                        {/* Filters */}
                        <div className="p-4 border-b border-white/50 bg-white/20 flex gap-2">
                            {[
                                { key: 'all', label: 'Összes' },
                                { key: 'recurring', label: 'Ismétlődő' },
                                { key: 'one-time', label: 'Egyszeri' }
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setFilter(key)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                        filter === key
                                            ? 'bg-dark-blue text-white shadow-md'
                                            : 'bg-white/50 text-gray-600 hover:bg-white/80'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="p-4 max-h-[500px] overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dark-blue"></div>
                                </div>
                            ) : filteredBlocks.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-500 text-sm">Nincs szünet</p>
                                    <p className="text-gray-400 text-xs mt-1">Kattintson az "Új Szünet" gombra egy létrehozásához</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredBlocks.map(block => (
                                        <div key={block.id} className="bg-white/60 p-4 rounded-xl border border-white/50 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="w-2 h-2 rounded-full bg-gray-400 shrink-0"></div>
                                                        <p className="font-semibold text-gray-800 text-sm truncate">
                                                            {block.notes || 'Szünet'}
                                                        </p>
                                                        {!!block.is_recurring && (
                                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded-full shrink-0">
                                                                {block.recurrence_pattern === 'daily' ? 'Naponta' : 'Hetente'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 ml-4">
                                                        {formatDate(block.start_datetime)} · {formatTime(block.start_datetime)} - {formatTime(block.end_datetime)}
                                                    </p>
                                                    {!!block.is_recurring && block.recurrence_pattern === 'weekly' && block.recurrence_days && (
                                                        <p className="text-xs text-gray-400 ml-4 mt-0.5">
                                                            Napok: {(typeof block.recurrence_days === 'string' ? JSON.parse(block.recurrence_days) : block.recurrence_days)
                                                                .map(d => ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'][d])
                                                                .join(', ')}
                                                        </p>
                                                    )}
                                                    {!!block.is_recurring && block.recurrence_end_date && (
                                                        <p className="text-xs text-gray-400 ml-4 mt-0.5">
                                                            Vége: {formatDate(block.recurrence_end_date)}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex gap-1 shrink-0">
                                                    <button
                                                        onClick={() => { setSelectedBlock(block); setShowModal(true); }}
                                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-dark-blue"
                                                        title="Szerkesztés"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteBlock(block.id)}
                                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-500 hover:text-red-500"
                                                        title="Törlés"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-[9999] px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all animate-fade-in ${
                    toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                    {toast.message}
                </div>
            )}

            {/* Modal */}
            <TimeBlockModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setSelectedBlock(null); }}
                onSaved={handleSaved}
                block={selectedBlock}
                workingHours={workingHours}
                selectedDate={new Date()}
            />
        </div>
    );
};

export default AvailabilityManagement;
