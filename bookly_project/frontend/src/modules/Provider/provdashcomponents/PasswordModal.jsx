import { createPortal } from 'react-dom';

const PasswordModal = ({
    isOpen,
    onClose,
    passwordFormData,
    setPasswordFormData,
    passwordSaving,
    passwordError,
    passwordSuccess,
    onSave
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-dark-blue">Jelszó módosítása</h3>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    {passwordError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {passwordError}
                        </div>
                    )}
                    {passwordSuccess && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {passwordSuccess}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jelenlegi jelszó *</label>
                        <input 
                            type="password" 
                            value={passwordFormData.currentPassword} 
                            onChange={(e) => setPasswordFormData({...passwordFormData, currentPassword: e.target.value})} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent" 
                            placeholder="••••••••" 
                            disabled={passwordSaving} 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Új jelszó *</label>
                        <input 
                            type="password" 
                            value={passwordFormData.newPassword} 
                            onChange={(e) => setPasswordFormData({...passwordFormData, newPassword: e.target.value})} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent" 
                            placeholder="••••••••" 
                            disabled={passwordSaving} 
                        />
                        <p className="text-xs text-gray-500 mt-1">Legalább 6 karakter hosszú legyen</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Új jelszó megerősítése *</label>
                        <input 
                            type="password" 
                            value={passwordFormData.confirmPassword} 
                            onChange={(e) => setPasswordFormData({...passwordFormData, confirmPassword: e.target.value})} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent" 
                            placeholder="••••••••" 
                            disabled={passwordSaving} 
                        />
                    </div>
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors" 
                        disabled={passwordSaving}
                    >
                        Mégse
                    </button>
                    <button 
                        onClick={onSave} 
                        disabled={passwordSaving || !!passwordSuccess} 
                        className="flex-1 py-2.5 px-4 bg-dark-blue text-white font-medium rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {passwordSaving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                            'Jelszó módosítása'
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PasswordModal;
