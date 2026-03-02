import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../auth/auth';
import NavItem from './NavItem';
import Logo from '../../Logo';

// Ikonok
import ProfileIcon from '../../../icons/ProfileIcon';
import ExitIcon from '../../../icons/ExitIcon';


// Navigációs sáv komponens - desktop és mobil nézet
export default function DashboardNavbar({ activeTab, setActiveTab, user, userProfile, messagesUnread = 0 }) {
    // UseState változók a menü kezeléséhez
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const desktopDropdownRef = useRef(null);
    const mobileDropdownRef = useRef(null);
    const navigate = useNavigate();

    // Legördülő menü bezárása kívüli kattintásra
    useEffect(() => {
        function handleClickOutside(event) {
            const clickedOutsideDesktop = desktopDropdownRef.current && !desktopDropdownRef.current.contains(event.target);
            const clickedOutsideMobile = mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target);
            
            if (clickedOutsideDesktop && clickedOutsideMobile) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Kijelentkezés kezelése
    async function handleLogout() {
        await logout();
        navigate('/');
    }

    return (
        <>
            {/* Desktop/Tablet Header */}
            <nav className="hidden sm:block bg-white/30 backdrop-blur-md shadow-sm fixed w-full z-30 top-0 border-b border-white/40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 relative">
                        <div className="flex items-center">
                            <div className="shrink-0 flex items-center">
                                <Logo className="h-10 w-auto cursor-pointer" />
                            </div>
                        </div>

                        <div className="flex sm:space-x-8 gap-10 h-full items-center absolute left-1/2 -translate-x-1/2">
                            <NavItem
                                tab="overview"
                                label="Áttekintés"
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                setIsMobileMenuOpen={setIsMobileMenuOpen}
                            />
                            <NavItem
                                tab="appointments"
                                label="Foglalásaim"
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                setIsMobileMenuOpen={setIsMobileMenuOpen}
                            />
                            <NavItem
                                tab="book"
                                label="Helyeim"
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                setIsMobileMenuOpen={setIsMobileMenuOpen}
                            />
                            <div className="relative">
                                <NavItem
                                    tab="messages"
                                    label="Üzenetek"
                                    activeTab={activeTab}
                                    setActiveTab={setActiveTab}
                                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                                />
                                {messagesUnread > 0 && (
                                    <span className="absolute -top-1 -right-3 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                                        {messagesUnread > 9 ? '9+' : messagesUnread}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Desktop Profile Dropdown */}
                        <div className="ml-6 flex items-center relative" ref={desktopDropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-3 group px-3 py-2 rounded-lg hover:bg-blue-50 transition-all"
                            >
                                <span className="text-sm font-medium text-gray-700 group-hover:text-dark-blue transition-colors">
                                    {userProfile?.name || user?.name || 'Felhasználó'}
                                </span>
                                {userProfile?.profile_picture_url ? (
                                    <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${userProfile.profile_picture_url}`} alt="Profil" className="w-10 h-10 rounded-full object-cover shadow-lg hover:shadow-xl transition-all" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-dark-blue text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all text-sm font-bold">
                                        {(userProfile?.name || user?.name)?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute top-14 right-0 w-56 bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl overflow-hidden z-50">
                                    <div className="px-4 py-2 border-b border-gray-200">
                                        <p className="text-xs font-semibold text-gray-900 truncate">{userProfile?.name || user?.name || 'Felhasználó'}</p>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsDropdownOpen(false);
                                                setTimeout(() => setActiveTab('profile'), 10);
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-dark-blue rounded-lg transition-colors flex items-center gap-3"
                                        >
                                            <div className="w-5 h-5">
                                                <ProfileIcon />
                                            </div>
                                            Profil
                                        </button>
                                        <div className="border-t border-gray-200 my-1"></div>
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                setIsDropdownOpen(false);
                                                await handleLogout();
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors flex items-center gap-3"
                                        >
                                            <div className="w-5 h-5">
                                                <ExitIcon />
                                            </div>
                                            Kijelentkezés
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Header - Top */}
            <nav className="sm:hidden bg-white/30 backdrop-blur-md shadow-sm fixed w-full z-30 top-0 border-b border-white/40">
                <div className="px-4 py-3">
                    <div className="flex justify-between items-center">
                        <Logo className="h-10 w-auto cursor-pointer" />

                        {/* Mobile Profile Dropdown */}
                        <div className="relative" ref={mobileDropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-10 h-10 rounded-full overflow-hidden shadow-lg hover:shadow-xl transition-all"
                            >
                                {userProfile?.profile_picture_url ? (
                                    <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${userProfile.profile_picture_url}`} alt="Profil" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-dark-blue text-white flex items-center justify-center text-sm font-bold">
                                        {(userProfile?.name || user?.name)?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute top-12 right-0 w-56 bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl overflow-hidden z-50">
                                    <div className="px-4 py-2 border-b border-gray-200">
                                        <p className="text-xs font-semibold text-gray-900 truncate">{userProfile?.name || user?.name || 'Felhasználó'}</p>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsDropdownOpen(false);
                                                setTimeout(() => setActiveTab('profile'), 10);
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-dark-blue rounded-lg transition-colors flex items-center gap-3"
                                        >
                                            <div className="w-5 h-5">
                                                <ProfileIcon />
                                            </div>
                                            Profil
                                        </button>
                                        <div className="border-t border-gray-200 my-1"></div>
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                setIsDropdownOpen(false);
                                                await handleLogout();
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors flex items-center gap-3"
                                        >
                                            <div className="w-5 h-5">
                                                <ExitIcon />
                                            </div>
                                            Kijelentkezés
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Navigation */}
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/50 p-2 pb-safe z-50 flex justify-around items-center shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
                <NavItem
                    tab="overview"
                    label="Áttekintés"
                    icon="🏠"
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                    isMobile={true}
                />
                <NavItem
                    tab="appointments"
                    label="Foglalásaim"
                    icon="📅"
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                    isMobile={true}
                />
                <NavItem
                    tab="book"
                    label="Helyeim"
                    icon="➕"
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                    isMobile={true}
                />
                <div className="relative">
                    <NavItem
                        tab="messages"
                        label="Üzenetek"
                        icon="💬"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        setIsMobileMenuOpen={setIsMobileMenuOpen}
                        isMobile={true}
                    />
                    {messagesUnread > 0 && (
                        <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold pointer-events-none">
                            {messagesUnread > 9 ? '9+' : messagesUnread}
                        </span>
                    )}
                </div>
            </nav>
        </>
    );
}
