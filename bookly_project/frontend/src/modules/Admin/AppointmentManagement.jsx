import React, { useState, useEffect } from 'react';
import { authApi } from '../auth/auth';
import RefreshIcon from '../../icons/RefreshIcon';

export default function AppointmentManagement() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteModal, setDeleteModal] = useState(null); // { appointmentId }
    const [deleteReason, setDeleteReason] = useState('');

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

    const handleDelete = async () => {
        if (!deleteModal || !deleteReason.trim()) return;
        setActionLoading(true);
        try {
            const res = await authApi.delete(`/api/admin/appointments/${deleteModal.appointmentId}`, {
                body: JSON.stringify({ reason: deleteReason.trim() })
            });
            const data = await res.json();
            if (data.success) fetchAppointments();
        } catch (err) {
            console.error('Error deleting appointment:', err);
        } finally {
            setActionLoading(false);
            setDeleteModal(null);
            setDeleteReason('');
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
            deleted: 'bg-red-200 text-red-800',
        };
        const labels = { scheduled: 'Foglalt', completed: 'Teljesült', canceled: 'Lemondva', no_show: 'Nem jelent meg', deleted: 'Törölve' };
        return (
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Budapest' }) : '—';
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
                    <option value="deleted">Törölve</option>
                </select>
                <button
                    onClick={fetchAppointments}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                >
                    <RefreshIcon className="w-4 h-4" />
                    Frissítés
                </button>
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
                            <tr key={apt.id} className={`border-b border-gray-50 transition-colors ${apt.status === 'deleted' ? 'bg-red-50/60 hover:bg-red-50' : 'hover:bg-gray-50'}`}>
                                <td className="px-4 py-3 text-xs text-gray-700">{formatDate(apt.appointment_start)}</td>
                                <td className="px-4 py-3 text-gray-900 font-medium">
                                    {apt.customer_name || apt.guest_name || 'Vendég'}
                                    {apt.guest_name && <span className="text-xs text-gray-400 ml-1">(vendég)</span>}
                                </td>
                                <td className="px-4 py-3 text-gray-600">{apt.provider_name}</td>
                                <td className="px-4 py-3 text-gray-600 text-xs">{apt.salon_name}</td>
                                <td className="px-4 py-3 text-gray-600">{apt.service_name}</td>
                                <td className="px-4 py-3 font-medium">{formatPrice(apt.price)}</td>
                                <td className="px-4 py-3">
                                    {statusBadge(apt.status)}
                                    {apt.status === 'deleted' && apt.deleted_reason && (
                                        <p className="text-xs text-red-500 mt-0.5 truncate max-w-[150px]" title={apt.deleted_reason}>
                                            {apt.deleted_reason}
                                        </p>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    {apt.status !== 'deleted' ? (
                                        <button
                                            onClick={() => { setDeleteModal({ appointmentId: apt.id }); setDeleteReason(''); }}
                                            disabled={actionLoading}
                                            className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
                                        >
                                            Törlés
                                        </button>
                                    ) : (
                                        <span className="text-xs text-gray-400">Törölve</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredAppointments.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm">Nincs találat</div>
                )}
            </div>

            {/* Delete Reason Modal */}
            {deleteModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Foglalás törlése</h3>
                        <p className="text-sm text-gray-500 mb-4">Kérlek írd le a törlés okát. Ez az információ naplózásra kerül.</p>
                        <textarea
                            value={deleteReason}
                            onChange={e => setDeleteReason(e.target.value)}
                            placeholder="Törlés oka (kötelező)..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 resize-none"
                            rows={3}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => { setDeleteModal(null); setDeleteReason(''); }}
                                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Mégse
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={!deleteReason.trim() || actionLoading}
                                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {actionLoading ? 'Törlés...' : 'Törlés megerősítése'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
