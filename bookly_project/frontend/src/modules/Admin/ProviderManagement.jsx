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
    const [actionLoading, setActionLoading] = useState(false);

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

    const handleDeactivate = async (providerId) => {
        if (!confirm('Biztosan deaktiválod ezt a szolgáltatót?')) return;
        setActionLoading(true);
        try {
            const res = await authApi.post(`/api/admin/providers/${providerId}/deactivate`);
            const data = await res.json();
            if (data.success) {
                fetchProviders();
                if (selectedProvider?.id === providerId) fetchProviderDetails(providerId);
            }
        } catch (err) {
            console.error('Error deactivating provider:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleActivate = async (providerId) => {
        setActionLoading(true);
        try {
            const res = await authApi.post(`/api/admin/providers/${providerId}/activate`);
            const data = await res.json();
            if (data.success) {
                fetchProviders();
                if (selectedProvider?.id === providerId) fetchProviderDetails(providerId);
            }
        } catch (err) {
            console.error('Error activating provider:', err);
        } finally {
            setActionLoading(false);
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
        const reason = prompt('Kérlek add meg a törlés okát:');
        if (!reason || !reason.trim()) return;
        try {
            const res = await authApi.delete(`/api/admin/appointments/${appointmentId}`, {
                body: JSON.stringify({ reason: reason.trim() })
            });
            const data = await res.json();
            if (data.success && selectedProvider) fetchProviderDetails(selectedProvider.id);
        } catch (err) {
            console.error('Error deleting appointment:', err);
        }
    };

    const handleDeleteRating = async (ratingId) => {
        if (!confirm('Biztosan deaktiválod ezt az értékelést?')) return;
        try {
            const res = await authApi.delete(`/api/admin/ratings/${ratingId}`);
            const data = await res.json();
            if (data.success && selectedProvider) fetchProviderDetails(selectedProvider.id);
        } catch (err) {
            console.error('Error deleting rating:', err);
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

    const filteredProviders = providers.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase()) ||
        p.salon_name?.toLowerCase().includes(search.toLowerCase())
    );

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
            {/* Search + Refresh */}
            <div className="flex flex-wrap gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Keresés név, email vagy szalon alapján..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 min-w-[250px] px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
                <button
                    onClick={fetchProviders}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                >
                    <RefreshIcon className="w-4 h-4" />
                    Frissítés
                </button>
            </div>

            {/* Providers Table with Accordion */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
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
                                            {provider.status === 'active' ? (
                                                <button
                                                    onClick={() => handleDeactivate(provider.id)}
                                                    disabled={actionLoading}
                                                    className="px-2 py-1 text-xs bg-amber-50 text-amber-700 rounded hover:bg-amber-100 transition-colors"
                                                >
                                                    Deaktiválás
                                                </button>
                                            ) : provider.status !== 'banned' && provider.status !== 'deleted' ? (
                                                <button
                                                    onClick={() => handleActivate(provider.id)}
                                                    disabled={actionLoading}
                                                    className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                                                >
                                                    Aktiválás
                                                </button>
                                            ) : null}
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
                                    <tr className="bg-amber-50/30">
                                        <td colSpan="6" className="px-4 py-4">
                                            {detailLoading ? (
                                                <div className="flex justify-center py-6">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-500 border-t-transparent"></div>
                                                </div>
                                            ) : detailData && (
                                                <>
                                                    {/* Info Grid */}
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-white/80 rounded-lg">
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
                                                            {detailData.appointments?.map(apt => (
                                                                <div key={apt.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900">{apt.service_name}</p>
                                                                        <p className="text-xs text-gray-500">Ügyfél: {apt.customer_name || 'Vendég'}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="text-right">
                                                                            <p className="text-xs text-gray-600">{formatDate(apt.appointment_start)}</p>
                                                                            <p className="text-xs font-medium">{formatPrice(apt.price)}</p>
                                                                        </div>
                                                                        <button onClick={() => handleDeleteAppointment(apt.id)}
                                                                            className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors">Törlés</button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Ratings */}
                                                    {detailTab === 'ratings' && (
                                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                                            {detailData.ratings?.length === 0 && <p className="text-sm text-gray-400">Nincsenek értékelések</p>}
                                                            {detailData.ratings?.map(r => (
                                                                <div key={r.id} className="p-3 bg-white rounded-lg">
                                                                    <div className="flex justify-between mb-1">
                                                                        <p className="text-sm font-medium">{r.user_name}</p>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs text-blue-600">{'★'.repeat(r.provider_rating || 0)}{'☆'.repeat(5 - (r.provider_rating || 0))}</span>
                                                                            <button onClick={() => handleDeleteRating(r.id)}
                                                                                className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors">Törlés</button>
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
        </div>
    );
}
