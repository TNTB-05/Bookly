import UserIcon from '../../../icons/UserIcon';
import LogoutIcon from '../../../icons/LogoutIcon';

const UserDropdown = ({ isOpen, onLogout, onProfileEdit, providerProfile }) => {
    if (!isOpen) return null;
    
    return (
        <div className="absolute top-14 right-4 w-52 bg-white/60 backdrop-blur-md border border-white/50 rounded-2xl shadow-xl overflow-hidden animate-fade-in z-50">
            <div className="p-4 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-900">{providerProfile?.name || 'Szolgáltató'}</p>
                <p className="text-xs text-gray-500 truncate">{providerProfile?.email || ''}</p>
            </div>
            <div className="p-2 space-y-1">
                <button onClick={onProfileEdit} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white/50 rounded-lg transition-colors flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    Profil Szerkesztése
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button 
                    onClick={onLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                >
                    <LogoutIcon className="w-4 h-4" />
                    Kijelentkezés
                </button>
            </div>
        </div>
    );
};

export default UserDropdown;
