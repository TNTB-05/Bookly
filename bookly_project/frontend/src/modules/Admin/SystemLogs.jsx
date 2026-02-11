import { useState, useEffect } from 'react';
import { authApi } from '../auth/auth';
import RefreshIcon from '../../icons/RefreshIcon';

export default function SystemLogs() {
    const [logs, setLogs] = useState([]);
    const [allActions, setAllActions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [levelFilter, setLevelFilter] = useState('all');
    const [actionFilter, setActionFilter] = useState('');

    useEffect(() => { fetchLogs(); }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            let url = '/api/admin/logs?limit=200';
            if (levelFilter !== 'all') url += `&level=${levelFilter}`;
            if (actionFilter) url += `&action=${actionFilter}`;
            const res = await authApi.get(url);
            const data = await res.json();
            if (data.success) {
                setLogs(data.logs);
                // Only update available actions list on unfiltered fetch
                if (levelFilter === 'all' && !actionFilter) {
                    setAllActions([...new Set(data.logs.map(l => l.action))]);
                }
            }
        } catch (err) {
            console.error('Error fetching logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [levelFilter, actionFilter]);

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('hu-HU', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Budapest'
    }) : '—';

    const levelBadge = (level) => {
        const map = {
            INFO: 'bg-blue-100 text-blue-700',
            WARN: 'bg-amber-100 text-amber-700',
            CRITICAL: 'bg-red-100 text-red-700',
        };
        return (
            <span className={`px-2 py-0.5 text-xs font-mono font-medium rounded ${map[level] || 'bg-gray-100 text-gray-600'}`}>
                {level}
            </span>
        );
    };

    const actionLabels = {
        'USER_LOGIN': 'Felhasználó belépés',
        'ADMIN_LOGIN': 'Admin belépés',
        'PROVIDER_LOGIN': 'Szolgáltató belépés',
        'USER_BAN': 'Felhasználó tiltás',
        'USER_UNBAN': 'Tiltás feloldás',
        'USER_PIC_REMOVED': 'Profilkép törlés',
        'PROVIDER_DEACTIVATE': 'Szolgáltató deaktiválás',
        'PROVIDER_ACTIVATE': 'Szolgáltató aktiválás',
        'PROVIDER_PIC_REMOVED': 'Szolgáltató kép törlés',
        'SALON_BANNER_REMOVED': 'Szalon banner törlés',
        'SALON_LOGO_REMOVED': 'Szalon logó törlés',
        'SALON_DESC_REMOVED': 'Szalon leírás törlés',
        'APPOINTMENT_DELETE': 'Foglalás törlés',
        'APPOINTMENT_CREATED': 'Foglalás létrehozás',
        'USER_SIGNUP': 'Felhasználó regisztráció',
    };

    const uniqueActions = allActions;

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
                    value={levelFilter}
                    onChange={e => setLevelFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                >
                    <option value="all">Minden szint</option>
                    <option value="INFO">INFO</option>
                    <option value="WARN">WARN</option>
                    <option value="CRITICAL">CRITICAL</option>
                </select>
                <select
                    value={actionFilter}
                    onChange={e => setActionFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                >
                    <option value="">Minden művelet</option>
                    {uniqueActions.map(a => (
                        <option key={a} value={a}>{actionLabels[a] || a}</option>
                    ))}
                </select>
                <button
                    onClick={fetchLogs}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                >
                    <RefreshIcon className="w-4 h-4" />
                    Frissítés
                </button>
            </div>

            {/* Stats bar */}
            <div className="flex gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-bold text-blue-700">{logs.filter(l => l.level === 'INFO').length}</p>
                    <p className="text-xs text-blue-500">INFO</p>
                </div>
                <div className="bg-amber-50 rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-bold text-amber-700">{logs.filter(l => l.level === 'WARN').length}</p>
                    <p className="text-xs text-amber-500">WARN</p>
                </div>
                <div className="bg-red-50 rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-bold text-red-700">{logs.filter(l => l.level === 'CRITICAL').length}</p>
                    <p className="text-xs text-red-500">CRITICAL</p>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-bold text-gray-700">{logs.length}</p>
                    <p className="text-xs text-gray-500">Összes</p>
                </div>
            </div>

            {/* Log Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-gray-50">
                            <tr className="border-b border-gray-100">
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Időpont</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Szint</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Művelet</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Szereplő</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Cél</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Részletek</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} className={`border-b border-gray-50 transition-colors hover:bg-gray-50
                                    ${log.level === 'CRITICAL' ? 'bg-red-50/30' : log.level === 'WARN' ? 'bg-amber-50/30' : ''}`}>
                                    <td className="px-4 py-2.5 text-xs text-gray-500 font-mono whitespace-nowrap">{formatDate(log.created_at)}</td>
                                    <td className="px-4 py-2.5">{levelBadge(log.level)}</td>
                                    <td className="px-4 py-2.5">
                                        <span className="text-xs font-medium text-gray-700">
                                            {actionLabels[log.action] || log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-gray-600">
                                        {log.actor_type && <span className="capitalize">{log.actor_type}</span>}
                                        {log.actor_id && <span className="text-gray-400"> #{log.actor_id}</span>}
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-gray-600">
                                        {log.target_type && <span className="capitalize">{log.target_type}</span>}
                                        {log.target_id && <span className="text-gray-400"> #{log.target_id}</span>}
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-gray-500 max-w-xs truncate" title={log.details}>
                                        {log.details || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {logs.length === 0 && (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            Nincsenek naplóbejegyzések
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
