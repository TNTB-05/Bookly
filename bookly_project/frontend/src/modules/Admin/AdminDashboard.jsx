import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, getUserFromToken, logout } from '../auth/auth';
import UserManagement from './UserManagement';
import ProviderManagement from './ProviderManagement';
import SalonManagement from './SalonManagement';
import AppointmentManagement from './AppointmentManagement';
import SystemLogs from './SystemLogs';

// Stat card component
function StatCard({ title, value, icon, color = 'blue', subtitle }) {
    const colorMap = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-emerald-500 to-emerald-600',
        purple: 'from-purple-500 to-purple-600',
        amber: 'from-amber-500 to-amber-600',
        rose: 'from-rose-500 to-rose-600',
        cyan: 'from-cyan-500 to-cyan-600',
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
                </div>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorMap[color]} flex items-center justify-center flex-shrink-0`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

// Sidebar navigation item
function NavItem({ label, icon, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${active
                    ? 'bg-amber-500/10 text-amber-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
        >
            <span className="w-5 h-5 flex-shrink-0">{icon}</span>
            <span className="flex-1 text-left">{label}</span>
        </button>
    );
}

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [recentAppointments, setRecentAppointments] = useState([]);
    const [topSalons, setTopSalons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeSection, setActiveSection] = useState('dashboard');
    const navigate = useNavigate();
    const user = getUserFromToken();

    useEffect(() => {
        fetchStatistics();
    }, []);

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await authApi.get('/api/admin/statistics');
            const data = await response.json();

            if (data.success) {
                setStats(data.stats);
                setRecentAppointments(data.recentAppointments || []);
                setTopSalons(data.topSalons || []);
            } else {
                setError(data.message || 'Hiba a statisztikák betöltésekor');
            }
        } catch (err) {
            console.error('Error fetching admin statistics:', err);
            setError('Hiba a szerverhálózattal');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/admin/login');
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('hu-HU').format(price || 0) + ' Ft';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('hu-HU', {
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        return timeString.slice(0, 5);
    };

    const statusLabels = {
        scheduled: { text: 'Foglalt', color: 'bg-blue-100 text-blue-700' },
        completed: { text: 'Teljesült', color: 'bg-green-100 text-green-700' },
        canceled: { text: 'Lemondva', color: 'bg-red-100 text-red-700' },
        no_show: { text: 'Nem jelent meg', color: 'bg-gray-100 text-gray-700' },
    };

    // Icons
    const icons = {
        users: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
        ),
        providers: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
        ),
        salons: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72" />
            </svg>
        ),
        calendar: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
        ),
        revenue: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
        ),
        newUsers: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
        ),
        dashboard: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
        ),
        star: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
        ),
        logs: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
        ),
    };

    // Loading skeleton
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-600">Statisztikák betöltése...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
                {/* Logo area */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">Bookly Admin</p>
                            <p className="text-xs text-gray-500">Adminisztráció</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                    <NavItem
                        label="Áttekintés"
                        icon={icons.dashboard}
                        active={activeSection === 'dashboard'}
                        onClick={() => setActiveSection('dashboard')}
                    />
                    <NavItem
                        label="Felhasználók"
                        icon={icons.users}
                        active={activeSection === 'users'}
                        onClick={() => setActiveSection('users')}
                    />
                    <NavItem
                        label="Szolgáltatók"
                        icon={icons.providers}
                        active={activeSection === 'providers'}
                        onClick={() => setActiveSection('providers')}
                    />
                    <NavItem
                        label="Szalonok"
                        icon={icons.salons}
                        active={activeSection === 'salons'}
                        onClick={() => setActiveSection('salons')}
                    />
                    <NavItem
                        label="Foglalások"
                        icon={icons.calendar}
                        active={activeSection === 'appointments'}
                        onClick={() => setActiveSection('appointments')}
                    />
                    <NavItem
                        label="Naplók"
                        icon={icons.logs}
                        active={activeSection === 'logs'}
                        onClick={() => setActiveSection('logs')}
                    />
                </nav>

                {/* User/Logout */}
                <div className="p-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                            <span className="text-amber-700 font-bold text-sm">
                                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Admin'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                        Kijelentkezés
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64">
                {/* Top bar */}
                <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                {activeSection === 'dashboard' && 'Áttekintés'}
                                {activeSection === 'users' && 'Felhasználók'}
                                {activeSection === 'providers' && 'Szolgáltatók'}
                                {activeSection === 'salons' && 'Szalonok'}
                                {activeSection === 'appointments' && 'Foglalások'}
                                {activeSection === 'logs' && 'Rendszer naplók'}
                            </h1>
                            <p className="text-sm text-gray-500">
                                {activeSection === 'dashboard' && `Üdvözöljük, ${user?.name || 'Admin'}!`}
                                {activeSection === 'users' && 'Felhasználók kezelése és moderálása'}
                                {activeSection === 'providers' && 'Szolgáltatók kezelése és moderálása'}
                                {activeSection === 'salons' && 'Szalonok áttekintése és moderálása'}
                                {activeSection === 'appointments' && 'Összes foglalás kezelése'}
                                {activeSection === 'logs' && 'Rendszeresemények és auditnapló'}
                            </p>
                        </div>
                        {activeSection === 'dashboard' && (
                            <button
                                onClick={fetchStatistics}
                                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                                </svg>
                                Frissítés
                            </button>
                        )}
                    </div>
                </header>

                {/* Content Area */}
                <div className="p-6">
                    {/* Section: Users */}
                    {activeSection === 'users' && <UserManagement />}

                    {/* Section: Providers */}
                    {activeSection === 'providers' && <ProviderManagement />}

                    {/* Section: Salons */}
                    {activeSection === 'salons' && <SalonManagement />}

                    {/* Section: Appointments */}
                    {activeSection === 'appointments' && <AppointmentManagement />}

                    {/* Section: Logs */}
                    {activeSection === 'logs' && <SystemLogs />}

                    {/* Section: Dashboard Overview */}
                    {activeSection === 'dashboard' && (<>
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    {stats && (
                        <>
                            {/* Primary Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <StatCard
                                    title="Felhasználók"
                                    value={stats.totalUsers}
                                    icon={icons.users}
                                    color="blue"
                                    subtitle="Aktív ügyfelek"
                                />
                                <StatCard
                                    title="Szolgáltatók"
                                    value={stats.totalProviders}
                                    icon={icons.providers}
                                    color="purple"
                                    subtitle="Aktív szolgáltatók"
                                />
                                <StatCard
                                    title="Szalonok"
                                    value={stats.totalSalons}
                                    icon={icons.salons}
                                    color="green"
                                    subtitle="Nyitott szalonok"
                                />
                                <StatCard
                                    title="Foglalások (havi)"
                                    value={stats.appointmentsThisMonth}
                                    icon={icons.calendar}
                                    color="amber"
                                    subtitle={`Összes: ${stats.totalAppointments}`}
                                />
                            </div>

                            {/* Secondary Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                <StatCard
                                    title="Összes bevétel"
                                    value={formatPrice(stats.totalRevenue)}
                                    icon={icons.revenue}
                                    color="rose"
                                    subtitle="Teljesült foglalásokból"
                                />
                                <StatCard
                                    title="Új felhasználók"
                                    value={stats.newRegistrations?.users || 0}
                                    icon={icons.newUsers}
                                    color="cyan"
                                    subtitle="Utolsó 7 napban"
                                />
                                <StatCard
                                    title="Új szolgáltatók"
                                    value={stats.newRegistrations?.providers || 0}
                                    icon={icons.providers}
                                    color="purple"
                                    subtitle="Utolsó 7 napban"
                                />
                            </div>

                            {/* Appointment Status Breakdown */}
                            {stats.appointmentsByStatus && Object.keys(stats.appointmentsByStatus).length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Foglalások állapot szerint</h2>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {Object.entries(stats.appointmentsByStatus).map(([status, count]) => {
                                            const label = statusLabels[status] || { text: status, color: 'bg-gray-100 text-gray-700' };
                                            return (
                                                <div key={status} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${label.color}`}>
                                                        {label.text}
                                                    </span>
                                                    <span className="text-lg font-bold text-gray-900">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Two Column Layout: Recent Appointments + Top Salons */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Recent Appointments */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Legutóbbi foglalások</h2>
                                    {recentAppointments.length === 0 ? (
                                        <p className="text-gray-500 text-sm">Nincsenek foglalások</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {recentAppointments.map((apt) => {
                                                const label = statusLabels[apt.status] || { text: apt.status, color: 'bg-gray-100 text-gray-700' };
                                                return (
                                                    <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {apt.customer_name || 'Vendég'}
                                                            </p>
                                                            <p className="text-xs text-gray-500 truncate">
                                                                {apt.salon_name} &middot; {apt.service_name || 'Szolgáltatás'}
                                                            </p>
                                                        </div>
                                                        <div className="text-right ml-3 flex-shrink-0">
                                                            <p className="text-xs text-gray-600">
                                                                {formatDate(apt.appointment_start)}
                                                            </p>
                                                            <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${label.color}`}>
                                                                {label.text}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Top Rated Salons */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Legjobb szalonok</h2>
                                    {topSalons.length === 0 ? (
                                        <p className="text-gray-500 text-sm">Nincsenek értékelt szalonok</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {topSalons.map((salon, index) => (
                                                <div key={salon.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                                    <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                        {index + 1}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{salon.name}</p>
                                                        <p className="text-xs text-gray-500 truncate">{salon.address}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-amber-400">
                                                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="text-sm font-semibold text-gray-700">
                                                            {parseFloat(salon.average_rating || 0).toFixed(1)}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            ({salon.rating_count || 0})
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Monthly Revenue Trend */}
                            {stats.monthlyRevenue && stats.monthlyRevenue.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mt-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Havi bevétel trend</h2>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                        {stats.monthlyRevenue.map((m) => {
                                            const [year, month] = m.month.split('-');
                                            const monthName = new Date(year, parseInt(month) - 1).toLocaleDateString('hu-HU', { month: 'short' });
                                            return (
                                                <div key={m.month} className="text-center p-3 rounded-lg bg-gray-50">
                                                    <p className="text-xs text-gray-500 uppercase">{monthName} {year}</p>
                                                    <p className="text-lg font-bold text-gray-900 mt-1">
                                                        {new Intl.NumberFormat('hu-HU', { notation: 'compact' }).format(m.revenue)}
                                                    </p>
                                                    <p className="text-xs text-gray-400">{m.appointment_count} foglalás</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    </>)}
                </div>
            </main>
        </div>
    );
}
