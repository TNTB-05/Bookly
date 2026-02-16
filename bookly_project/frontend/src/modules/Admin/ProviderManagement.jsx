import React, { useState, useEffect } from 'react';
import { authApi } from '../auth/auth';
import RefreshIcon from '../../icons/RefreshIcon';

export default function ProviderManagement() {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailTab, setDetailTab] = useState('appointments');
    const [search, setSearch] = useState('');
    const [searchField, setSearchField] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteModal, setDeleteModal] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');

    useEffect(() => { fetchProviders(); }, []);

    const fetchProviders = async () => {
        try {
            setLoading(true);
            const res = await authApi.get('/api/admin/providers');
            const data = await res.json();
            if (data.success) setProviders(data.providers);
        } catch (err) {
            console.error('Error fetching providers:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProviderDetails = async (providerId) => {
        try {
            setDetailLoading(true);
            const res = await authApi.get(`/api/admin/providers/${providerId}`);
            const data = await res.json();
            if (data.success) setDetailData(data);
        } catch (err) {
            console.error('Error fetching provider details:', err);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleSelectProvider = (provider) => {
        if (selectedProvider?.id === provider.id) {
            setSelectedProvider(null);
            setDetailData(null);
        } else {
            setSelectedProvider(provider);
            setDetailTab('appointments');
            fetchProviderDetails(provider.id);
        }
    };

    const handleRemovePicture = async (providerId) => {
        if (!confirm('Biztosan eltávolítod a profilképet?')) return;
        setActionLoading(true);
        try {
            const res = await authApi.delete(`/api/admin/providers/${providerId}/picture`);
            const data = await res.json();
            if (data.success) {
                fetchProviders();
                if (selectedProvider?.id === providerId) fetchProviderDetails(providerId);
            }
        } catch (err) {
            console.error('Error removing picture:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteAppointment = async (appointmentId) => {
        setDeleteModal({ appointmentId });
        setDeleteReason('');
    };

    const handleConfirmDelete = async () => {
        if (!deleteModal || !deleteReason.trim()) return;
        setActionLoading(true);
        try {
            const res = await authApi.delete(`/api/admin/appointments/${deleteModal.appointmentId}`, {
                body: JSON.stringify({ reason: deleteReason.trim() })
            });
            const data = await res.json();
            if (data.success) {
                if (selectedProvider) fetchProviderDetails(selectedProvider.id);
                fetchProviders();
            }
        } catch (err) {
            console.error('Error deleting appointment:', err);
        } finally {
            setActionLoading(false);
            setDeleteModal(null);
            setDeleteReason('');
        }
    };

    const handleDeleteRating = async (ratingId) => {
        if (!confirm('Biztosan deaktiválod ezt az értékelést?')) return;
        setActionLoading(true);
        try {
            const res = await authApi.delete(`/api/admin/ratings/${ratingId}`);
            const data = await res.json();
            if (data.success) {
                if (selectedProvider) fetchProviderDetails(selectedProvider.id);
                fetchProviders();
            }
        } catch (err) {
            console.error('Error deleting rating:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleBan = async (providerId) => {
        if (!confirm('Biztosan letiltod ezt a szolgáltatót?')) return;
        setActionLoading(true);
        try {
            const res = await authApi.post(`/api/admin/providers/${providerId}/ban`);
            const data = await res.json();
            if (data.success) {
                fetchProviders();
                if (selectedProvider?.id === providerId) fetchProviderDetails(providerId);
            }
        } catch (err) {
            console.error('Error banning provider:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnban = async (providerId) => {
        setActionLoading(true);
        try {
            const res = await authApi.post(`/api/admin/providers/${providerId}/unban`);
            const data = await res.json();
            if (data.success) {
                fetchProviders();
                if (selectedProvider?.id === providerId) fetchProviderDetails(providerId);
            }
        } catch (err) {
            console.error('Error unbanning provider:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredProviders = providers.filter(p => {
        const s = search.toLowerCase();
        const matchesSearch = !s || (
            searchField === 'all'
                ? (p.name?.toLowerCase().includes(s) || p.email?.toLowerCase().includes(s) || p.salon_name?.toLowerCase().includes(s))
                : searchField === 'name' ? p.name?.toLowerCase().includes(s)
                : searchField === 'email' ? p.email?.toLowerCase().includes(s)
                : searchField === 'salon' ? p.salon_name?.toLowerCase().includes(s)
                : true
        );
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusBadge = (status) => {
        const map = {
            active: 'bg-green-100 text-green-700',
            inactive: 'bg-gray-100 text-gray-600',
            banned: 'bg-red-100 text-red-700',
            deleted: 'bg-gray-200 text-gray-500',
        };
        const labels = { active: 'Aktív', inactive: 'Inaktív', banned: 'Tiltva', deleted: 'Törölve' };
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
            {/* Search + Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
                <select
                    value={searchField}
                    onChange={e => setSearchField(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                >
                    <option value="all">Minden mező</option>
                    <option value="name">Név</option>
                    <option value="email">Email</option>
                    <option value="salon">Szalon</option>
                </select>
                <input
                    type="text"
                    placeholder="Keresés..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                >
                    <option value="all">Minden státusz</option>
                    <option value="active">Aktív</option>
                    <option value="inactive">Inaktív</option>
                    <option value="banned">Tiltva</option>
                </select>
                <button
                    onClick={fetchProviders}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                >
                    <RefreshIcon className="w-4 h-4" />
                    Frissítés
                </button>
            </div>

            {/* Providers Table with Accordion */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Név</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Szalon</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Szerep</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Státusz</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Műveletek</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProviders.map(provider => (
                            <React.Fragment key={provider.id}>
                                <tr
                                    onClick={() => handleSelectProvider(provider)}
                                    className={`border-b border-gray-50 cursor-pointer transition-colors
                                        ${selectedProvider?.id === provider.id ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                                >
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        <div className="flex items-center gap-2">
                                            {provider.profile_picture_url ? (
                                                <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${provider.profile_picture_url}`} className="w-7 h-7 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">
                                                    {provider.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                            )}
                                            {provider.name}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{provider.email}</td>
                                    <td className="px-4 py-3 text-gray-600">{provider.salon_name}</td>
                                    <td className="px-4 py-3 text-gray-600 capitalize">{provider.role}{provider.isManager ? ' (Manager)' : ''}</td>
                                    <td className="px-4 py-3">{statusBadge(provider.status)}</td>
                                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                        <div className="flex gap-1 flex-wrap">
                                            {provider.status !== 'banned' && provider.status !== 'deleted' ? (
                                                <button
                                                    onClick={() => handleBan(provider.id)}
                                                    disabled={actionLoading}
                                                    className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
                                                >
                                                    Tiltás
                                                </button>
                                            ) : provider.status === 'banned' ? (
                                                <button
                                                    onClick={() => handleUnban(provider.id)}
                                                    disabled={actionLoading}
                                                    className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                                                >
                                                    Tiltás feloldás
                                                </button>
                                            ) : null}
                                            {provider.profile_picture_url && (
                                                <button
                                                    onClick={() => handleRemovePicture(provider.id)}
                                                    disabled={actionLoading}
                                                    className="px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
                                                >
                                                    Kép törlés
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>

                                {/* Accordion Detail Row */}
                                {selectedProvider?.id === provider.id && (
                                    <tr className="bg-amber-50/30 border-t border-gray-200">
                                        <td colSpan="6" className="px-4 py-4">
                                            {detailLoading ? (
                                                <div className="flex justify-center py-6">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-500 border-t-transparent"></div>
                                                </div>
                                            ) : detailData && (
                                                <>
                                                    {/* Info Grid */}
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-white/80 rounded-lg border border-gray-200">
                                                        <div><p className="text-xs text-gray-500">Email</p><p className="text-sm font-medium">{detailData.provider.email}</p></div>
                                                        <div><p className="text-xs text-gray-500">Telefon</p><p className="text-sm font-medium">{detailData.provider.phone || '—'}</p></div>
                                                        <div><p className="text-xs text-gray-500">Szalon</p><p className="text-sm font-medium">{detailData.provider.salon_name || '—'}</p></div>
                                                        <div><p className="text-xs text-gray-500">Leírás</p><p className="text-sm font-medium truncate">{detailData.provider.description || '—'}</p></div>
                                                    </div>

                                                    {/* Tabs */}
                                                    <div className="flex gap-2 mb-4 border-b border-gray-200 pb-2">
                                                        <button onClick={() => setDetailTab('appointments')}
                                                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${detailTab === 'appointments' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                                                            Foglalások ({detailData.appointments?.length || 0})
                                                        </button>
                                                        <button onClick={() => setDetailTab('ratings')}
                                                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${detailTab === 'ratings' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                                                            Értékelések ({detailData.ratings?.length || 0})
                                                        </button>
                                                        <button onClick={() => setDetailTab('services')}
                                                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${detailTab === 'services' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                                                            Szolgáltatások ({detailData.services?.length || 0})
                                                        </button>
                                                    </div>

                                                    {/* Appointments */}
                                                    {detailTab === 'appointments' && (
                                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                                            {detailData.appointments?.length === 0 && <p className="text-sm text-gray-400">Nincsenek foglalások</p>}
                                                            {detailData.appointments?.map(apt => {
                                                                const aptStatusMap = {
                                                                    booked: { label: 'Foglalt', cls: 'bg-blue-100 text-blue-700' },
                                                                    completed: { label: 'Teljesült', cls: 'bg-green-100 text-green-700' },
                                                                    cancelled: { label: 'Lemondva', cls: 'bg-yellow-100 text-yellow-700' },
                                                                    deleted: { label: 'Törölve', cls: 'bg-red-100 text-red-700' },
                                                                    no_show: { label: 'Nem jelent meg', cls: 'bg-gray-100 text-gray-600' },
                                                                };
                                                                const aptBadge = aptStatusMap[apt.status] || { label: apt.status, cls: 'bg-gray-100 text-gray-600' };
                                                                return (
                                                                    <div key={apt.id} className={`flex items-center justify-between p-3 rounded-lg ${apt.status === 'deleted' ? 'bg-red-50/60' : 'bg-white'}`}>
                                                                        <div>
                                                                            <p className="text-sm font-medium text-gray-900">{apt.service_name}</p>
                                                                            <p className="text-xs text-gray-500">Ügyfél: {apt.customer_name || 'Vendég'}</p>
                                                                        </div>
                                                                        <div className="flex items-center gap-3">
                                                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${aptBadge.cls}`}>{aptBadge.label}</span>
                                                                            <div className="text-right">
                                                                                <p className="text-xs text-gray-600">{formatDate(apt.appointment_start)}</p>
                                                                                <p className="text-xs font-medium">{formatPrice(apt.price)}</p>
                                                                            </div>
                                                                            {apt.status !== 'deleted' && (
                                                                                <button onClick={() => handleDeleteAppointment(apt.id)}
                                                                                    disabled={actionLoading}
                                                                                    className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors disabled:opacity-50">Törlés</button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* Ratings */}
                                                    {detailTab === 'ratings' && (
                                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                                            {detailData.ratings?.length === 0 && <p className="text-sm text-gray-400">Nincsenek értékelések</p>}
                                                            {detailData.ratings?.map(r => (
                                                                <div key={r.id} className="p-3 bg-white rounded-lg">
                                                                    <div className="flex justify-between mb-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="text-sm font-medium">{r.user_name}</p>
                                                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                                                                {r.active ? 'Aktív' : 'Inaktív'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs text-blue-600">{'★'.repeat(r.provider_rating || 0)}{'☆'.repeat(5 - (r.provider_rating || 0))}</span>
                                                                            {r.active !== 0 && (
                                                                                <button onClick={() => handleDeleteRating(r.id)}
                                                                                    disabled={actionLoading}
                                                                                    className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors disabled:opacity-50">Deaktiválás</button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {r.provider_comment && <p className="text-xs text-gray-600">{r.provider_comment}</p>}
                                                                    <p className="text-xs text-gray-400 mt-1">{formatDate(r.created_at)}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Services */}
                                                    {detailTab === 'services' && (
                                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                                            {detailData.services?.length === 0 && <p className="text-sm text-gray-400">Nincsenek szolgáltatások</p>}
                                                            {detailData.services?.map(s => (
                                                                <div key={s.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900">{s.name}</p>
                                                                        <p className="text-xs text-gray-500">{s.duration_minutes} perc</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-sm font-medium">{formatPrice(s.price)}</p>
                                                                        <span className={`text-xs ${s.status === 'available' ? 'text-green-600' : 'text-gray-400'}`}>
                                                                            {s.status === 'available' ? 'Elérhető' : 'Nem elérhető'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                {filteredProviders.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm">Nincs találat</div>
                )}
            </div>

            {/* Delete Reason Modal */}
            {deleteModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Foglalás törlése</h3>
                        <p className="text-sm text-gray-600 mb-4">Kérjük, adja meg a törlés okát:</p>
                        <textarea
                            value={deleteReason}
                            onChange={e => setDeleteReason(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none"
                            placeholder="Törlés oka..."
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => { setDeleteModal(null); setDeleteReason(''); }}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >Mégse</button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={!deleteReason.trim() || actionLoading}
                                className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                            >Törlés</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
