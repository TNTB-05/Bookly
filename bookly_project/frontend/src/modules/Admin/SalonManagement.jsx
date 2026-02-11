import { useState, useEffect } from 'react';
import { authApi } from '../auth/auth';

export default function SalonManagement() {
    const [salons, setSalons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSalon, setSelectedSalon] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailTab, setDetailTab] = useState('providers');
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => { fetchSalons(); }, []);

    const fetchSalons = async () => {
        try {
            setLoading(true);
            const res = await authApi.get('/api/admin/salons');
            const data = await res.json();
            if (data.success) setSalons(data.salons);
        } catch (err) {
            console.error('Error fetching salons:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSalonDetails = async (salonId) => {
        try {
            setDetailLoading(true);
            const res = await authApi.get(`/api/admin/salons/${salonId}`);
            const data = await res.json();
            if (data.success) setDetailData(data);
        } catch (err) {
            console.error('Error fetching salon details:', err);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleSelectSalon = (salon) => {
        if (selectedSalon?.id === salon.id) {
            setSelectedSalon(null);
            setDetailData(null);
        } else {
            setSelectedSalon(salon);
            setDetailTab('providers');
            fetchSalonDetails(salon.id);
        }
    };

    const handleRemoveBanner = async (salonId) => {
        if (!confirm('Biztosan eltávolítod a bannert?')) return;
        setActionLoading(true);
        try {
            const res = await authApi.delete(`/api/admin/salons/${salonId}/banner`);
            const data = await res.json();
            if (data.success) {
                fetchSalons();
                if (selectedSalon?.id === salonId) fetchSalonDetails(salonId);
            }
        } catch (err) {
            console.error('Error removing banner:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveLogo = async (salonId) => {
        if (!confirm('Biztosan eltávolítod a logót?')) return;
        setActionLoading(true);
        try {
            const res = await authApi.delete(`/api/admin/salons/${salonId}/logo`);
            const data = await res.json();
            if (data.success) {
                fetchSalons();
                if (selectedSalon?.id === salonId) fetchSalonDetails(salonId);
            }
        } catch (err) {
            console.error('Error removing logo:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveDescription = async (salonId) => {
        if (!confirm('Biztosan eltávolítod a leírást?')) return;
        setActionLoading(true);
        try {
            const res = await authApi.delete(`/api/admin/salons/${salonId}/description`);
            const data = await res.json();
            if (data.success) {
                fetchSalons();
                if (selectedSalon?.id === salonId) fetchSalonDetails(salonId);
            }
        } catch (err) {
            console.error('Error removing description:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredSalons = salons.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.address?.toLowerCase().includes(search.toLowerCase()) ||
        s.type?.toLowerCase().includes(search.toLowerCase())
    );

    const statusBadge = (status) => {
        const map = {
            open: 'bg-green-100 text-green-700',
            closed: 'bg-red-100 text-red-700',
            renovation: 'bg-amber-100 text-amber-700',
        };
        const labels = { open: 'Nyitva', closed: 'Zárva', renovation: 'Felújítás' };
        return (
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
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
            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Keresés név, cím vagy típus alapján..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
            </div>

            {/* Salons Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Szalon</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Cím</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Típus</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Szolgáltatók</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Értékelés</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Státusz</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Műveletek</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSalons.map(salon => (
                            <tr
                                key={salon.id}
                                onClick={() => handleSelectSalon(salon)}
                                className={`border-b border-gray-50 cursor-pointer transition-colors
                                    ${selectedSalon?.id === salon.id ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                            >
                                <td className="px-4 py-3 font-medium text-gray-900">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: salon.banner_color || '#3B82F6' }}>
                                            {salon.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        {salon.name}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-gray-600 text-xs">{salon.address}</td>
                                <td className="px-4 py-3 text-gray-600 capitalize">{salon.type || '—'}</td>
                                <td className="px-4 py-3 text-gray-600">{salon.provider_count}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                        <span className="text-amber-500 text-xs">★</span>
                                        <span className="text-sm font-medium">{parseFloat(salon.average_rating || 0).toFixed(1)}</span>
                                        <span className="text-xs text-gray-400">({salon.rating_count})</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">{statusBadge(salon.status)}</td>
                                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                    <div className="flex gap-1 flex-wrap">
                                        {salon.banner_image_url && (
                                            <button onClick={() => handleRemoveBanner(salon.id)} disabled={actionLoading}
                                                className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors">
                                                Banner törlés
                                            </button>
                                        )}
                                        {salon.logo_url && (
                                            <button onClick={() => handleRemoveLogo(salon.id)} disabled={actionLoading}
                                                className="px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors">
                                                Logó törlés
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredSalons.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm">Nincs találat</div>
                )}
            </div>

            {/* Detail Panel */}
            {selectedSalon && (
                <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {selectedSalon.name} részletei
                        </h3>
                        <button onClick={() => { setSelectedSalon(null); setDetailData(null); }}
                            className="text-gray-400 hover:text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {detailLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-500 border-t-transparent"></div>
                        </div>
                    ) : detailData && (
                        <>
                            {/* Salon info */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                                <div><p className="text-xs text-gray-500">Cím</p><p className="text-sm font-medium">{detailData.salon.address}</p></div>
                                <div><p className="text-xs text-gray-500">Telefon</p><p className="text-sm font-medium">{detailData.salon.phone || '—'}</p></div>
                                <div><p className="text-xs text-gray-500">Email</p><p className="text-sm font-medium">{detailData.salon.email || '—'}</p></div>
                                <div><p className="text-xs text-gray-500">Típus</p><p className="text-sm font-medium capitalize">{detailData.salon.type || '—'}</p></div>
                            </div>

                            {/* Description with remove button */}
                            {detailData.salon.description && (
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs text-blue-600 font-medium mb-1">Leírás</p>
                                            <p className="text-sm text-gray-700">{detailData.salon.description}</p>
                                        </div>
                                        <button onClick={() => handleRemoveDescription(selectedSalon.id)} disabled={actionLoading}
                                            className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors flex-shrink-0 ml-3">
                                            Leírás törlés
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Tabs */}
                            <div className="flex gap-2 mb-4 border-b border-gray-100 pb-2">
                                <button onClick={() => setDetailTab('providers')}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${detailTab === 'providers' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                                    Szolgáltatók ({detailData.providers?.length || 0})
                                </button>
                                <button onClick={() => setDetailTab('services')}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${detailTab === 'services' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                                    Szolgáltatások ({detailData.services?.length || 0})
                                </button>
                                <button onClick={() => setDetailTab('ratings')}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${detailTab === 'ratings' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                                    Értékelések ({detailData.ratings?.length || 0})
                                </button>
                            </div>

                            {/* Providers */}
                            {detailTab === 'providers' && (
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {detailData.providers?.length === 0 && <p className="text-sm text-gray-400">Nincsenek szolgáltatók</p>}
                                    {detailData.providers?.map(p => (
                                        <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">
                                                    {p.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                                                    <p className="text-xs text-gray-500">{p.email} · {p.role}{p.isManager ? ' (Manager)' : ''}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {p.status === 'active' ? 'Aktív' : 'Inaktív'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Services */}
                            {detailTab === 'services' && (
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {detailData.services?.length === 0 && <p className="text-sm text-gray-400">Nincsenek szolgáltatások</p>}
                                    {detailData.services?.map(s => (
                                        <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{s.name}</p>
                                                <p className="text-xs text-gray-500">{s.provider_name} · {s.duration_minutes} perc</p>
                                            </div>
                                            <p className="text-sm font-medium">{formatPrice(s.price)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Ratings */}
                            {detailTab === 'ratings' && (
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {detailData.ratings?.length === 0 && <p className="text-sm text-gray-400">Nincsenek értékelések</p>}
                                    {detailData.ratings?.map(r => (
                                        <div key={r.id} className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between mb-1">
                                                <p className="text-sm font-medium">{r.user_name}</p>
                                                <span className="text-xs text-amber-600">
                                                    {'★'.repeat(r.salon_rating || 0)}{'☆'.repeat(5 - (r.salon_rating || 0))}
                                                </span>
                                            </div>
                                            {r.salon_comment && <p className="text-xs text-gray-600">{r.salon_comment}</p>}
                                            <p className="text-xs text-gray-400 mt-1">{formatDate(r.created_at)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
