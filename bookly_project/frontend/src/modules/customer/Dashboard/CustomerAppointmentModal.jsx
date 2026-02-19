import { createPortal } from 'react-dom';
import CloseIcon from '../../../icons/CloseIcon';
import ClockIcon from '../../../icons/ClockIcon';
import UserIcon from '../../../icons/UserIcon';
import StorefrontIcon from '../../../icons/StorefrontIcon';
import CurrencyIcon from '../../../icons/CurrencyIcon';
import ChatBubbleIcon from '../../../icons/ChatBubbleIcon';
import WarningIcon from '../../../icons/WarningIcon';

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
}) {
    if (!isOpen || !appointment) return null;

    const formatTime = (dateString) =>
        new Date(dateString).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });

    const status = statusConfig[appointment.status] || statusConfig.scheduled;
    const isDeleted = appointment.status === 'deleted' || appointment.status === 'canceled';

    return createPortal(
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
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

                    {/* Comment */}
                    {appointment.comment && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                                <ChatBubbleIcon className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Megjegyzés</p>
                                <p className="text-sm text-gray-700 italic">"{appointment.comment}"</p>
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
