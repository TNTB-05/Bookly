import { createPortal } from 'react-dom';

const AppointmentDetailModal = ({ isOpen, onClose, appointment, deleteLoading, onDelete }) => {
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
            case 'canceled': return 'Törölve';
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
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-6 space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
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
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
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
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-yellow-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
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
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-purple-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Megjegyzés</p>
                                <p className="text-sm text-gray-700">{appointment.comment}</p>
                            </div>
                        </div>
                    )}
                </div>

                {appointment.status === 'scheduled' && (
                    <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50">
                        <button
                            onClick={onDelete}
                            disabled={deleteLoading}
                            className="w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {deleteLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                    Foglalás törlése
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default AppointmentDetailModal;
