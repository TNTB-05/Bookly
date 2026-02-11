import React, { useState, useEffect } from 'react';
import { authApi } from '../auth/auth';
import RefreshIcon from '../../icons/RefreshIcon';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailTab, setDetailTab] = useState('appointments');
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await authApi.get('/api/admin/users');
            const data = await res.json();
            if (data.success) setUsers(data.users);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetails = async (userId) => {
        try {
            setDetailLoading(true);
            const res = await authApi.get(`/api/admin/users/${userId}`);
            const data = await res.json();
            if (data.success) setDetailData(data);
        } catch (err) {
            console.error('Error fetching user details:', err);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleSelectUser = (user) => {
        if (selectedUser?.id === user.id) {
            setSelectedUser(null);
            setDetailData(null);
        } else {
            setSelectedUser(user);
            setDetailTab('appointments');
            fetchUserDetails(user.id);
        }
    };

    const handleBan = async (userId) => {
        if (!confirm('Biztosan le szeretnéd tiltani ezt a felhasználót?')) return;
        setActionLoading(true);
        try {
            const res = await authApi.post(`/api/admin/users/${userId}/ban`);
            const data = await res.json();
            if (data.success) {
                fetchUsers();
                if (selectedUser?.id === userId) fetchUserDetails(userId);
            }
        } catch (err) {
            console.error('Error banning user:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnban = async (userId) => {
        setActionLoading(true);
        try {
            const res = await authApi.post(`/api/admin/users/${userId}/unban`);
            const data = await res.json();
            if (data.success) {
                fetchUsers();
                if (selectedUser?.id === userId) fetchUserDetails(userId);
            }
        } catch (err) {
            console.error('Error unbanning user:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemovePicture = async (userId) => {
        if (!confirm('Biztosan eltávolítod a profilképet?')) return;
        setActionLoading(true);
        try {
            const res = await authApi.delete(`/api/admin/users/${userId}/picture`);
            const data = await res.json();
            if (data.success) {
                fetchUsers();
                if (selectedUser?.id === userId) fetchUserDetails(userId);
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
            if (data.success && selectedUser) fetchUserDetails(selectedUser.id);
        } catch (err) {
            console.error('Error deleting appointment:', err);
        }
    };

    const handleDeleteRating = async (ratingId) => {
        if (!confirm('Biztosan deaktiválod ezt az értékelést?')) return;
        try {
            const res = await authApi.delete(`/api/admin/ratings/${ratingId}`);
            const data = await res.json();
            if (data.success && selectedUser) fetchUserDetails(selectedUser.id);
        } catch (err) {
            console.error('Error deleting rating:', err);
        }
    };

    const handleGdprDelete = async (userId) => {
        if (!confirm('FIGYELEM! Ez a művelet véglegesen anonimizálja a felhasználó összes személyes adatát (GDPR törlés). Ez nem vonható vissza! Biztosan folytatod?')) return;
        setActionLoading(true);
        try {
            const res = await authApi.post(`/api/admin/users/${userId}/gdpr-delete`);
            const data = await res.json();
            if (data.success) {
                fetchUsers();
                if (selectedUser?.id === userId) {
                    setSelectedUser(null);
                    setDetailData(null);
                }
            }
        } catch (err) {
            console.error('Error GDPR deleting user:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.phone?.includes(search)
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
                    placeholder="Keresés név, email vagy telefon alapján..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 min-w-[250px] px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
                <button
                    onClick={fetchUsers}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                >
                    <RefreshIcon className="w-4 h-4" />
                    Frissítés
                </button>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Név</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Telefon</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Szerep</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Státusz</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Utolsó belépés</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Műveletek</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <React.Fragment key={user.id}>
                                <tr
                                    onClick={() => handleSelectUser(user)}
                                    className={`border-b border-gray-50 cursor-pointer transition-colors
                                        ${selectedUser?.id === user.id ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                                >
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        <div className="flex items-center gap-2">
                                            {user.profile_picture_url ? (
                                                <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${user.profile_picture_url}`} className="w-7 h-7 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                                    {user.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                            )}
                                            {user.name}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                                    <td className="px-4 py-3 text-gray-600">{user.phone || '—'}</td>
                                    <td className="px-4 py-3 text-gray-600">{user.role}</td>
                                    <td className="px-4 py-3">{statusBadge(user.status)}</td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(user.last_login)}</td>
                                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                        <div className="flex gap-1 flex-wrap">
                                            {user.status === 'banned' ? (
                                                <button
                                                    onClick={() => handleUnban(user.id)}
                                                    disabled={actionLoading}
                                                    className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                                                >
                                                    Feloldás
                                                </button>
                                            ) : user.status !== 'deleted' ? (
                                                <button
                                                    onClick={() => handleBan(user.id)}
                                                    disabled={actionLoading}
                                                    className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
                                                >
                                                    Tiltás
                                                </button>
                                            ) : null}
                                            {user.profile_picture_url && (
                                                <button
                                                    onClick={() => handleRemovePicture(user.id)}
                                                    disabled={actionLoading}
                                                    className="px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
                                                >
                                                    Kép törlés
                                                </button>
                                            )}
                                            {user.status !== 'deleted' && (
                                                <button
                                                    onClick={() => handleGdprDelete(user.id)}
                                                    disabled={actionLoading}
                                                    className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors font-medium"
                                                >
                                                    GDPR törlés
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>

                                {/* Expandable detail row */}
                                {selectedUser?.id === user.id && (
                                    <tr className="border-b border-gray-100">
                                        <td colSpan="7" className="px-4 py-4 bg-amber-50/40">
                                            {detailLoading ? (
                                                <div className="flex justify-center py-6">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-500 border-t-transparent"></div>
                                                </div>
                                            ) : detailData && (
                                                <div>
                                                    {/* Info grid */}
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-white rounded-lg border border-gray-100">
                                                        <div><p className="text-xs text-gray-500">Email</p><p className="text-sm font-medium">{detailData.user.email}</p></div>
                                                        <div><p className="text-xs text-gray-500">Telefon</p><p className="text-sm font-medium">{detailData.user.phone || '—'}</p></div>
                                                        <div><p className="text-xs text-gray-500">Cím</p><p className="text-sm font-medium">{detailData.user.address || '—'}</p></div>
                                                        <div><p className="text-xs text-gray-500">Regisztráció</p><p className="text-sm font-medium">{formatDate(detailData.user.created_at)}</p></div>
                                                    </div>

                                                    {/* Tabs */}
                                                    <div className="flex gap-2 mb-3 border-b border-gray-200 pb-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setDetailTab('appointments'); }}
                                                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${detailTab === 'appointments' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                                        >
                                                            Foglalások ({detailData.appointments?.length || 0})
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setDetailTab('ratings'); }}
                                                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${detailTab === 'ratings' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                                        >
                                                            Értékelések ({detailData.ratings?.length || 0})
                                                        </button>
                                                    </div>

                                                    {/* Appointments tab */}
                                                    {detailTab === 'appointments' && (
                                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                                            {detailData.appointments?.length === 0 && <p className="text-sm text-gray-400">Nincsenek foglalások</p>}
                                                            {detailData.appointments?.map(apt => (
                                                                <div key={apt.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900">{apt.service_name}</p>
                                                                        <p className="text-xs text-gray-500">{apt.salon_name} — {apt.provider_name}</p>
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

                                                    {/* Ratings tab */}
                                                    {detailTab === 'ratings' && (
                                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                                            {detailData.ratings?.length === 0 && <p className="text-sm text-gray-400">Nincsenek értékelések</p>}
                                                            {detailData.ratings?.map(r => (
                                                                <div key={r.id} className="p-3 bg-white rounded-lg border border-gray-100">
                                                                    <div className="flex justify-between mb-1">
                                                                        <p className="text-sm font-medium text-gray-900">{r.salon_name}</p>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs text-amber-600">Szalon: {'★'.repeat(r.salon_rating || 0)}</span>
                                                                            <span className="text-xs text-blue-600">Szolgáltató: {'★'.repeat(r.provider_rating || 0)}</span>
                                                                            <button onClick={() => handleDeleteRating(r.id)}
                                                                                className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors">Törlés</button>
                                                                        </div>
                                                                    </div>
                                                                    {r.salon_comment && <p className="text-xs text-gray-600 mt-1">Szalon: {r.salon_comment}</p>}
                                                                    {r.provider_comment && <p className="text-xs text-gray-600 mt-0.5">Szolgáltató: {r.provider_comment}</p>}
                                                                    <p className="text-xs text-gray-400 mt-1">{formatDate(r.created_at)}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm">Nincs találat</div>
                )}
            </div>
        </div>
    );
}
