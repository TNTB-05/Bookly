import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../auth/auth';

import Logo from '../../Logo';
import NavItem from './NavItem';
import './Dashboard.css';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [providers, setProviders] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [serviceFilter, setServiceFilter] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    
    async function loadData() {
        try {
            const [userData, appointmentsData, providersData, servicesData] = await Promise.all([
                getCurrentUser(),
                getUserAppointments(),
                getProviders(),
                getServices()
            ]);

            setUser(userData);
            setAppointments(appointmentsData);
            setProviders(providersData);
            setServices(servicesData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleLogout() {
        await logout();
        localStorage.removeItem('accessToken');
        navigate('/');
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getStatusBadge(status) {
        const statusMap = {
            scheduled: { text: 'Várható', className: 'bg-blue-100 text-blue-800' },
            completed: { text: 'Elvégezve', className: 'bg-green-100 text-green-800' },
            canceled: { text: 'Lemondva', className: 'bg-red-100 text-red-800' },
            no_show: { text: 'Nem jelent meg', className: 'bg-orange-100 text-orange-800' }
        };
        const statusInfo = statusMap[status] || {
            text: status,
            className: 'bg-gray-100 text-gray-800'
        };
        return (
            <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.className}`}
            >
                {statusInfo.text}
            </span>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen text-2xl text-gray-600">
                Betöltés...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white shadow-sm fixed w-full z-30 top-0 border-b border-gray-200">
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
                                label="Új foglalás"
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
                                <div className="h-9 w-9 rounded-full bg-linear-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
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

                        {/* Mobile nézet gomb */}
                        <div className="flex items-center sm:hidden">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                            >
                                <span className="sr-only">Open main menu</span>
                                <svg
                                    className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                                <svg
                                    className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile nézet */}
                <div
                    className={`${isMobileMenuOpen ? 'block' : 'hidden'} sm:hidden bg-white border-b border-gray-200`}
                >
                    <div className="pt-2 pb-3 space-y-1">
                        <NavItem
                            tab="overview"
                            label="Áttekintés"
                            icon="🏠"
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            setIsMobileMenuOpen={setIsMobileMenuOpen}
                        />
                        <NavItem
                            tab="appointments"
                            label="Foglalásaim"
                            icon="📅"
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            setIsMobileMenuOpen={setIsMobileMenuOpen}
                        />
                        <NavItem
                            tab="book"
                            label="Új foglalás"
                            icon="➕"
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            setIsMobileMenuOpen={setIsMobileMenuOpen}
                        />
                        <NavItem
                            tab="profile"
                            label="Profil"
                            icon="👤"
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            setIsMobileMenuOpen={setIsMobileMenuOpen}
                        />
                    </div>
                    <div className="pt-4 pb-4 border-t border-gray-200">
                        <div className="flex items-center px-4">
                            <div className="shrink-0">
                                <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                                    {user?.name?.charAt(0)?.toUpperCase()}
                                </div>
                            </div>
                            <div className="ml-3">
                                <div className="text-base font-medium text-gray-800">
                                    {user?.name}
                                </div>
                                <div className="text-sm font-medium text-gray-500">
                                    {user?.email}
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="ml-auto shrink-0 p-1 text-gray-400 hover:text-red-600"
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
            </nav>

            {/* Főoldal */}
            <main className="pt-16 pb-12">
                <div className="animate-fade-in">
                    {/* ÁTTEKINTÉS TAB - Hero + Kiemelt szolgáltatól + Szolgáltatások */}
                    {activeTab === 'overview' && (
                        <div>
                            {/* Hero Section */}
                            <div className="bg-linear-to-r from-indigo-600 to-blue-500 text-white">
                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                                    <div className="text-center">
                                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
                                            Találd meg a tökéletes szolgáltatót
                                        </h1>
                                        <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
                                            Foglalj időpontot a legjobb szakemberekhez egyszerűen és
                                            gyorsan
                                        </p>
                                        <div className="max-w-xl mx-auto">
                                            <div className="flex items-center bg-white rounded-full shadow-lg overflow-hidden">
                                                <div className="pl-4">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-6 w-6 text-gray-400"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                                        />
                                                    </svg>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Keress szolgáltatót, szolgáltatást..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="flex-1 px-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none"
                                                />
                                                <button className="px-6 py-4 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors">
                                                    Keresés
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Kiemelt szolgáltatók */}
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            Kiemelt szolgáltatók
                                        </h2>
                                        <p className="text-gray-600 mt-1">
                                            A legjobban értékelt partnereink
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('book')}
                                        className="text-indigo-600 font-medium hover:text-indigo-800 flex items-center"
                                    >
                                        Összes megtekintése
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 ml-1"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {providers
                                        .filter(
                                            (p) =>
                                                searchQuery === '' ||
                                                p.name
                                                    .toLowerCase()
                                                    .includes(searchQuery.toLowerCase())
                                        )
                                        .slice(0, 4)
                                        .map((provider) => (
                                            <div
                                                key={provider.id}
                                                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                                            >
                                                <div className="h-24 bg-linear-to-r from-blue-500 to-indigo-600 relative">
                                                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                                                        <div className="w-16 h-16 rounded-full border-4 border-white bg-white flex items-center justify-center text-2xl font-bold text-indigo-600 shadow-md">
                                                            {provider.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="pt-10 p-4 text-center">
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                        {provider.name}
                                                    </h3>
                                                    <div className="flex items-center justify-center text-yellow-400 text-sm mb-2">
                                                        ★★★★★{' '}
                                                        <span className="text-gray-400 text-xs ml-1">
                                                            (24)
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => setActiveTab('book')}
                                                        className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
                                                    >
                                                        Megnézem
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    {providers.length === 0 && (
                                        <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                                            <p className="text-gray-500">
                                                Szolgáltatók betöltése...
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Szolgáltatások */}
                            <div className="bg-gray-100">
                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">
                                                Szolgáltatások
                                            </h2>
                                            <p className="text-gray-600 mt-1">
                                                Böngéssz szolgáltatásaink között
                                            </p>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {['all', 'hajvágás', 'manikűr', 'masszázs'].map(
                                                (filter) => (
                                                    <button
                                                        key={filter}
                                                        onClick={() => setServiceFilter(filter)}
                                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                                            serviceFilter === filter
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                                        }`}
                                                    >
                                                        {filter === 'all'
                                                            ? 'Összes'
                                                            : filter.charAt(0).toUpperCase() +
                                                              filter.slice(1)}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {services
                                            .filter(
                                                (s) =>
                                                    serviceFilter === 'all' ||
                                                    s.name?.toLowerCase().includes(serviceFilter)
                                            )
                                            .slice(0, 6)
                                            .map((service) => (
                                                <div
                                                    key={service.id}
                                                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                                                {service.name}
                                                            </h3>
                                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                                {service.description ||
                                                                    'Professzionális szolgáltatás'}
                                                            </p>
                                                            <div className="flex items-center text-gray-500 text-sm mb-3">
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="h-4 w-4 mr-1"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                    />
                                                                </svg>
                                                                {service.duration || 60} perc
                                                            </div>
                                                        </div>
                                                        <div className="text-right ml-4">
                                                            <p className="text-2xl font-bold text-indigo-600">
                                                                {service.price || 5000} Ft
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setActiveTab('book')}
                                                        className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors mt-2"
                                                    >
                                                        Foglalás
                                                    </button>
                                                </div>
                                            ))}
                                        {services.length === 0 && (
                                            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-12 w-12 mx-auto text-gray-400 mb-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                                    />
                                                </svg>
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    Szolgáltatások betöltése...
                                                </h3>
                                                <p className="text-gray-500 mt-1">
                                                    A szolgáltatások hamarosan megjelennek
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FOGLALÁSAIM TAB - Statisztikák + Összes foglalás */}
                    {activeTab === 'appointments' && (
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
                            {/* Welcome & Stats */}
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Üdvözöljük, {user?.name}!
                                </h1>
                                <p className="mt-2 text-gray-600">
                                    Itt láthatod a foglalásaid áttekintését.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                                Összes foglalás
                                            </p>
                                            <h3 className="text-3xl font-bold text-gray-900 mt-1">
                                                {appointments.length}
                                            </h3>
                                        </div>
                                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-8 w-8"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                                Aktív foglalás
                                            </p>
                                            <h3 className="text-3xl font-bold text-indigo-600 mt-1">
                                                {
                                                    appointments.filter(
                                                        (a) => a.status === 'scheduled'
                                                    ).length
                                                }
                                            </h3>
                                        </div>
                                        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-8 w-8"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                                Elvégzett
                                            </p>
                                            <h3 className="text-3xl font-bold text-green-600 mt-1">
                                                {
                                                    appointments.filter(
                                                        (a) => a.status === 'completed'
                                                    ).length
                                                }
                                            </h3>
                                        </div>
                                        <div className="p-3 bg-green-50 rounded-lg text-green-600">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-8 w-8"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Összes foglalás lista */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Összes foglalás
                                    </h2>
                                    <button
                                        onClick={() => setActiveTab('book')}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 mr-2"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 4v16m8-8H4"
                                            />
                                        </svg>
                                        Új foglalás
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {appointments.map((apt) => (
                                        <div
                                            key={apt.id}
                                            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 p-3 rounded-full bg-gray-100 hidden sm:block">
                                                    <span className="text-xl">📅</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900">
                                                        {apt.provider_name}
                                                    </h3>
                                                    <div className="flex items-center text-gray-700 mt-1">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="h-4 w-4 mr-1 text-gray-500"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                        {formatDate(apt.appointment_start)}
                                                    </div>
                                                    {apt.comment && (
                                                        <p className="text-gray-500 text-sm mt-1 italic">
                                                            "{apt.comment}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 mt-4 md:mt-0 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                                                {getStatusBadge(apt.status)}
                                                <p className="text-xl font-bold text-gray-900">
                                                    {apt.price} Ft
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {appointments.length === 0 && (
                                        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-12 w-12 mx-auto text-gray-400 mb-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                            <h3 className="text-lg font-medium text-gray-900">
                                                Még nincs foglalásod
                                            </h3>
                                            <p className="text-gray-500 mt-1">
                                                Foglalj időpontot szolgáltatásainkra!
                                            </p>
                                            <button
                                                onClick={() => setActiveTab('book')}
                                                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                                            >
                                                Új foglalás indítása
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ÚJ FOGLALÁS TAB */}
                    {activeTab === 'book' && (
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
                            <h1 className="text-3xl font-bold text-gray-900">Új foglalás</h1>
                            <p className="text-gray-600">Válassz szolgáltató partnereink közül.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {providers.map((provider) => (
                                    <div
                                        key={provider.id}
                                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                                    >
                                        <div className="h-32 bg-linear-to-r from-blue-500 to-indigo-600 relative">
                                            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                                                <div className="w-20 h-20 rounded-full border-4 border-white bg-white flex items-center justify-center text-3xl font-bold text-indigo-600 shadow-md">
                                                    {provider.name.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-12 p-6 text-center">
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                {provider.name}
                                            </h3>
                                            <div className="flex items-center justify-center text-yellow-400 mb-4 stars">
                                                ★★★★☆{' '}
                                                <span className="text-gray-400 text-xs ml-2">
                                                    (12)
                                                </span>
                                            </div>
                                            <p className="text-gray-600 mb-6 text-sm line-clamp-2 min-h-10">
                                                {provider.description}
                                            </p>
                                            <button className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm group-hover:shadow-md">
                                                Foglalás
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PROFIL TAB */}
                    {activeTab === 'profile' && (
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
                            <h1 className="text-3xl font-bold text-gray-900">Profilom</h1>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-3xl">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                    <h2 className="text-lg font-medium text-gray-800">
                                        Személyes adatok
                                    </h2>
                                    <button className="text-indigo-600 text-sm font-medium hover:text-indigo-800">
                                        Szerkesztés
                                    </button>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                Név
                                            </label>
                                            <p className="text-gray-900 font-medium text-lg border-b border-gray-100 pb-2">
                                                {user?.name}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                Email
                                            </label>
                                            <p className="text-gray-900 font-medium text-lg border-b border-gray-100 pb-2">
                                                {user?.email}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                Telefonszám
                                            </label>
                                            <p className="text-gray-900 font-medium text-lg border-b border-gray-100 pb-2">
                                                {user?.phone || 'Nincs megadva'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                Cím
                                            </label>
                                            <p className="text-gray-900 font-medium text-lg border-b border-gray-100 pb-2">
                                                {user?.address || 'Nincs megadva'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                Státusz
                                            </label>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800 mt-1">
                                                {user?.status}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                Regisztráció dátuma
                                            </label>
                                            <p className="text-gray-900 font-medium text-lg border-b border-gray-100 pb-2">
                                                {user?.created_at
                                                    ? formatDate(user.created_at)
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
