import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, getUserFromToken, logout } from '../auth/auth';
import UserManagement from './UserManagement';
import ProviderManagement from './ProviderManagement';
import SalonManagement from './SalonManagement';
import AppointmentManagement from './AppointmentManagement';
import RatingManagement from './RatingManagement';
import SystemLogs from './SystemLogs';
import RefreshIcon from '../../icons/RefreshIcon';
import UsersIcon from '../../icons/UsersIcon';
import BriefcaseIcon from '../../icons/BriefcaseIcon';
import StorefrontIcon from '../../icons/StorefrontIcon';
import CalendarIcon from '../../icons/CalendarIcon';
import BanknoteIcon from '../../icons/BanknoteIcon';
import UserPlusIcon from '../../icons/UserPlusIcon';
import OverviewIcon from '../../icons/OverviewIcon';
import StarOutlineIcon from '../../icons/StarOutlineIcon';
import DocumentIcon from '../../icons/DocumentIcon';
import ShieldCheckIcon from '../../icons/ShieldCheckIcon';
import LogoutIcon from '../../icons/LogoutIcon';
import StarFilledIcon from '../../icons/StarFilledIcon';

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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
                </div>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorMap[color]} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

// Sidebar navigation item
function NavItem({ icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                ${active
                    ? 'bg-amber-500/10 text-amber-600 border-l-[3px] border-amber-500 pl-[9px]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-[3px] border-transparent pl-[9px]'
                }`}
        >
            {icon && <span className="w-5 h-5 shrink-0 flex items-center justify-center">{icon}</span>}
            {label}
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
        users: <UsersIcon className="w-5 h-5 text-white" />,
        providers: <BriefcaseIcon className="w-5 h-5 text-white" />,
        salons: <StorefrontIcon className="w-5 h-5 text-white" />,
        calendar: <CalendarIcon className="w-5 h-5 text-white" />,
        revenue: <BanknoteIcon className="w-5 h-5 text-white" />,
        newUsers: <UserPlusIcon className="w-5 h-5 text-white" />,
        dashboard: <OverviewIcon className="w-5 h-5" />,
        star: <StarOutlineIcon className="w-5 h-5" />,
        logs: <DocumentIcon className="w-5 h-5" />,
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
            <aside className="w-64 bg-white border-r-2 border-gray-200 shadow-sm flex flex-col fixed h-full">
                {/* Logo area */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                            <ShieldCheckIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">Bookly Admin</p>
                            <p className="text-xs text-gray-500">Adminisztráció</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    <NavItem
                        icon={<OverviewIcon className="w-5 h-5" />}
                        label="Áttekintés"
                        active={activeSection === 'dashboard'}
                        onClick={() => setActiveSection('dashboard')}
                    />

                    <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Kezelés</p>

                    <NavItem
                        icon={<UsersIcon className="w-5 h-5" />}
                        label="Felhasználók"
                        active={activeSection === 'users'}
                        onClick={() => setActiveSection('users')}
                    />
                    <NavItem
                        icon={<BriefcaseIcon className="w-5 h-5" />}
                        label="Szolgáltatók"
                        active={activeSection === 'providers'}
                        onClick={() => setActiveSection('providers')}
                    />
                    <NavItem
                        icon={<StorefrontIcon className="w-5 h-5" />}
                        label="Szalonok"
                        active={activeSection === 'salons'}
                        onClick={() => setActiveSection('salons')}
                    />
                    <NavItem
                        icon={<CalendarIcon className="w-5 h-5" />}
                        label="Foglalások"
                        active={activeSection === 'appointments'}
                        onClick={() => setActiveSection('appointments')}
                    />
                    <NavItem
                        icon={<StarOutlineIcon className="w-5 h-5" />}
                        label="Értékelések"
                        active={activeSection === 'ratings'}
                        onClick={() => setActiveSection('ratings')}
                    />

                    <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Rendszer</p>

                    <NavItem
                        icon={<DocumentIcon className="w-5 h-5" />}
                        label="Naplók"
                        active={activeSection === 'logs'}
                        onClick={() => setActiveSection('logs')}
                    />
                </nav>

                {/* User/Logout */}
                <div className="p-3 border-t border-gray-200">
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
                        <LogoutIcon className="w-5 h-5" />
                        Kijelentkezés
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64">
                {/* Top bar */}
                <header className="bg-white border-b-2 border-gray-200 shadow-sm px-6 py-4 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                {activeSection === 'dashboard' && 'Áttekintés'}
                                {activeSection === 'users' && 'Felhasználók'}
                                {activeSection === 'providers' && 'Szolgáltatók'}
                                {activeSection === 'salons' && 'Szalonok'}
                                {activeSection === 'appointments' && 'Foglalások'}
                                {activeSection === 'ratings' && 'Értékelések'}
                                {activeSection === 'logs' && 'Rendszer naplók'}
                            </h1>
                            <p className="text-sm text-gray-500">
                                {activeSection === 'dashboard' && `Üdvözöljük, ${user?.name || 'Admin'}!`}
                                {activeSection === 'users' && 'Felhasználók kezelése és moderálása'}
                                {activeSection === 'providers' && 'Szolgáltatók kezelése és moderálása'}
                                {activeSection === 'salons' && 'Szalonok áttekintése és moderálása'}
                                {activeSection === 'appointments' && 'Összes foglalás kezelése'}
                                {activeSection === 'ratings' && 'Értékelések áttekintése és moderálása'}
                                {activeSection === 'logs' && 'Rendszeresemények és auditnapló'}
                            </p>
                        </div>
                        {activeSection === 'dashboard' && (
                            <button
                                onClick={fetchStatistics}
                                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <RefreshIcon className="w-4 h-4" />
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

                    {/* Section: Ratings */}
                    {activeSection === 'ratings' && <RatingManagement />}

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
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
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
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
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
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
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
                                                        <StarFilledIcon className="w-4 h-4 text-amber-400" />
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
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mt-6">
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
