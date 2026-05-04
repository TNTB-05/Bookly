import { useState, useEffect, useCallback } from 'react';
import { authApi } from '../../auth/auth';
import { useNotification } from '../../../components/NotificationContext';
import CreateAppointmentModal from './CalendarSection/CreateAppointmentModal';
import AppointmentDetailModal from './CalendarSection/AppointmentDetailModal';
import { API_URL } from '../../../config';
import BackArrowIcon from '../../../icons/BackArrowIcon';
import ChevronLeftIcon from '../../../icons/ChevronLeftIcon';
import ChevronRightIcon from '../../../icons/ChevronRightIcon';
import PlusIcon from '../../../icons/PlusIcon';

const apiUrl = API_URL;

const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
};

const toDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const formatDateHU = (date) => date.toLocaleDateString('hu-HU', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
});

const getStatusStyle = (status) => {
    switch (status) {
        case 'scheduled': return 'bg-blue-500 border-blue-600';
        case 'completed': return 'bg-emerald-500 border-emerald-600';
        case 'canceled': return 'bg-red-400 border-red-500 opacity-60';
        case 'no_show': return 'bg-gray-400 border-gray-500 opacity-60';
        default: return 'bg-blue-500 border-blue-600';
    }
};

const StaffCalendarView = ({ staff, onBack }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [timeBlocks, setTimeBlocks] = useState([]);
    const [workingHours, setWorkingHours] = useState({ openingHour: 8, closingHour: 20 });
    const [loading, setLoading] = useState(false);
    const [services, setServices] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        is_guest: false, user_email: '', user_name: '', user_phone: '',
        service_id: '', appointment_date: '', appointment_time: '', comment: ''
    });
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const { showToast } = useNotification();

    const START_HOUR = workingHours.openingHour;
    const END_HOUR = workingHours.closingHour;
    const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
    const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

    const fetchCalendar = useCallback(async () => {
        setLoading(true);
        try {
            const dateStr = toDateStr(selectedDate);
            const response = await authApi.get(`/api/staff/calendar/${staff.id}?date=${dateStr}`);
            const data = await response.json();
            if (data.success) {
                setAppointments(data.appointments);
                setTimeBlocks(data.timeBlocks || []);
                setWorkingHours({ openingHour: data.openingHour || 8, closingHour: data.closingHour || 20 });
            }
        } catch (error) {
            console.error('Error fetching staff calendar:', error);
        } finally {
            setLoading(false);
        }
    }, [staff.id, selectedDate]);

    const fetchServices = useCallback(async () => {
        try {
            const response = await authApi.get(`/api/staff/services/${staff.id}`);
            const data = await response.json();
            if (data.success) setServices(data.services || []);
        } catch (error) {
            console.error('Error fetching staff services:', error);
        }
    }, [staff.id]);

    useEffect(() => { fetchCalendar(); }, [fetchCalendar]);
    useEffect(() => { fetchServices(); }, [fetchServices]);

    const goToPrevDay = () => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 1);
        setSelectedDate(prev);
    };

    const goToNextDay = () => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);
        setSelectedDate(next);
    };

    const openCreateModal = () => {
        setCreateFormData({
            is_guest: false, user_email: '', user_name: '', user_phone: '',
            service_id: '', appointment_date: toDateStr(selectedDate),
            appointment_time: '', comment: ''
        });
        setShowCreateModal(true);
    };

    const handleCreate = async () => {
        setSaving(true);
        try {
            const response = await authApi.post('/api/staff/appointment', { staffId: staff.id, ...createFormData });
            const data = await response.json();
            if (data.success) {
                showToast('Foglalás sikeresen létrehozva', 'success');
                setShowCreateModal(false);
                fetchCalendar();
            } else {
                showToast(data.message || 'Hiba történt', 'error');
            }
        } catch {
            showToast('Hiba történt a foglalás létrehozásakor', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedAppointment) return;
        setDeleteLoading(true);
        try {
            const response = await authApi.delete(`/api/staff/appointment/${selectedAppointment.id}`);
            const data = await response.json();
            if (data.success) {
                showToast('Foglalás törölve', 'success');
                setShowDetailModal(false);
                setSelectedAppointment(null);
                fetchCalendar();
            } else {
                showToast(data.message || 'Hiba történt', 'error');
            }
        } catch {
            showToast('Hiba történt a törléskor', 'error');
        } finally {
            setDeleteLoading(false);
        }
    };

    const getTopPx = (dateStr) => {
        const date = new Date(dateStr);
        return Math.max(0, (date.getHours() - START_HOUR) * 60 + date.getMinutes());
    };

    const getHeightPx = (startStr, endStr) => {
        const duration = (new Date(endStr) - new Date(startStr)) / 60000;
        return Math.max(20, duration);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Staff Header */}
            <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 mb-4 border border-white/50 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={onBack}
                        className="md:hidden shrink-0 p-2 rounded-xl hover:bg-white/50 transition-colors text-gray-600"
                        aria-label="Vissza">
                        <BackArrowIcon className="w-5 h-5" />
                    </button>

                    {staff.profile_picture_url ? (
                        <img src={`${apiUrl}${staff.profile_picture_url}`} alt={staff.name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-white/70 shadow-md shrink-0" />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-dark-blue to-blue-400 text-white flex items-center justify-center text-lg font-bold border-2 border-white/70 shadow-md shrink-0">
                            {getInitials(staff.name)}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{staff.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                                ${staff.isManager ? 'bg-dark-blue/10 text-dark-blue' : 'bg-gray-100 text-gray-600'}`}>
                                {staff.isManager ? 'Menedzser' : 'Szolgáltató'}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                                ${staff.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                {staff.status === 'active' ? 'Aktív' : 'Inaktív'}
                            </span>
                            {staff.email && (
                                <span className="text-xs text-gray-500 hidden sm:block truncate">{staff.email}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <button onClick={goToPrevDay}
                        className="p-2 rounded-xl hover:bg-white/50 transition-colors text-gray-600 bg-white/30 border border-white/50">
                        <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setSelectedDate(new Date())}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-white/50 transition-colors text-gray-600 bg-white/30 border border-white/50">
                        Ma
                    </button>
                    <button onClick={goToNextDay}
                        className="p-2 rounded-xl hover:bg-white/50 transition-colors text-gray-600 bg-white/30 border border-white/50">
                        <ChevronRightIcon className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold text-gray-700 hidden sm:block capitalize">
                        {formatDateHU(selectedDate)}
                    </span>
                    <span className="text-sm font-semibold text-gray-700 sm:hidden">
                        {selectedDate.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
                    </span>
                </div>

                <button onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2 bg-dark-blue text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors shadow-sm">
                    <PlusIcon className="w-4 h-4" />
                    Új foglalás
                </button>
            </div>

            {/* Timeline */}
            <div className="flex-1 bg-white/30 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-dark-blue border-t-transparent"></div>
                    </div>
                ) : (
                    <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
                        <div className="relative flex" style={{ minHeight: `${TOTAL_MINUTES}px` }}>
                            {/* Hour labels */}
                            <div className="w-14 shrink-0 border-r border-white/40 bg-white/20">
                                {hours.map(hour => (
                                    <div key={hour} style={{ height: 60 }} className="flex items-start justify-end pr-2 pt-1">
                                        <span className="text-[11px] font-medium text-gray-400">{String(hour).padStart(2, '0')}:00</span>
                                    </div>
                                ))}
                            </div>

                            {/* Timeline area */}
                            <div className="flex-1 relative">
                                {hours.map(hour => (
                                    <div key={hour} style={{ top: (hour - START_HOUR) * 60, position: 'absolute', left: 0, right: 0, height: 60 }}
                                        className="border-t border-white/40" />
                                ))}

                                {/* Time blocks */}
                                {timeBlocks.map((block, idx) => (
                                    <div key={idx}
                                        style={{ top: getTopPx(block.start_datetime), height: getHeightPx(block.start_datetime, block.end_datetime), position: 'absolute', left: 4, right: 4 }}
                                        className="rounded-lg bg-gray-200/70 border border-gray-300/50 flex items-center px-2">
                                        <span className="text-[10px] text-gray-500 font-medium truncate">{block.label || 'Szünet'}</span>
                                    </div>
                                ))}

                                {/* Appointments */}
                                {appointments.map((appt) => {
                                    const top = getTopPx(appt.appointment_start);
                                    const height = getHeightPx(appt.appointment_start, appt.appointment_end);
                                    const startTime = new Date(appt.appointment_start).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
                                    const endTime = new Date(appt.appointment_end).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
                                    return (
                                        <button key={appt.id}
                                            onClick={() => { setSelectedAppointment(appt); setShowDetailModal(true); }}
                                            style={{ top, height, position: 'absolute', left: 4, right: 4 }}
                                            className={`rounded-lg border text-white text-left px-2 py-1 shadow-sm hover:brightness-110 transition-all overflow-hidden ${getStatusStyle(appt.status)}`}>
                                            <p className="text-[11px] font-bold truncate leading-tight">{appt.user_name}</p>
                                            {height > 35 && <p className="text-[10px] opacity-90 truncate">{appt.service_name}</p>}
                                            {height > 50 && <p className="text-[10px] opacity-75">{startTime} – {endTime}</p>}
                                        </button>
                                    );
                                })}

                                {appointments.length === 0 && timeBlocks.length === 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <p className="text-sm text-gray-400 font-medium">Nincs foglalás ezen a napon</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <CreateAppointmentModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                formData={createFormData}
                setFormData={setCreateFormData}
                services={services}
                workingHours={workingHours}
                saving={saving}
                onCreate={handleCreate}
            />

            <AppointmentDetailModal
                isOpen={showDetailModal}
                onClose={() => { setShowDetailModal(false); setSelectedAppointment(null); }}
                appointment={selectedAppointment}
                deleteLoading={deleteLoading}
                onDelete={handleDelete}
            />
        </div>
    );
};

export default StaffCalendarView;
