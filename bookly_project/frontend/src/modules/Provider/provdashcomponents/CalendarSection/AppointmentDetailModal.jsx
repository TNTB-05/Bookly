import { createPortal } from 'react-dom';
import CloseIcon from '../../../../icons/CloseIcon';
import ClockIcon from '../../../../icons/ClockIcon';
import UserIcon from '../../../../icons/UserIcon';
import CurrencyIcon from '../../../../icons/CurrencyIcon';
import ChatBubbleIcon from '../../../../icons/ChatBubbleIcon';
import ChatBubbleDotsIcon from '../../../../icons/ChatBubbleDotsIcon';
import TrashIcon from '../../../../icons/TrashIcon';

const AppointmentDetailModal = ({ isOpen, onClose, appointment, deleteLoading, onDelete, onOpenChat }) => {
    if (!isOpen || !appointment) return null;

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('hu-HU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'canceled': return 'bg-red-100 text-red-700 border-red-200';
            case 'no_show': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'scheduled': return 'Foglalt';
            case 'completed': return 'Teljesítve';
            case 'canceled': return 'Lemondva';
            case 'deleted': return 'Törölve';
            case 'no_show': return 'Nem jelent meg';
            default: return status;
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            ></div>
            
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className={`p-4 sm:p-6 ${getStatusColor(appointment.status)}`}>
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg sm:text-xl font-bold">
                                {appointment.user_name}
                            </h3>
                            {appointment.service_name && (
                                <p className="text-sm sm:text-base font-medium mt-0.5 opacity-90">
                                    {appointment.service_name}
                                </p>
                            )}
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-white/30">
                                {getStatusText(appointment.status)}
                            </span>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-1 hover:bg-white/30 rounded-lg transition-colors"
                        >
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-6 space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                            <ClockIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Időpont</p>
                            <p className="font-medium text-gray-900">
                                {new Date(appointment.appointment_start).toLocaleDateString('hu-HU', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                            <p className="text-sm text-gray-600">
                                {formatTime(appointment.appointment_start)} - {formatTime(appointment.appointment_end)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                            <UserIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Kapcsolat</p>
                            <p className="font-medium text-gray-900">{appointment.user_email}</p>
                            {appointment.user_phone && (
                                <p className="text-sm text-gray-600">{appointment.user_phone}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center shrink-0">
                            <CurrencyIcon className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Ár</p>
                            <p className="font-bold text-lg text-gray-900">
                                {appointment.price.toLocaleString()} Ft
                            </p>
                        </div>
                    </div>

                    {appointment.comment && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                                <ChatBubbleIcon className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Megjegyzés</p>
                                <p className="text-sm text-gray-700">{appointment.comment}</p>
                            </div>
                        </div>
                    )}
                </div>

                {(onOpenChat || appointment.status === 'scheduled') && (
                    <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                        {onOpenChat && (
                            <button
                                onClick={onOpenChat}
                                className="flex-1 py-2.5 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <ChatBubbleDotsIcon className="w-4 h-4" />
                                Üzenet küldése
                            </button>
                        )}
                        {appointment.status === 'scheduled' && (
                            <button
                                onClick={onDelete}
                                disabled={deleteLoading}
                                className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {deleteLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                ) : (
                                    <>
                                        <TrashIcon className="w-4 h-4" />
                                        Foglalás törlése
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default AppointmentDetailModal;
