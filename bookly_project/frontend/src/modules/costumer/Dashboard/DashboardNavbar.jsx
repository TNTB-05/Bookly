import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../auth/auth';
import NavItem from './NavItem';
import Logo from '../../Logo';
import ProfileIcon from '../../../icons/ProfileIcon';
import ExitIcon from '../../../icons/ExitIcon';

export default function DashboardNavbar({ activeTab, setActiveTab, user }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        localStorage.removeItem('accessToken');
        navigate('/');
    }

    return (
        <>
            {/* Desktop/Tablet Header */}
            <nav className="bg-white/30 backdrop-blur-md shadow-sm fixed w-full z-30 top-0 border-b border-white/40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 relative">
                        <div className="flex items-center">
                            <div className="shrink-0 flex items-center">
                                <Logo className="h-10 w-auto cursor-pointer" />
                            </div>
                        </div>

                        <div className="hidden sm:flex sm:space-x-8 gap-10 h-full items-center absolute left-1/2 -translate-x-1/2">
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
                                label="Mentett helyek"
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                setIsMobileMenuOpen={setIsMobileMenuOpen}
                            />
                        </div>

                        {/* User Menu & Logout */}
                        <div className="hidden sm:ml-6 sm:flex sm:items-center gap-4">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className="flex items-center gap-3 group px-3 py-2 rounded-lg hover:bg-blue-50 transition-all"
                                title="Profilom"
                            >
                                <div
                                    className={`w-9 h-9 transition-all ${activeTab === 'profile' ? 'text-blue-600 scale-110' : 'text-gray-600 group-hover:text-blue-600 group-hover:scale-110'}`}
                                >
                                    <ProfileIcon />
                                </div>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-9 h-9 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110 p-1"
                                title="Kijelentkezés"
                            >
                                <ExitIcon />
                            </button>
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
                    label="Mentett"
                    icon="➕"
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                    isMobile={true}
                />
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg transition-all ${
                        activeTab === 'profile' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    <div className="w-6 h-6 flex items-center justify-center">
                        <ProfileIcon />
                    </div>
                    <span className="text-xs font-medium">Profil</span>
                </button>
            </nav>
        </>
    );
}
