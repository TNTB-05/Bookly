import { useState, useEffect, useCallback } from 'react';
import { authApi } from '../../auth/auth';
import { useNotification } from '../../../components/NotificationContext';
import StaffCard from './StaffCard';
import StaffCalendarView from './StaffCalendarView';

const StaffManagement = () => {
    const [staff, setStaff] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [showDetailOnMobile, setShowDetailOnMobile] = useState(false);
    const { showToast } = useNotification();

    const fetchStaff = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authApi.get('/api/salon/providers');
            const data = await response.json();
            if (data.success) {
                setStaff(data.providers);
                setSelectedStaff(prev => {
                    if (!prev) return prev;
                    return data.providers.find(p => p.id === prev.id) || prev;
                });
            }
        } catch (error) {
            console.error('Error fetching staff:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStaff(); }, [fetchStaff]);

    const handleSelectStaff = (member) => {
        setSelectedStaff(member);
        setShowDetailOnMobile(true);
    };

    const handleToggleStatus = async (member) => {
        const newStatus = member.status === 'active' ? 'inactive' : 'active';
        setActionLoading(`status-${member.id}`);
        try {
            const response = await authApi.put(`/api/salon/provider/${member.id}`, { status: newStatus });
            const data = await response.json();
            if (data.success) {
                showToast(`${member.name} státusza módosítva: ${newStatus === 'active' ? 'Aktív' : 'Inaktív'}`, 'success');
                fetchStaff();
            } else {
                showToast(data.message || 'Hiba történt', 'error');
            }
        } catch {
            showToast('Hiba történt a státusz módosításakor', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleManager = async (member) => {
        const newIsManager = !member.isManager;
        setActionLoading(`manager-${member.id}`);
        try {
            const response = await authApi.put(`/api/salon/provider/${member.id}`, { isManager: newIsManager });
            const data = await response.json();
            if (data.success) {
                showToast(`${member.name} ${newIsManager ? 'menedzser lett' : 'elveszítette a menedzser jogokat'}`, 'success');
                fetchStaff();
            } else {
                showToast(data.message || 'Hiba történt', 'error');
            }
        } catch {
            showToast('Hiba történt a szerepkör módosításakor', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemove = async (member) => {
        if (!window.confirm(`Biztosan eltávolítja ${member.name} munkatársat a szalonból?`)) return;
        setActionLoading(`remove-${member.id}`);
        try {
            const response = await authApi.delete(`/api/salon/provider/${member.id}`);
            const data = await response.json();
            if (data.success) {
                showToast(`${member.name} eltávolítva a szalonból`, 'success');
                if (selectedStaff?.id === member.id) {
                    setSelectedStaff(null);
                    setShowDetailOnMobile(false);
                }
                fetchStaff();
            } else {
                showToast(data.message || 'Hiba történt', 'error');
            }
        } catch {
            showToast('Hiba történt az eltávolításkor', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const activeCount = staff.filter(m => m.status === 'active').length;
    const managerCount = staff.filter(m => m.isManager).length;

    return (
        <div>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Csapat kezelés</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {staff.length} munkatárs · {activeCount} aktív · {managerCount} menedzser
                </p>
            </div>

            {/* Main Layout */}
            <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">

                {/* Left: Staff List */}
                <div className={`w-72 shrink-0 flex flex-col gap-2
                    ${showDetailOnMobile ? 'hidden md:flex' : 'flex'}`}>
                    <div className="bg-white/30 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm flex-1 overflow-y-auto p-3">
                        {loading ? (
                            <div className="space-y-2">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                                        <div className="w-10 h-10 rounded-full bg-white/60"></div>
                                        <div className="flex-1 space-y-1.5">
                                            <div className="h-3 bg-white/60 rounded w-3/4"></div>
                                            <div className="h-2.5 bg-white/40 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : staff.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-sm text-gray-400">Nincsenek munkatársak</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {staff.map(member => (
                                    <StaffCard
                                        key={member.id}
                                        member={member}
                                        isSelected={selectedStaff?.id === member.id}
                                        onClick={handleSelectStaff}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Detail Panel */}
                <div className={`flex-1 flex flex-col min-w-0
                    ${!showDetailOnMobile && !selectedStaff ? 'hidden md:flex' : 'flex'}`}>
                    {selectedStaff ? (
                        <div className="flex flex-col h-full gap-4">
                            {/* Action Buttons */}
                            <div className="bg-white/30 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-4">
                                <div className="flex flex-wrap gap-2 items-center">
                                    <span className="text-xs font-semibold text-gray-500 mr-1">Műveletek:</span>

                                    <button
                                        onClick={() => handleToggleManager(selectedStaff)}
                                        disabled={actionLoading === `manager-${selectedStaff.id}`}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/60 hover:bg-white border border-white/70 text-gray-700 hover:text-dark-blue transition-all disabled:opacity-50">
                                        {actionLoading === `manager-${selectedStaff.id}` ? (
                                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-dark-blue border-t-transparent"></div>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                                            </svg>
                                        )}
                                        {selectedStaff.isManager ? 'Lefokozás' : 'Előléptetés'}
                                    </button>

                                    <button
                                        onClick={() => handleToggleStatus(selectedStaff)}
                                        disabled={actionLoading === `status-${selectedStaff.id}`}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 border
                                            ${selectedStaff.status === 'active'
                                                ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700'
                                                : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'}`}>
                                        {actionLoading === `status-${selectedStaff.id}` ? (
                                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent"></div>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
                                            </svg>
                                        )}
                                        {selectedStaff.status === 'active' ? 'Deaktiválás' : 'Aktiválás'}
                                    </button>

                                    <button
                                        onClick={() => handleRemove(selectedStaff)}
                                        disabled={actionLoading === `remove-${selectedStaff.id}`}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition-all disabled:opacity-50 ml-auto">
                                        {actionLoading === `remove-${selectedStaff.id}` ? (
                                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-500 border-t-transparent"></div>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                                            </svg>
                                        )}
                                        Eltávolítás
                                    </button>
                                </div>
                            </div>

                            {/* Calendar */}
                            <div className="flex-1 min-h-0">
                                <StaffCalendarView
                                    staff={selectedStaff}
                                    onBack={() => { setShowDetailOnMobile(false); }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 hidden md:flex items-center justify-center bg-white/20 backdrop-blur-md rounded-2xl border border-white/40 border-dashed">
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-2xl bg-white/40 flex items-center justify-center mx-auto mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-gray-500">Válassz munkatársat</p>
                                <p className="text-xs text-gray-400 mt-1">a naptár és kezelőfelület megjelenítéséhez</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StaffManagement;
