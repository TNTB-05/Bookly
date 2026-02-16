import WarningIcon from '../icons/WarningIcon';

export default function ConfirmModal({ isOpen, message, onConfirm, onCancel, confirmLabel = 'Igen', cancelLabel = 'Mégse', danger = false }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-10000 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
                onClick={onCancel}
            />
            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-fade-in">
                <div className="flex items-start gap-4">
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        danger ? 'bg-red-100' : 'bg-amber-100'
                    }`}>
                        <WarningIcon className={`w-5 h-5 ${danger ? 'text-red-600' : 'text-amber-600'}`} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Megerősítés</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors cursor-pointer ${
                            danger
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-amber-500 hover:bg-amber-600'
                        }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
