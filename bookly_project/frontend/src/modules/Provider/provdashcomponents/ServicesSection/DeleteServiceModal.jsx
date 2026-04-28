import { createPortal } from 'react-dom';
import WarningIcon from '../../../../icons/WarningIcon';

const DeleteServiceModal = ({ isOpen, onClose, service, deleting, onDelete }) => {
    if (!isOpen || !service) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            ></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm my-8">
                <div className="p-6">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <WarningIcon className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Szolgáltatás Törlése</h3>
                    <p className="text-gray-600 text-center text-sm">
                        Biztosan törölni szeretnéd a <strong>"{service.name}"</strong> szolgáltatást? Ez a művelet nem vonható vissza.
                    </p>
                </div>
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        Mégse
                    </button>
                    <button
                        onClick={() => onDelete(service.id)}
                        disabled={deleting}
                        className="flex-1 py-2.5 px-4 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {deleting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                            'Törlés'
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DeleteServiceModal;
