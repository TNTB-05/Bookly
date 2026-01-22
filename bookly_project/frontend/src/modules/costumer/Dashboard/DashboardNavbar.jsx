import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../auth/auth';
import NavItem from './NavItem';
import Logo from '../../Logo';

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
            <nav className="bg-white/30 backdrop-blur-[12px] shadow-sm fixed w-full z-30 top-0 border-b border-white/40">
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
                            <NavItem
                                tab="profile"
                                label="Profil"
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                setIsMobileMenuOpen={setIsMobileMenuOpen}
                            />
                        </div>

                        {/* User Menu & Logout */}
                        <div className="hidden sm:ml-6 sm:flex sm:items-center">
                            <div className="flex items-center space-x-4">
                                <div className="flex-col items-end hidden md:flex">
                                    <span className="text-sm font-medium text-gray-900">
                                        {user?.name}
                                    </span>
                                    <span className="text-xs text-gray-500">{user?.email}</span>
                                </div>
                                <div className="h-9 w-9 rounded-full bg-linear-to-br from-dark-blue to-blue-500 flex items-center justify-center text-white font-bold shadow-lg border-2 border-white/50">
                                    {user?.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 ml-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                                    title="Kijelentkezés"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-6 w-6"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                        />
                                    </svg>
                                </button>
                            </div>
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
                <NavItem
                    tab="profile"
                    label="Profil"
                    icon="👤"
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                    isMobile={true}
                />
            </nav>
        </>
    );
}
