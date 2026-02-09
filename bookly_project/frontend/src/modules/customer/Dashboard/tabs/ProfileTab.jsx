import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../../auth/auth';

// Ikonok
import CloseIcon from '../../../../icons/CloseIcon';
import WarningIcon from '../../../../icons/WarningIcon';
import CheckCircleIcon from '../../../../icons/CheckCircleIcon';
import MapPinIcon from '../../../../icons/MapPinIcon';
import AlertCircleIcon from '../../../../icons/AlertCircleIcon';

// Profil tab - felhasználói adatok, jelszó és fiók kezelés
export default function ProfileTab({ user, userProfile, setUserProfile }) {
    const navigate = useNavigate();

    // Profil szerkesztés modal állapotok
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileFormData, setProfileFormData] = useState({
        name: '',
        email: '',
        phone: '',
        postalCode: '',
        city: '',
        street: ''
    });
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState(null);

    // Jelszó módosítás modal állapotok
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordFormData, setPasswordFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordError, setPasswordError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(null);

    // Fiók törlés modal állapotok
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleteError, setDeleteError] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);

    // Profilkép állapotok
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarError, setAvatarError] = useState(null);
    const [avatarSuccess, setAvatarSuccess] = useState(null);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    // Profilkép feltöltés
    async function handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setAvatarError('Csak JPG, PNG és WebP fájlok engedélyezettek');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setAvatarError('A fájl mérete nem haladhatja meg az 5MB-ot');
            return;
        }

        setAvatarUploading(true);
        setAvatarError(null);
        setAvatarSuccess(null);

        try {
            const formData = new FormData();
            formData.append('profilePicture', file);

            const response = await authApi.upload('/api/user/profile/picture', formData);
            const data = await response.json();

            if (data.success) {
                setUserProfile(prev => ({ ...prev, profile_picture_url: data.profile_picture_url }));
                setAvatarSuccess('Profilkép sikeresen frissítve!');
                setTimeout(() => setAvatarSuccess(null), 3000);
            } else {
                setAvatarError(data.message || 'Hiba történt a kép feltöltésekor');
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            setAvatarError('Hiba történt a kép feltöltésekor');
        } finally {
            setAvatarUploading(false);
            e.target.value = '';
        }
    }

    // Dátum formázása magyar formátumra
    function formatProfileDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Státusz szöveg és szín megjelenítése
    function getStatusDisplay(status) {
        switch (status) {
            case 'active': return { text: 'Aktív', color: 'bg-green-100 text-green-800' };
            case 'inactive': return { text: 'Inaktív', color: 'bg-yellow-100 text-yellow-800' };
            case 'banned': return { text: 'Letiltva', color: 'bg-red-100 text-red-800' };
            case 'deleted': return { text: 'Törölt', color: 'bg-gray-100 text-gray-800' };
            default: return { text: status || 'Ismeretlen', color: 'bg-gray-100 text-gray-800' };
        }
    }

    // Profil szerkesztés modal megnyitása
    function openProfileModal() {
        let postalCode = '';
        let city = '';
        let street = '';
        
        if (userProfile?.address) {
            const addressParts = userProfile.address.match(/^(\d{4})\s+([^,]+),?\s*(.*)$/);
            if (addressParts) {
                postalCode = addressParts[1] || '';
                city = addressParts[2] || '';
                street = addressParts[3] || '';
            } else {
                street = userProfile.address;
            }
        }
        
        setProfileFormData({
            name: userProfile?.name || '',
            email: userProfile?.email || '',
            phone: userProfile?.phone || '',
            postalCode,
            city,
            street
        });
        setProfileError(null);
        setShowProfileModal(true);
    }

    // Profil mentése
    async function handleProfileSave() {
        if (!profileFormData.name.trim()) {
            setProfileError('A név megadása kötelező');
            return;
        }

        if (profileFormData.name.trim().length < 2) {
            setProfileError('A név legalább 2 karakter hosszú kell legyen');
            return;
        }

        if (!profileFormData.email.trim()) {
            setProfileError('Az email megadása kötelező');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(profileFormData.email.trim())) {
            setProfileError('Érvénytelen email formátum');
            return;
        }

        if (profileFormData.phone.trim()) {
            const phoneRegex = /^[\d\s+()-]+$/;
            if (!phoneRegex.test(profileFormData.phone.trim())) {
                setProfileError('Érvénytelen telefonszám formátum');
                return;
            }
        }

        const hasPostalCode = profileFormData.postalCode.trim();
        const hasCity = profileFormData.city.trim();
        const hasStreet = profileFormData.street.trim();
        
        if (hasPostalCode || hasCity || hasStreet) {
            if (!hasPostalCode) {
                setProfileError('Kérjük adja meg az irányítószámot');
                return;
            }
            const postalCodeRegex = /^\d{4}$/;
            if (!postalCodeRegex.test(profileFormData.postalCode.trim())) {
                setProfileError('Az irányítószámnak 4 számjegyből kell állnia');
                return;
            }

            if (!hasCity) {
                setProfileError('Kérjük adja meg a várost');
                return;
            }
            if (profileFormData.city.trim().length < 2) {
                setProfileError('A város neve legalább 2 karakter hosszú kell legyen');
                return;
            }

            if (!hasStreet) {
                setProfileError('Kérjük adja meg az utcát és házszámot');
                return;
            }
        }

        let combinedAddress = null;
        if (hasPostalCode && hasCity && hasStreet) {
            combinedAddress = `${profileFormData.postalCode.trim()} ${profileFormData.city.trim()}, ${profileFormData.street.trim()}`;
        }

        setProfileSaving(true);
        setProfileError(null);

        try {
            const response = await authApi.put('/api/user/profile', {
                name: profileFormData.name.trim(),
                email: profileFormData.email.trim(),
                phone: profileFormData.phone.trim() || null,
                address: combinedAddress
            });
            const data = await response.json();

            if (data.success) {
                setUserProfile(data.user);
                setShowProfileModal(false);
            } else {
                setProfileError(data.message || 'Hiba történt a mentés során');
            }
        } catch (error) {
            console.error('Hiba a profil mentésekor:', error);
            setProfileError('Hiba történt a mentés során');
        } finally {
            setProfileSaving(false);
        }
    }

    // Jelszó módosítás modal megnyitása
    function openPasswordModal() {
        setPasswordFormData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setPasswordError(null);
        setPasswordSuccess(null);
        setShowPasswordModal(true);
    }

    // Jelszó módosítás kezelése
    async function handlePasswordChange() {
        if (!passwordFormData.currentPassword || !passwordFormData.newPassword || !passwordFormData.confirmPassword) {
            setPasswordError('Minden mező kitöltése kötelező');
            return;
        }

        if (passwordFormData.newPassword.length < 6) {
            setPasswordError('Az új jelszónak legalább 6 karakter hosszúnak kell lennie');
            return;
        }

        if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
            setPasswordError('Az új jelszavak nem egyeznek');
            return;
        }

        setPasswordSaving(true);
        setPasswordError(null);
        setPasswordSuccess(null);

        try {
            const response = await authApi.put('/api/user/password', passwordFormData);
            const data = await response.json();

            if (data.success) {
                setPasswordSuccess('Jelszó sikeresen megváltoztatva!');
                setPasswordFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setTimeout(() => {
                    setShowPasswordModal(false);
                    setPasswordSuccess(null);
                }, 2000);
            } else {
                setPasswordError(data.message || 'Hiba történt a jelszó módosítása során');
            }
        } catch (error) {
            console.error('Hiba a jelszó módosításakor:', error);
            setPasswordError('Hiba történt a jelszó módosítása során');
        } finally {
            setPasswordSaving(false);
        }
    }

    // Adatok exportálása
    async function handleExportData() {
        setExportLoading(true);
        try {
            const response = await authApi.get('/api/user/export-data');
            const data = await response.json();

            if (data.success) {
                // Create downloadable JSON file
                const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `bookly-data-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                alert('Hiba történt az adatok exportálása során');
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Hiba történt az adatok exportálása során');
        } finally {
            setExportLoading(false);
        }
    }

    // Fiók törlés modal megnyitása
    function openDeleteModal() {
        setDeletePassword('');
        setDeleteConfirmText('');
        setDeleteError(null);
        setShowDeleteModal(true);
    }

    // Fiók törlés kezelése
    async function handleDeleteAccount() {
        if (!deletePassword) {
            setDeleteError('A jelszó megadása kötelező a fiók törléséhez');
            return;
        }

        if (deleteConfirmText !== 'TÖRLÉS') {
            setDeleteError('Kérjük, írd be a "TÖRLÉS" szót a megerősítéshez');
            return;
        }

        setDeleteLoading(true);
        setDeleteError(null);

        try {
            const response = await authApi.delete('/api/user/account', {
                body: JSON.stringify({ password: deletePassword })
            });
            const data = await response.json();

            if (data.success) {
                localStorage.removeItem('token');
                navigate('/');
            } else {
                setDeleteError(data.message || 'Hiba történt a fiók törlése során');
            }
        } catch (error) {
            console.error('Hiba a fiók törlésekor:', error);
            setDeleteError('Hiba történt a fiók törlése során');
        } finally {
            setDeleteLoading(false);
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Profilom</h1>
            
            {/* Avatar Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-3xl">
                <div className="p-6 flex items-center gap-6">
                    <div className="relative shrink-0">
                        {userProfile?.profile_picture_url ? (
                            <img
                                src={`${apiUrl}${userProfile.profile_picture_url}`}
                                alt="Profilkép"
                                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold border-4 border-white shadow-lg">
                                {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                        {avatarUploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="text-lg font-medium text-gray-800">Profilkép</h2>
                        <p className="text-sm text-gray-500 mb-2">Max 5MB • JPG, PNG, WebP</p>
                        <label className={`inline-block cursor-pointer px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors ${avatarUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            {avatarUploading ? 'Feltöltés...' : 'Kép módosítása'}
                            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
                        </label>
                        {avatarError && <p className="text-red-500 text-xs mt-2">{avatarError}</p>}
                        {avatarSuccess && <p className="text-green-600 text-xs mt-2">{avatarSuccess}</p>}
                    </div>
                </div>
            </div>

            {/* Personal Data Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-3xl">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-800">Személyes adatok</h2>
                    <button 
                        onClick={openProfileModal}
                        className="text-indigo-600 text-sm font-medium hover:text-indigo-800 transition-colors"
                    >
                        Szerkesztés
                    </button>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Név</label>
                            <p className="text-gray-900 font-medium text-lg border-b border-gray-100 pb-2">
                                {userProfile?.name || user?.name || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</label>
                            <p className="text-gray-900 font-medium text-lg border-b border-gray-100 pb-2">
                                {userProfile?.email || user?.email || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Telefonszám</label>
                            {userProfile?.phone ? (
                                <p className="text-gray-900 font-medium text-lg border-b border-gray-100 pb-2">
                                    {userProfile.phone}
                                </p>
                            ) : (
                                <button 
                                    onClick={openProfileModal}
                                    className="text-indigo-600 font-medium text-lg border-b border-gray-100 pb-2 hover:text-indigo-800 transition-colors cursor-pointer"
                                >
                                    Nincs megadva
                                </button>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Cím</label>
                            {userProfile?.address ? (
                                <p className="text-gray-900 font-medium text-lg border-b border-gray-100 pb-2">
                                    {userProfile.address}
                                </p>
                            ) : (
                                <button 
                                    onClick={openProfileModal}
                                    className="text-indigo-600 font-medium text-lg border-b border-gray-100 pb-2 hover:text-indigo-800 transition-colors cursor-pointer"
                                >
                                    Nincs megadva
                                </button>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Státusz</label>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium mt-1 ${getStatusDisplay(userProfile?.status).color}`}>
                                {getStatusDisplay(userProfile?.status).text}
                            </span>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                Regisztráció dátuma
                            </label>
                            <p className="text-gray-900 font-medium text-lg border-b border-gray-100 pb-2">
                                {formatProfileDate(userProfile?.created_at)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Change Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-3xl">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-800">Biztonság</h2>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-900 font-medium">Jelszó módosítása</h3>
                            <p className="text-sm text-gray-500 mt-1">Változtasd meg a fiókoddal kapcsolatos jelszót</p>
                        </div>
                        <button
                            onClick={openPasswordModal}
                            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Jelszó módosítása
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Account Section */}
            <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden max-w-3xl">
                <div className="bg-red-50 px-6 py-4 border-b border-red-200 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-red-800">Veszélyzóna</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                        <div>
                            <h3 className="text-gray-900 font-medium">Adatok exportálása</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Töltsd le az összes adatodat JSON formátumban.
                            </p>
                        </div>
                        <button
                            onClick={handleExportData}
                            disabled={exportLoading}
                            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {exportLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            ) : null}
                            Adatok letöltése
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-900 font-medium">Fiók törlése</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                A fiók törlése után 30 napod van a visszaállításra.
                            </p>
                        </div>
                        <button
                            onClick={openDeleteModal}
                            className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Fiók törlése
                        </button>
                    </div>
                </div>
            </div>

            {/* Profile completion hint */}
            {userProfile?.status !== 'active' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 max-w-3xl">
                    <div className="flex items-start gap-3">
                        <div className="text-yellow-600 mt-0.5">
                            <AlertCircleIcon />
                        </div>
                        <div>
                            <h4 className="text-yellow-800 font-medium">Profil kiegészítése szükséges</h4>
                            <p className="text-yellow-700 text-sm mt-1">
                                Töltsd ki a kötelező mezőket (név, email, telefonszám), hogy aktív státuszra válts!
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Edit Modal */}
            {showProfileModal && createPortal(
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 overflow-y-auto">
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowProfileModal(false)}
                    ></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900">Profil szerkesztése</h3>
                                <button 
                                    onClick={() => setShowProfileModal(false)}
                                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {profileError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {profileError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Név *
                                </label>
                                <input
                                    type="text"
                                    value={profileFormData.name}
                                    onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="Teljes név"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={profileFormData.email}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                    disabled
                                />
                                <p className="text-xs text-gray-400 mt-1">Az email cím nem módosítható</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Telefonszám
                                </label>
                                <input
                                    type="tel"
                                    value={profileFormData.phone}
                                    onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="+36 20 123 4567"
                                />
                                <p className="text-xs text-gray-500 mt-1">Formátum: +36 20 123 4567</p>
                            </div>

                            {/* Address Section */}
                            <div className="pt-2">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="text-gray-600">
                                        <MapPinIcon />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Lakcím</span>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-3 mb-3">
                                    <div className="col-span-1">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Irányítószám
                                        </label>
                                        <input
                                            type="text"
                                            value={profileFormData.postalCode}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                setProfileFormData({ ...profileFormData, postalCode: value });
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-center"
                                            placeholder="1234"
                                            maxLength={4}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Város
                                        </label>
                                        <input
                                            type="text"
                                            value={profileFormData.city}
                                            onChange={(e) => setProfileFormData({ ...profileFormData, city: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            placeholder="Budapest"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Utca, házszám
                                    </label>
                                    <input
                                        type="text"
                                        value={profileFormData.street}
                                        onChange={(e) => setProfileFormData({ ...profileFormData, street: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="Példa utca 1. 2. emelet 3. ajtó"
                                    />
                                </div>
                                
                                <p className="text-xs text-gray-500 mt-2">
                                    A cím megadása nem kötelező, de ha elkezded kitölteni, minden mezőt ki kell töltened.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button
                                onClick={() => setShowProfileModal(false)}
                                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                Mégse
                            </button>
                            <button
                                onClick={handleProfileSave}
                                disabled={profileSaving}
                                className="flex-1 py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            )}

            {/* Password Change Modal */}
            {showPasswordModal && createPortal(
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 overflow-y-auto">
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowPasswordModal(false)}
                    ></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900">Jelszó módosítása</h3>
                                <button 
                                    onClick={() => setShowPasswordModal(false)}
                                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <CloseIcon />
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
                                    <CheckCircleIcon />
                                    {passwordSuccess}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Jelenlegi jelszó *
                                </label>
                                <input
                                    type="password"
                                    value={passwordFormData.currentPassword}
                                    onChange={(e) => setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Új jelszó *
                                </label>
                                <input
                                    type="password"
                                    value={passwordFormData.newPassword}
                                    onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                />
                                <p className="text-xs text-gray-500 mt-1">Legalább 6 karakter hosszú legyen</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Új jelszó megerősítése *
                                </label>
                                <input
                                    type="password"
                                    value={passwordFormData.confirmPassword}
                                    onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                Mégse
                            </button>
                            <button
                                onClick={handlePasswordChange}
                                disabled={passwordSaving || passwordSuccess}
                                className="flex-1 py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            )}

            {/* Delete Account Modal */}
            {showDeleteModal && createPortal(
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 overflow-y-auto">
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowDeleteModal(false)}
                    ></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md my-8">
                        <div className="p-6 border-b border-gray-100 bg-red-50">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-red-900">Fiók törlése</h3>
                                <button 
                                    onClick={() => setShowDeleteModal(false)}
                                    className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {deleteError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {deleteError}
                                </div>
                            )}

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="text-blue-600 mt-0.5 shrink-0">
                                        <AlertCircleIcon />
                                    </div>
                                    <div>
                                        <h4 className="text-blue-800 font-medium">30 napos visszaállítási időszak</h4>
                                        <p className="text-blue-700 text-sm mt-1">
                                            A fiók törlése után 30 napig van lehetőséged újra aktiválni azt. 
                                            Ez idő alatt nem tudsz bejelentkezni, de az adataid megőrződnek. 
                                            30 nap elteltével a fiók véglegesen törlődik.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="text-yellow-600 mt-0.5 shrink-0">
                                        <WarningIcon />
                                    </div>
                                    <div>
                                        <h4 className="text-yellow-800 font-medium">Mi történik a fiókoddal?</h4>
                                        <ul className="text-yellow-700 text-sm mt-2 space-y-1 list-disc list-inside">
                                            <li>Minden foglalásod automatikusan törlődik</li>
                                            <li>Mentett helyeid törlődnek</li>
                                            <li>Személyes adataid anonimizálódnak</li>
                                            <li>Nem tudsz bejelentkezni 30 napig</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Jelszavad *
                                </label>
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Írd be a "TÖRLÉS" szót a megerősítéshez *
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                    placeholder="TÖRLÉS"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleteLoading}
                                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Mégse
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteLoading}
                                className="flex-1 py-2.5 px-4 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {deleteLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                ) : (
                                    'Fiók törlése'
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
