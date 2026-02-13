import { createPortal } from 'react-dom';

const ProfileModal = ({ 
    isOpen, 
    onClose, 
    providerProfile, 
    profileFormData, 
    setProfileFormData,
    profileSaving,
    profileError,
    profileSuccess,
    pictureUploading,
    pictureError,
    onSave,
    onPictureUpload,
    onPasswordModalOpen
}) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const getProviderInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-dark-blue">Profil szerkesztése</h3>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="p-6 space-y-5">
                    {profileSuccess && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {profileSuccess}
                        </div>
                    )}
                    {/* Avatar section */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                            {providerProfile?.profile_picture_url ? (
                                <img 
                                    src={`${apiUrl}${providerProfile.profile_picture_url}`} 
                                    alt="Profil" 
                                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" 
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-dark-blue to-blue-500 text-white flex items-center justify-center text-2xl font-bold border-4 border-white shadow-lg">
                                    {getProviderInitials(providerProfile?.name)}
                                </div>
                            )}
                            {pictureUploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                                </div>
                            )}
                        </div>
                        <label className={`cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors ${pictureUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            {pictureUploading ? 'Feltöltés...' : 'Kép módosítása'}
                            <input 
                                type="file" 
                                accept="image/jpeg,image/png,image/webp" 
                                className="hidden" 
                                onChange={onPictureUpload} 
                                disabled={pictureUploading} 
                            />
                        </label>
                        {pictureError && <p className="text-red-500 text-xs">{pictureError}</p>}
                        <p className="text-xs text-gray-400">Max 5MB • JPG, PNG, WebP</p>
                    </div>
                    {profileError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {profileError}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Név *</label>
                        <input 
                            type="text" 
                            value={profileFormData.name} 
                            onChange={(e) => setProfileFormData({...profileFormData, name: e.target.value})} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent" 
                            placeholder="Teljes név" 
                            disabled={profileSaving} 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input 
                            type="email" 
                            value={providerProfile?.email || ''} 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" 
                            disabled 
                        />
                        <p className="text-xs text-gray-400 mt-1">Az email cím nem módosítható</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefonszám *</label>
                        <input 
                            type="tel" 
                            value={profileFormData.phone} 
                            onChange={(e) => setProfileFormData({...profileFormData, phone: e.target.value})} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent" 
                            placeholder="+36 20 123 4567" 
                            disabled={profileSaving} 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bemutatkozás</label>
                        <textarea 
                            value={profileFormData.description} 
                            onChange={(e) => setProfileFormData({...profileFormData, description: e.target.value})} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent resize-none" 
                            rows={3} 
                            placeholder="Rövid bemutatkozás..." 
                            disabled={profileSaving} 
                        />
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                        <button 
                            onClick={onPasswordModalOpen} 
                            className="w-full text-left px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between"
                        >
                            <span className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                                Jelszó módosítása
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors" 
                        disabled={profileSaving}
                    >
                        Mégse
                    </button>
                    <button 
                        onClick={onSave} 
                        disabled={profileSaving} 
                        className="flex-1 py-2.5 px-4 bg-dark-blue text-white font-medium rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {profileSaving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                            'Mentés'
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ProfileModal;
