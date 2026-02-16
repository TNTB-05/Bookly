import React, { useState, useEffect } from 'react';
import { authApi } from '../auth/auth';
import RefreshIcon from '../../icons/RefreshIcon';
import StarFilledIcon from '../../icons/StarFilledIcon';
import StarOutlineIcon from '../../icons/StarOutlineIcon';

export default function RatingManagement() {
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchField, setSearchField] = useState('all');
    const [activeFilter, setActiveFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState(false);
    const [expandedRating, setExpandedRating] = useState(null);

    useEffect(() => { fetchRatings(); }, []);

    const fetchRatings = async () => {
        try {
            setLoading(true);
            const res = await authApi.get('/api/admin/ratings');
            const data = await res.json();
            if (data.success) setRatings(data.ratings);
        } catch (err) {
            console.error('Error fetching ratings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async (ratingId) => {
        if (!confirm('Biztosan deaktiválod ezt az értékelést?')) return;
        setActionLoading(true);
        try {
            const res = await authApi.delete(`/api/admin/ratings/${ratingId}`);
            const data = await res.json();
            if (data.success) fetchRatings();
        } catch (err) {
            console.error('Error deactivating rating:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredRatings = ratings.filter(r => {
        const s = search.toLowerCase();
        const matchesSearch = !s || (
            searchField === 'all'
                ? (r.user_name?.toLowerCase().includes(s) || r.user_email?.toLowerCase().includes(s) || r.salon_name?.toLowerCase().includes(s) || r.provider_name?.toLowerCase().includes(s) || r.salon_comment?.toLowerCase().includes(s) || r.provider_comment?.toLowerCase().includes(s))
                : searchField === 'user' ? (r.user_name?.toLowerCase().includes(s) || r.user_email?.toLowerCase().includes(s))
                : searchField === 'salon' ? r.salon_name?.toLowerCase().includes(s)
                : searchField === 'provider' ? r.provider_name?.toLowerCase().includes(s)
                : searchField === 'comment' ? (r.salon_comment?.toLowerCase().includes(s) || r.provider_comment?.toLowerCase().includes(s))
                : true
        );
        const matchesActive =
            activeFilter === 'all' ||
            (activeFilter === 'active' && r.active) ||
            (activeFilter === 'inactive' && !r.active);
        return matchesSearch && matchesActive;
    });

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

    const renderStars = (rating) => {
        if (!rating) return <span className="text-gray-300">—</span>;
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                    i <= rating
                        ? <StarFilledIcon key={i} className="w-3.5 h-3.5 text-amber-400" />
                        : <StarOutlineIcon key={i} className="w-3.5 h-3.5 text-gray-300" />
                ))}
                <span className="ml-1 text-xs font-medium text-gray-600">{rating}</span>
            </div>
        );
    };

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
                <select
                    value={searchField}
                    onChange={e => setSearchField(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                >
                    <option value="all">Minden mező</option>
                    <option value="user">Felhasználó</option>
                    <option value="salon">Szalon</option>
                    <option value="provider">Szolgáltató</option>
                    <option value="comment">Komment</option>
                </select>
                <input
                    type="text"
                    placeholder="Keresés..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
                <select
                    value={activeFilter}
                    onChange={e => setActiveFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                >
                    <option value="all">Minden</option>
                    <option value="active">Aktív</option>
                    <option value="inactive">Deaktiválva</option>
                </select>
                <button
                    onClick={fetchRatings}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                >
                    <RefreshIcon className="w-4 h-4" />
                    Frissítés
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{ratings.length}</p>
                    <p className="text-xs text-gray-500">Összes</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{ratings.filter(r => r.active).length}</p>
                    <p className="text-xs text-gray-500">Aktív</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-2xl font-bold text-gray-400">{ratings.filter(r => !r.active).length}</p>
                    <p className="text-xs text-gray-500">Deaktiválva</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-2xl font-bold text-amber-500">
                        {ratings.length > 0
                            ? (ratings.filter(r => r.active).reduce((sum, r) => sum + ((r.salon_rating || 0) + (r.provider_rating || 0)) / 2, 0) / Math.max(ratings.filter(r => r.active).length, 1)).toFixed(1)
                            : '—'}
                    </p>
                    <p className="text-xs text-gray-500">Átlagos értékelés</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b-2 border-gray-200">
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Felhasználó</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Szalon</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Szolgáltató</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Szalon ★</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Szolgáltató ★</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Dátum</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Státusz</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Művelet</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRatings.map(r => (
                                <React.Fragment key={r.id}>
                                    <tr
                                        onClick={() => setExpandedRating(expandedRating === r.id ? null : r.id)}
                                        className={`border-b border-gray-50 cursor-pointer transition-colors ${!r.active ? 'bg-gray-50/60' : ''} ${expandedRating === r.id ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                                    >
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900">{r.user_name || '—'}</p>
                                            <p className="text-xs text-gray-400">{r.user_email}</p>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{r.salon_name}</td>
                                        <td className="px-4 py-3 text-gray-600">{r.provider_name}</td>
                                        <td className="px-4 py-3">{renderStars(r.salon_rating)}</td>
                                        <td className="px-4 py-3">{renderStars(r.provider_rating)}</td>
                                        <td className="px-4 py-3 text-xs text-gray-700">{formatDate(r.created_at)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                                {r.active ? 'Aktív' : 'Inaktív'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                            {r.active ? (
                                                <button
                                                    onClick={() => handleDeactivate(r.id)}
                                                    disabled={actionLoading}
                                                    className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors disabled:opacity-50"
                                                >
                                                    Deaktiválás
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400">Inaktív</span>
                                            )}
                                        </td>
                                    </tr>

                                    {/* Accordion Detail Row */}
                                    {expandedRating === r.id && (
                                        <tr className="bg-amber-50/30 border-t border-gray-200">
                                            <td colSpan="8" className="px-4 py-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {/* Salon rating details */}
                                                    <div className="p-3 bg-white/80 rounded-lg border border-gray-200">
                                                        <p className="text-xs font-medium text-gray-500 mb-2">Szalon értékelés</p>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {renderStars(r.salon_rating)}
                                                        </div>
                                                        {r.salon_comment ? (
                                                            <div className="bg-gray-50 rounded p-2">
                                                                <p className="text-xs text-gray-500 mb-1">Komment:</p>
                                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.salon_comment}</p>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-gray-400 italic">Nincs komment</p>
                                                        )}
                                                    </div>

                                                    {/* Provider rating details */}
                                                    <div className="p-3 bg-white/80 rounded-lg border border-gray-200">
                                                        <p className="text-xs font-medium text-gray-500 mb-2">Szolgáltató értékelés</p>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {renderStars(r.provider_rating)}
                                                        </div>
                                                        {r.provider_comment ? (
                                                            <div className="bg-gray-50 rounded p-2">
                                                                <p className="text-xs text-gray-500 mb-1">Komment:</p>
                                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.provider_comment}</p>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-gray-400 italic">Nincs komment</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredRatings.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm">Nincs találat</div>
                )}
            </div>
        </div>
    );
}
