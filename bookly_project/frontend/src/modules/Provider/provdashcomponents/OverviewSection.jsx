import { useState, useEffect } from 'react';
import { authApi } from '../../auth/auth';
import CalendarIcon from '../../../icons/CalendarIcon';
import CurrencyIcon from '../../../icons/CurrencyIcon';
import UsersIcon from '../../../icons/UsersIcon';
import { SkeletonStat, SkeletonCard, SkeletonAvatar, SkeletonText } from '../../../components/skeletons';

const OverviewSection = () => {
    const [statistics, setStatistics] = useState({
        todayAppointments: 0,
        weeklyRevenue: 0,
        newCustomers: 0,
        upcomingAppointments: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStatistics();
    }, []);

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            const response = await authApi.get('/api/provider/calendar/statistics');
            const data = await response.json();
            if (data.success) {
                setStatistics(data.statistics);
            }
        } catch (error) {
            console.error('Error fetching statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('hu-HU').format(price);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('hu-HU', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Budapest'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'bg-green-100 text-green-700';
            case 'completed': return 'bg-blue-100 text-blue-700';
            case 'canceled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'scheduled': return 'Megerősítve';
            case 'completed': return 'Teljesítve';
            case 'canceled': return 'Törölve';
            default: return status;
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return parts[0][0] + parts[1][0];
        }
        return name.substring(0, 2).toUpperCase();
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array(3).fill(0).map((_, i) => (
                        <SkeletonStat key={i} />
                    ))}
                </div>
                <div className="space-y-3">
                    {Array(3).fill(0).map((_, i) => (
                        <SkeletonCard key={i} className="p-4">
                            <div className="flex items-center gap-4">
                                <SkeletonAvatar size="md" />
                                <div className="flex-1">
                                    <SkeletonText lines={2} />
                                </div>
                            </div>
                        </SkeletonCard>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-dark-blue">Áttekintés</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-600 font-medium">Mai Foglalások</h3>
                            <p className="text-4xl font-bold text-dark-blue mt-2">{statistics.todayAppointments}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <CalendarIcon className="text-dark-blue" />
                        </div>
                    </div>
                </div>
                <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-600 font-medium">Heti Bevétel</h3>
                            <p className="text-4xl font-bold text-dark-blue mt-2">{formatPrice(statistics.weeklyRevenue)} Ft</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <CurrencyIcon className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-600 font-medium">Új Ügyfelek</h3>
                            <p className="text-4xl font-bold text-dark-blue mt-2">{statistics.newCustomers}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <UsersIcon className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50">
                <h3 className="text-xl font-bold text-dark-blue mb-4">Következő Időpontok</h3>
                {statistics.upcomingAppointments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Nincsenek közelgő időpontok</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {statistics.upcomingAppointments.map((appointment) => (
                            <div key={appointment.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dark-blue to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                        {getInitials(appointment.user_name)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{appointment.user_name}</p>
                                        <p className="text-sm text-gray-600">
                                            {appointment.service_name} • {formatDate(appointment.appointment_start)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold text-dark-blue">
                                        {formatPrice(appointment.price)} Ft
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                        {getStatusText(appointment.status)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OverviewSection;
