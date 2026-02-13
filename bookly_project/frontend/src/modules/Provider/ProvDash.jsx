import { useState, useRef, useEffect } from 'react';
import Logo from '../../modules/Logo';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth';
import { authApi, logout, getUserFromToken } from '../auth/auth';
import OverviewIcon from '../../icons/OverviewIcon';
import CalendarIcon from '../../icons/CalendarIcon';
import ServicesIcon from '../../icons/ServicesIcon';
import SalonIcon from '../../icons/SalonIcon';
import HourIcon from '../../icons/HourIcon';
import SalonManagement from './SalonManagement';
import AvailabilityManagement from './AvailabilityManagement';
import OverviewSection from './provdashcomponents/OverviewSection';
import CalendarSection from './provdashcomponents/CalendarSection/CalendarSection';
import ServicesSection from './provdashcomponents/ServicesSection/ServicesSection';
import NavButton from './provdashcomponents/NavButton';
import UserDropdown from './provdashcomponents/UserDropdown';
import ProfileModal from './provdashcomponents/ProfileModal';
import PasswordModal from './provdashcomponents/PasswordModal';

export default function ProvDash() {
    const [activeTab, setActiveTab] = useState('overview');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const { setIsAuthenticated } = useAuth();
    const user = getUserFromToken();
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    // Provider profile state
    const [providerProfile, setProviderProfile] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileFormData, setProfileFormData] = useState({ name: '', phone: '', description: '' });
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState(null);
    const [profileSuccess, setProfileSuccess] = useState(null);
    const [pictureUploading, setPictureUploading] = useState(false);
    const [pictureError, setPictureError] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordFormData, setPasswordFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordError, setPasswordError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(null);

    // Fetch provider profile on mount
    useEffect(() => {
        fetchProviderProfile();
    }, []);

    const fetchProviderProfile = async () => {
        try {
            const response = await authApi.get('/api/salon/me');
            const data = await response.json();
            if (data.success) setProviderProfile(data.provider);
        } catch (error) {
            console.error('Error fetching provider profile:', error);
        }
    };

    const getProviderInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const openProfileModal = () => {
        if (providerProfile) {
            setProfileFormData({
                name: providerProfile.name || '',
                phone: providerProfile.phone || '',
                description: providerProfile.description || ''
            });
        }
        setProfileError(null);
        setProfileSuccess(null);
        setPictureError(null);
        setShowProfileModal(true);
        setIsDropdownOpen(false);
    };

    const handleProviderProfileSave = async () => {
        if (!profileFormData.name.trim()) { setProfileError('A név megadása kötelező'); return; }
        if (!profileFormData.phone.trim()) { setProfileError('A telefonszám megadása kötelező'); return; }
        const phoneRegex = /^[\d\s+()-]+$/;
        if (!phoneRegex.test(profileFormData.phone.trim())) { setProfileError('Érvénytelen telefonszám formátum'); return; }

        setProfileSaving(true);
        setProfileError(null);
        try {
            const response = await authApi.put('/api/salon/me', {
                name: profileFormData.name.trim(),
                phone: profileFormData.phone.trim(),
                description: profileFormData.description.trim() || null
            });
            const data = await response.json();
            if (data.success) {
                setProviderProfile(data.provider);
                setProfileSuccess('Profil sikeresen frissítve!');
                setTimeout(() => setProfileSuccess(null), 3000);
            } else {
                setProfileError(data.message || 'Hiba történt a mentés során');
            }
        } catch {
            setProfileError('Hiba történt a mentés során');
        } finally {
            setProfileSaving(false);
        }
    };

    const handleProviderPictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) { setPictureError('Csak JPG, PNG és WebP fájlok engedélyezettek'); return; }
        if (file.size > 5 * 1024 * 1024) { setPictureError('A fájl mérete nem haladhatja meg az 5MB-ot'); return; }

        setPictureUploading(true);
        setPictureError(null);
        try {
            const formData = new FormData();
            formData.append('profilePicture', file);
            const response = await authApi.upload('/api/salon/me/picture', formData);
            const data = await response.json();
            if (data.success) {
                setProviderProfile(prev => ({ ...prev, profile_picture_url: data.profile_picture_url }));
                setProfileSuccess('Profilkép sikeresen frissítve!');
                setTimeout(() => setProfileSuccess(null), 3000);
            } else {
                setPictureError(data.message || 'Hiba történt a kép feltöltésekor');
            }
        } catch {
            setPictureError('Hiba történt a kép feltöltésekor');
        } finally {
            setPictureUploading(false);
            e.target.value = '';
        }
    };

    const openPasswordModal = () => {
        setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordError(null);
        setPasswordSuccess(null);
        setShowPasswordModal(true);
    };

    const handleProviderPasswordChange = async () => {
        if (!passwordFormData.currentPassword || !passwordFormData.newPassword || !passwordFormData.confirmPassword) { setPasswordError('Minden mező kitöltése kötelező'); return; }
        if (passwordFormData.newPassword.length < 6) { setPasswordError('Az új jelszónak legalább 6 karakter hosszúnak kell lennie'); return; }
        if (passwordFormData.newPassword !== passwordFormData.confirmPassword) { setPasswordError('Az új jelszavak nem egyeznek'); return; }

        setPasswordSaving(true);
        setPasswordError(null);
        try {
            const response = await authApi.put('/api/salon/me/password', passwordFormData);
            const data = await response.json();
            if (data.success) {
                setPasswordSuccess('Jelszó sikeresen megváltoztatva!');
                setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setTimeout(() => { setShowPasswordModal(false); setPasswordSuccess(null); }, 2000);
            } else {
                setPasswordError(data.message || 'Hiba történt a jelszó módosítása során');
            }
        } catch {
            setPasswordError('Hiba történt a jelszó módosítása során');
        } finally {
            setPasswordSaving(false);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        logout();
        setIsAuthenticated(false);
        navigate('/');
    };
    
    const renderContent = () => {
        switch(activeTab) {
            case 'overview': return <OverviewSection />;
            case 'calendar': return <CalendarSection />;
            case 'services': return <ServicesSection />;
            case 'availability': return <AvailabilityManagement />;
            case 'salon': return <SalonManagement />;
            default: return <OverviewSection />;
        }
    };

    return (
        <div className="min-h-screen bg-base-blue flex flex-col font-sans text-gray-900">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/30 backdrop-blur-md border-b border-white/40 shadow-sm flex items-center justify-between px-4 sm:px-6">
                <div className="h-10 flex items-center">
                    <Logo className="h-full w-auto object-contain cursor-pointer" />
                </div>
                
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 focus:outline-none group"
                    >
                        <span className="hidden sm:block text-sm font-medium text-gray-700 group-hover:text-dark-blue transition-colors">
                            Üdv, {providerProfile?.name || user?.name || 'Szolgáltató'}
                        </span>
                        {providerProfile?.profile_picture_url ? (
                            <img src={`${apiUrl}${providerProfile.profile_picture_url}`} alt="Profil" className="w-10 h-10 rounded-full object-cover shadow-lg hover:shadow-xl hover:scale-105 transition-all border-2 border-white/50 cursor-pointer" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dark-blue to-blue-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm font-bold border-2 border-white/50 cursor-pointer">
                                {getProviderInitials(providerProfile?.name || user?.name)}
                            </div>
                        )}
                    </button>

                    <UserDropdown 
                        isOpen={isDropdownOpen} 
                        onLogout={handleLogout}
                        onProfileEdit={openProfileModal}
                        providerProfile={providerProfile}
                    />
                </div>
            </header>

            <div className="flex flex-1 pt-16 h-screen overflow-hidden">
                {/* Desktop Sidebar */}
                <aside className="hidden md:flex w-72 flex-col bg-white/30 backdrop-blur-md border-r border-white/40 h-full p-6 gap-3 z-40 transition-all">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">Menü</p>
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="overview" 
                        label="Áttekintés" 
                        icon={<OverviewIcon />} 
                        onClick={setActiveTab} 
                    />
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="calendar" 
                        label="Naptár" 
                        icon={<CalendarIcon />} 
                        onClick={setActiveTab} 
                    />
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="services" 
                        label="Szolgáltatások" 
                        icon={<ServicesIcon />} 
                        onClick={setActiveTab} 
                    />
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="availability" 
                        label="Elérhetőség" 
                        icon={<HourIcon />} 
                        onClick={setActiveTab} 
                    />
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="salon" 
                        label="Szalon kezelés" 
                        icon={<SalonIcon />} 
                        onClick={setActiveTab} 
                    />
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 scroll-smooth">
                    <div className="max-w-6xl mx-auto animate-fade-in">
                        {renderContent()}
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/50 p-2 pb-safe z-50 flex justify-around items-center shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="overview" 
                        label="Áttekintés" 
                        icon={<OverviewIcon />} 
                        onClick={setActiveTab} 
                        isMobile={true}
                    />
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="calendar" 
                        label="Naptár" 
                        icon={<CalendarIcon />} 
                        onClick={setActiveTab} 
                        isMobile={true}
                    />
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="services" 
                        label="Szolgáltatások" 
                        icon={<ServicesIcon />} 
                        onClick={setActiveTab} 
                        isMobile={true}
                    />
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="availability" 
                        label="Elérhetőség" 
                        icon={<HourIcon />} 
                        onClick={setActiveTab} 
                        isMobile={true}
                    />
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="salon" 
                        label="Szalon" 
                        icon={<SalonIcon />} 
                        onClick={setActiveTab} 
                        isMobile={true}
                    />
                </nav>
            </div>

            <ProfileModal 
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                providerProfile={providerProfile}
                profileFormData={profileFormData}
                setProfileFormData={setProfileFormData}
                profileSaving={profileSaving}
                profileError={profileError}
                profileSuccess={profileSuccess}
                pictureUploading={pictureUploading}
                pictureError={pictureError}
                onSave={handleProviderProfileSave}
                onPictureUpload={handleProviderPictureUpload}
                onPasswordModalOpen={openPasswordModal}
            />

            <PasswordModal 
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                passwordFormData={passwordFormData}
                setPasswordFormData={setPasswordFormData}
                passwordSaving={passwordSaving}
                passwordError={passwordError}
                passwordSuccess={passwordSuccess}
                onSave={handleProviderPasswordChange}
            />
        </div>
    );
}
