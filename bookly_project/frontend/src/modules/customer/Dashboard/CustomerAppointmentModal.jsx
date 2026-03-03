import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CloseIcon from '../../../icons/CloseIcon';
import ClockIcon from '../../../icons/ClockIcon';
import UserIcon from '../../../icons/UserIcon';
import StorefrontIcon from '../../../icons/StorefrontIcon';
import CurrencyIcon from '../../../icons/CurrencyIcon';
import ChatBubbleIcon from '../../../icons/ChatBubbleIcon';
import WarningIcon from '../../../icons/WarningIcon';
import PencilIcon from '../../../icons/PencilIcon';
import AddToCalendarButton from './AddToCalendarButton';

const statusConfig = {
    scheduled: { text: 'Várható', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    completed: { text: 'Elvégezve', color: 'bg-green-100 text-green-700 border-green-200' },
    canceled: { text: 'Lemondva', color: 'bg-red-100 text-red-700 border-red-200' },
    no_show: { text: 'Nem jelent meg', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    deleted: { text: 'Törölve', color: 'bg-gray-200 text-gray-600 border-gray-300' },
};

export default function CustomerAppointmentModal({
    isOpen,
    onClose,
    appointment,
    onCancel,
    cancelLoading,
    onRate,
    onSaveComment,
}) {
    const [editingComment, setEditingComment] = useState(false);
    const [commentValue, setCommentValue] = useState('');
    const [savingComment, setSavingComment] = useState(false);

    // Sync local comment value whenever the appointment changes
    useEffect(() => {
        setCommentValue(appointment?.comment ?? '');
        setEditingComment(false);
    }, [appointment?.id]);

    if (!isOpen || !appointment) return null;

    const formatTime = (dateString) =>
        new Date(dateString).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });

    const status = statusConfig[appointment.status] || statusConfig.scheduled;
    const isDeleted = appointment.status === 'deleted' || appointment.status === 'canceled';

    return createPortal(
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[90vh] animate-fade-in">
                {/* Header */}
                <div className={`p-5 ${status.color}`}>
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-bold">{appointment.service_name}</h3>
                            <p className="text-sm font-medium mt-0.5 opacity-90">{appointment.salon_name}</p>
                            <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-white/30">
                                {status.text}
                            </span>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-white/30 rounded-lg transition-colors">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {/* Date & Time */}
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                            <ClockIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Időpont</p>
                            <p className="font-medium text-gray-900">
                                {new Date(appointment.appointment_start).toLocaleDateString('hu-HU', {
                                    year: 'numeric', month: 'long', day: 'numeric',
                                })}
                            </p>
                            <p className="text-sm text-gray-600">
                                {formatTime(appointment.appointment_start)} – {formatTime(appointment.appointment_end)}
                                <span className="text-gray-400 ml-1">({appointment.duration_minutes} perc)</span>
                            </p>
                        </div>
                    </div>

                    {/* Provider */}
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                            <UserIcon className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Szolgáltató</p>
                            <p className="font-medium text-gray-900">{appointment.provider_name}</p>
                        </div>
                    </div>

                    {/* Salon */}
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                            <StorefrontIcon className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Szalon</p>
                            <p className="font-medium text-gray-900">{appointment.salon_name}</p>
                            {appointment.salon_address && (
                                <p className="text-sm text-gray-500">{appointment.salon_address}</p>
                            )}
                        </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                            <CurrencyIcon className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Ár</p>
                            <p className="font-bold text-lg text-gray-900">
                                {Number(appointment.price).toLocaleString()} Ft
                            </p>
                        </div>
                    </div>

                    {/* Comment — editable for scheduled appointments */}
                    {(appointment.comment || appointment.status === 'scheduled') && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                                <ChatBubbleIcon className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                    <p className="text-xs text-gray-500">Megjegyzés</p>
                                    {appointment.status === 'scheduled' && !editingComment && (
                                        <button
                                            onClick={() => {
                                                setCommentValue(appointment.comment ?? '');
                                                setEditingComment(true);
                                            }}
                                            className="text-xs text-purple-600 hover:text-purple-800 inline-flex items-center gap-1 transition-colors"
                                        >
                                            <PencilIcon className="w-3 h-3" />
                                            Szerkesztés
                                        </button>
                                    )}
                                </div>

                                {editingComment ? (
                                    <div className="flex flex-col gap-2">
                                        <textarea
                                            value={commentValue}
                                            onChange={(e) => setCommentValue(e.target.value)}
                                            rows={3}
                                            maxLength={500}
                                            placeholder="Írj megjegyzést a foglaláshoz..."
                                            className="w-full text-sm border border-purple-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={async () => {
                                                    setSavingComment(true);
                                                    try {
                                                        await onSaveComment?.(appointment.id, commentValue);
                                                        setEditingComment(false);
                                                    } finally {
                                                        setSavingComment(false);
                                                    }
                                                }}
                                                disabled={savingComment}
                                                className="flex-1 py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                                            >
                                                {savingComment ? (
                                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                                                ) : 'Mentés'}
                                            </button>
                                            <button
                                                onClick={() => setEditingComment(false)}
                                                disabled={savingComment}
                                                className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                Mégse
                                            </button>
                                        </div>
                                    </div>
                                ) : appointment.comment ? (
                                    <p className="text-sm text-gray-700 italic">"{appointment.comment}"</p>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">Nincs megjegyzés</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Deleted reason */}
                    {appointment.deleted_reason && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                                <WarningIcon className="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Törlés oka</p>
                                <p className="text-sm font-medium text-red-600">{appointment.deleted_reason}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {!isDeleted && (
                    <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-2">
                        {appointment.status === 'scheduled' && (
                            <>
                                <button
                                    onClick={() => onCancel?.(appointment.id)}
                                    disabled={cancelLoading}
                                    className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {cancelLoading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    ) : (
                                        'Lemondás'
                                    )}
                                </button>
                                <AddToCalendarButton appointment={appointment} />
                            </>
                        )}
                        {appointment.status === 'completed' && (
                            <button
                                onClick={() => onRate?.(appointment)}
                                className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {appointment.rating_id ? '✓ Értékelés megtekintése' : '★ Értékelés'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
