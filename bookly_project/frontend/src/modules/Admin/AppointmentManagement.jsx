import { useState, useEffect } from 'react';
import { authApi } from '../auth/auth';

export default function AppointmentManagement() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => { fetchAppointments(); }, []);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const res = await authApi.get('/api/admin/appointments');
            const data = await res.json();
            if (data.success) setAppointments(data.appointments);
        } catch (err) {
            console.error('Error fetching appointments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (appointmentId) => {
        if (!confirm('Biztosan törölni szeretnéd ezt a foglalást? Ez a művelet nem vonható vissza!')) return;
        setActionLoading(true);
        try {
            const res = await authApi.delete(`/api/admin/appointments/${appointmentId}`);
            const data = await res.json();
            if (data.success) fetchAppointments();
        } catch (err) {
            console.error('Error deleting appointment:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredAppointments = appointments.filter(a => {
        const matchesSearch =
            a.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
            a.provider_name?.toLowerCase().includes(search.toLowerCase()) ||
            a.salon_name?.toLowerCase().includes(search.toLowerCase()) ||
            a.service_name?.toLowerCase().includes(search.toLowerCase()) ||
            a.guest_name?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusBadge = (status) => {
        const map = {
            scheduled: 'bg-blue-100 text-blue-700',
            completed: 'bg-green-100 text-green-700',
            canceled: 'bg-red-100 text-red-700',
            no_show: 'bg-gray-100 text-gray-700',
        };
        const labels = { scheduled: 'Foglalt', completed: 'Teljesült', canceled: 'Lemondva', no_show: 'Nem jelent meg' };
        return (
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
    const formatPrice = (p) => new Intl.NumberFormat('hu-HU').format(p || 0) + ' Ft';

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Keresés ügyfél, szolgáltató, szalon alapján..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 min-w-[250px] px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                >
                    <option value="all">Minden státusz</option>
                    <option value="scheduled">Foglalt</option>
                    <option value="completed">Teljesült</option>
                    <option value="canceled">Lemondva</option>
                    <option value="no_show">Nem jelent meg</option>
                </select>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-white rounded-lg border border-gray-100 p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
                    <p className="text-xs text-gray-500">Összes</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-100 p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{appointments.filter(a => a.status === 'scheduled').length}</p>
                    <p className="text-xs text-gray-500">Foglalt</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-100 p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{appointments.filter(a => a.status === 'completed').length}</p>
                    <p className="text-xs text-gray-500">Teljesült</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-100 p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{appointments.filter(a => a.status === 'canceled').length}</p>
                    <p className="text-xs text-gray-500">Lemondva</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Időpont</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Ügyfél</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Szolgáltató</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Szalon</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Szolgáltatás</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Ár</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Státusz</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Művelet</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAppointments.map(apt => (
                            <tr key={apt.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-xs text-gray-700">{formatDate(apt.appointment_start)}</td>
                                <td className="px-4 py-3 text-gray-900 font-medium">
                                    {apt.customer_name || apt.guest_name || 'Vendég'}
                                    {apt.guest_name && <span className="text-xs text-gray-400 ml-1">(vendég)</span>}
                                </td>
                                <td className="px-4 py-3 text-gray-600">{apt.provider_name}</td>
                                <td className="px-4 py-3 text-gray-600 text-xs">{apt.salon_name}</td>
                                <td className="px-4 py-3 text-gray-600">{apt.service_name}</td>
                                <td className="px-4 py-3 font-medium">{formatPrice(apt.price)}</td>
                                <td className="px-4 py-3">{statusBadge(apt.status)}</td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => handleDelete(apt.id)}
                                        disabled={actionLoading}
                                        className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
                                    >
                                        Törlés
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredAppointments.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm">Nincs találat</div>
                )}
            </div>
        </div>
    );
}
