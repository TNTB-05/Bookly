import { useState, useEffect, useCallback } from 'react';
import { authApi } from '../../../auth/auth';
import HourIcon from '../../../../icons/HourIcon';
import TickIcon from '../../../../icons/TickIcon';
import PlusIcon from '../../../../icons/PlusIcon';
import DiaryIcon from '../../../../icons/DiaryIcon';
import LightningIcon from '../../../../icons/LightningIcon';
import CustomerAppointmentModal from '../CustomerAppointmentModal';
import RatingModal from '../RatingModal';
import { useNotification } from '../../../../components/NotificationContext';

// ========================
// Constants
// ========================
const START_HOUR = 7;
const END_HOUR = 21;
const MINUTES_PER_PIXEL = 1;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

const daysOfWeek = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
const monthNames = ['Január', 'Február', 'Március', 'Április', 'Május', 'Június', 'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'];

const statusColors = {
    scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    canceled: 'bg-red-100 text-red-600 border-red-300',
    no_show: 'bg-gray-100 text-gray-500 border-gray-300',
    deleted: 'bg-amber-50 text-amber-700 border-amber-300'
};

const statusLabels = {
    scheduled: 'Várható',
    completed: 'Elvégezve',
    canceled: 'Lemondva',
    no_show: 'Nem jelent meg',
    deleted: 'Törölve'
};

// ========================
// Component
// ========================
export default function AppointmentsTab({ user, setActiveTab, loadTopRatedSalons }) {
    const { showToast, showConfirm } = useNotification();

    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [cancelingId, setCancelingId] = useState(null);
    const [ratingAppointment, setRatingAppointment] = useState(null);

    const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

    // ========================
    // Data loading
    // ========================
    useEffect(() => {
        loadAppointments();
    }, []);

    async function loadAppointments() {
        try {
            setLoading(true);
            setError(null);
            const response = await authApi.get('/api/user/appointments');
            const data = await response.json();
            if (data.success) {
                setAppointments(data.appointments);
            } else {
                setError(data.message || 'Hiba történt a foglalások betöltésekor');
            }
        } catch (err) {
            console.error('Hiba a foglalások betöltésekor:', err);
            setError('Hiba történt a foglalások betöltésekor');
        } finally {
            setLoading(false);
        }
    }

    // ========================
    // Actions
    // ========================
    async function handleCancelAppointment(appointmentId) {
        const confirmed = await showConfirm('Biztosan le szeretnéd mondani ezt a foglalást?', { danger: true });
        if (!confirmed) return;

        try {
            setCancelingId(appointmentId);
            const response = await authApi.delete(`/api/user/appointments/${appointmentId}`);
            const data = await response.json();
            if (data.success) {
                showToast('Foglalás sikeresen lemondva', 'success');
                setShowModal(false);
                setSelectedAppointment(null);
                loadAppointments();
            } else {
                showToast(data.message || 'Hiba történt a foglalás lemondásakor', 'error');
            }
        } catch (err) {
            console.error('Hiba a foglalás lemondásakor:', err);
            showToast('Hiba történt a foglalás lemondásakor', 'error');
        } finally {
            setCancelingId(null);
        }
    }

    // ========================
    // Calendar logic
    // ========================
    const generateCalendarDays = useCallback(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        const daysInMonth = lastDay.getDate();

        const days = [];
        for (let i = 0; i < startDayOfWeek; i++) days.push(null);
        for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day));
        return days;
    }, [currentDate]);

    const getAppointmentsForDate = useCallback(
        (date) =>
            appointments.filter((apt) => {
                const aptDate = new Date(apt.appointment_start);
                return aptDate.toDateString() === date.toDateString();
            }),
        [appointments]
    );

    const getDayIndicator = useCallback(
        (date) => {
            if (!date) return null;
            const dayApts = getAppointmentsForDate(date).filter(
                (a) => a.status !== 'canceled' && a.status !== 'deleted'
            );
            if (dayApts.length === 0) return null;
            const hasUpcoming = dayApts.some((a) => a.status === 'scheduled');
            return hasUpcoming ? 'upcoming' : 'past';
        },
        [getAppointmentsForDate]
    );

    const getAppointmentStyle = (apt) => {
        const start = new Date(apt.appointment_start);
        const end = new Date(apt.appointment_end);
        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const endMinutes = end.getHours() * 60 + end.getMinutes();
        const topOffset = startMinutes - START_HOUR * 60;
        const duration = endMinutes - startMinutes;
        return {
            top: `${topOffset * MINUTES_PER_PIXEL}px`,
            height: `${Math.max(duration * MINUTES_PER_PIXEL, 30)}px`
        };
    };

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    // ========================
    // Formatters
    // ========================
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getStatusBadge(status, apt) {
        if (status === 'completed') {
            const isRated = apt.rating_id !== null;
            if (isRated) {
                return (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setRatingAppointment(apt);
                        }}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 hover:bg-green-200 transition-colors cursor-pointer flex items-center gap-1"
                    >
                        ✓ Értékelve
                    </button>
                );
            }
            return (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setRatingAppointment(apt);
                    }}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors cursor-pointer"
                >
                    ★ Értékelem
                </button>
            );
        }
        const label = statusLabels[status] || status;
        const color = statusColors[status] || 'bg-gray-100 text-gray-600 border-gray-200';
        return <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${color}`}>{label}</span>;
    }

    // ========================
    // Derived data
    // ========================
    const calendarDays = generateCalendarDays();
    const todayAppointments = selectedDate
        ? getAppointmentsForDate(selectedDate).filter(
              (a) => a.status !== 'canceled' && a.status !== 'deleted'
          )
        : [];
    const upcomingAppointments = appointments
        .filter((a) => a.status === 'scheduled')
        .sort((a, b) => new Date(a.appointment_start) - new Date(b.appointment_start));
    const pastAppointments = appointments.filter((a) => a.status !== 'scheduled').sort((a, b) => new Date(b.appointment_start) - new Date(a.appointment_start));

    // ========================
    // Render
    // ========================
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Foglalásaim</h1>
                    <p className="text-sm text-gray-500 mt-0.5">A naptárban megtekintheted és kezelheted az időpontjaidat.</p>
                </div>
                <button
                    onClick={() => setActiveTab('overview')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors shadow-sm shrink-0"
                >
                    <PlusIcon />
                    Új foglalás
                </button>
            </div>

            {/* ======================== */}
            {/* Calendar Section */}
            {/* ======================== */}
            {loading ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto" />
                    <p className="mt-4 text-gray-600">Foglalások betöltése...</p>
                </div>
            ) : error ? (
                <div className="text-center py-16 rounded-xl border border-red-200 bg-red-50">
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={loadAppointments}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                    >
                        Újrapróbálás
                    </button>
                </div>
            ) : appointments.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <DiaryIcon />
                    <h3 className="text-lg font-medium text-gray-900">Még nincs foglalásod</h3>
                    <p className="text-gray-500 mt-1">Foglalj időpontot szolgáltatásainkra!</p>
                    <button
                        onClick={() => setActiveTab('overview')}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                    >
                        Új foglalás indítása
                    </button>
                </div>
            ) : (
                <>
                    {/* Calendar two-column */}
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Monthly Calendar */}
                        <div className="w-full lg:w-auto lg:min-w-[320px]">
                            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
                                {/* Month Navigation */}
                                <div className="flex items-center justify-between mb-4">
                                    <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                            className="w-5 h-5 text-gray-600"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                        </svg>
                                    </button>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                                    </h3>
                                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                            className="w-5 h-5 text-gray-600"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Day headers */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {daysOfWeek.map((day, i) => (
                                        <div key={i} className="text-center text-xs font-semibold text-gray-500 py-2">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Day cells */}
                                <div className="grid grid-cols-7 gap-1">
                                    {calendarDays.map((date, index) => {
                                        const isToday = date && date.toDateString() === new Date().toDateString();
                                        const isSelected = date && date.toDateString() === selectedDate.toDateString();
                                        const indicator = getDayIndicator(date);

                                        return (
                                            <button
                                                key={index}
                                                onClick={() => date && setSelectedDate(date)}
                                                disabled={!date}
                                                className={`
                                                    aspect-square p-1 rounded-lg text-sm font-medium transition-all relative
                                                    ${!date ? 'cursor-default' : 'hover:bg-gray-100 cursor-pointer'}
                                                    ${isToday ? 'ring-2 ring-indigo-500' : ''}
                                                    ${isSelected ? 'bg-indigo-600 text-white' : 'text-gray-700'}
                                                `}
                                            >
                                                {date?.getDate()}
                                                {indicator && !isSelected && (
                                                    <div
                                                        className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                                                            indicator === 'upcoming' ? 'bg-indigo-500' : 'bg-gray-400'
                                                        }`}
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Daily Timeline */}
                        <div className="flex-1">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-4 border-b border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {selectedDate.toLocaleDateString('hu-HU', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-0.5">{todayAppointments.length} foglalás</p>
                                </div>
                                <div className="max-h-100 sm:max-h-125 lg:max-h-150 overflow-y-auto">
                                    <div className="flex" style={{ height: `${TOTAL_MINUTES * MINUTES_PER_PIXEL}px` }}>
                                        {/* Hour labels */}
                                        <div className="w-14 shrink-0 border-r border-gray-100 relative">
                                            {hours.map((hour, index) => (
                                                <div
                                                    key={hour}
                                                    className="absolute left-0 right-0 pr-2 text-right -translate-y-1/2"
                                                    style={{ top: `${index * 60 * MINUTES_PER_PIXEL}px` }}
                                                >
                                                    <span className="text-xs font-medium text-gray-400">{hour.toString().padStart(2, '0')}:00</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Timeline area */}
                                        <div className="flex-1 relative">
                                            {/* Hour lines */}
                                            {hours.map((hour) => (
                                                <div
                                                    key={hour}
                                                    className="absolute left-0 right-0 border-b border-gray-200"
                                                    style={{ top: `${(hour - START_HOUR) * 60 * MINUTES_PER_PIXEL}px` }}
                                                />
                                            ))}
                                            {/* Half-hour lines */}
                                            {hours.map((hour) => (
                                                <div
                                                    key={`half-${hour}`}
                                                    className="absolute left-0 right-0 border-b border-gray-100 border-dashed"
                                                    style={{ top: `${((hour - START_HOUR) * 60 + 30) * MINUTES_PER_PIXEL}px` }}
                                                />
                                            ))}

                                            {/* Empty state */}
                                            {todayAppointments.length === 0 && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <p className="text-gray-400 text-sm">Nincs foglalás erre a napra</p>
                                                </div>
                                            )}

                                            {/* Appointments */}
                                            {todayAppointments.map((apt) => {
                                                const startMins =
                                                    new Date(apt.appointment_start).getHours() * 60 + new Date(apt.appointment_start).getMinutes();
                                                const endMins = new Date(apt.appointment_end).getHours() * 60 + new Date(apt.appointment_end).getMinutes();
                                                const blockPx = Math.max((endMins - startMins) * MINUTES_PER_PIXEL, 30);
                                                const style = getAppointmentStyle(apt);
                                                const isShort = blockPx <= 50;
                                                return (
                                                    <button
                                                        key={apt.id}
                                                        onClick={() => {
                                                            setSelectedAppointment(apt);
                                                            setShowModal(true);
                                                        }}
                                                        className={`
                                                            absolute left-1 right-1 sm:left-2 sm:right-2
                                                            px-2 rounded-lg border-l-2 border transition-all
                                                            hover:shadow-md hover:z-10 active:scale-[0.98]
                                                            ${statusColors[apt.status] || 'bg-gray-100 text-gray-700 border-gray-200'}
                                                        `}
                                                        style={{ ...style, paddingTop: '3px', paddingBottom: '3px' }}
                                                    >
                                                        {isShort ? (
                                                            <div className="flex items-center gap-1.5 w-full min-w-0 overflow-hidden">
                                                                <span className="text-[15px] font-semibold leading-none truncate shrink min-w-0">
                                                                    {apt.service_name}
                                                                </span>
                                                                <span className="text-xs leading-none opacity-60 truncate shrink min-w-0">
                                                                    {apt.salon_name}
                                                                </span>
                                                                <span className="text-xs font-semibold leading-none whitespace-nowrap shrink-0 ml-auto">
                                                                    {Number(apt.price).toLocaleString()} Ft
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col gap-px text-left w-full min-w-0 overflow-hidden">
                                                                <p className="text-[10px] sm:text-xs font-semibold leading-tight truncate">
                                                                    {apt.service_name}
                                                                </p>
                                                                <p className="text-[9px] sm:text-[10px] leading-tight truncate opacity-70">{apt.salon_name}</p>
                                                                <p className="text-[9px] sm:text-[10px] font-semibold leading-tight">
                                                                    {Number(apt.price).toLocaleString()} Ft
                                                                </p>
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ======================== */}
                    {/* Összes foglalásaim */}
                    {/* ======================== */}
                    <div className="space-y-8">
                        {/* Upcoming */}
                        {upcomingAppointments.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Közelgő foglalások</h2>
                                <div className="space-y-3">
                                    {upcomingAppointments.map((apt) => (
                                        <div
                                            key={apt.id}
                                            onClick={() => {
                                                setSelectedAppointment(apt);
                                                setShowModal(true);
                                            }}
                                            className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition-shadow cursor-pointer"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 p-2.5 rounded-full bg-blue-50 hidden sm:block">
                                                    <HourIcon className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900">{apt.salon_name}</h3>
                                                    <p className="text-gray-600 text-sm">
                                                        {apt.provider_name} – {apt.service_name}
                                                    </p>
                                                    <div className="flex items-center text-gray-700 mt-1 text-sm">
                                                        <HourIcon className="h-4 w-4 mr-1 text-gray-500" />
                                                        {formatDate(apt.appointment_start)}
                                                    </div>
                                                    <div className="flex items-center text-gray-600 mt-0.5 text-sm">
                                                        <LightningIcon className="h-4 w-4 mr-1 text-gray-500" />
                                                        Időtartam: {apt.duration_minutes} perc
                                                    </div>
                                                    {apt.comment && <p className="text-gray-500 text-sm mt-1 italic">"{apt.comment}"</p>}
                                                </div>
                                            </div>
                                            <div className="flex flex-row items-center justify-between md:flex-col md:items-end gap-2 mt-4 md:mt-0 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                                                <p className="text-xl font-bold text-gray-900">{apt.price} Ft</p>
                                                <div className="flex flex-col items-end gap-2">
                                                    {getStatusBadge(apt.status, apt)}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCancelAppointment(apt.id);
                                                        }}
                                                        disabled={cancelingId === apt.id}
                                                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-colors disabled:opacity-50"
                                                    >
                                                        {cancelingId === apt.id ? 'Lemondás...' : 'Lemondás'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Past / Other */}
                        {pastAppointments.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Korábbi foglalások</h2>
                                <div className="space-y-3">
                                    {pastAppointments.map((apt) => {
                                        const isInactive = apt.status === 'canceled' || apt.status === 'deleted';
                                        const cardBorder =
                                            apt.status === 'canceled'
                                                ? 'border-l-4 border-l-red-400 border-gray-200'
                                                : apt.status === 'deleted'
                                                  ? 'border-l-4 border-l-amber-400 border-gray-200'
                                                  : 'border-gray-200';
                                        return (
                                            <div
                                                key={apt.id}
                                                onClick={() => {
                                                    setSelectedAppointment(apt);
                                                    setShowModal(true);
                                                }}
                                                className={`bg-white p-5 rounded-xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition-shadow cursor-pointer ${cardBorder} ${isInactive ? 'grayscale opacity-55' : ''}`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`mt-1 p-2.5 rounded-full hidden sm:block ${isInactive ? 'bg-gray-100' : 'bg-green-50'}`}>
                                                        {isInactive ? (
                                                            <DiaryIcon className="w-5 h-5 text-gray-400" />
                                                        ) : (
                                                            <TickIcon className="w-5 h-5 text-green-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className={`text-lg font-bold ${isInactive ? 'text-gray-500' : 'text-gray-900'}`}>
                                                            {apt.salon_name}
                                                        </h3>
                                                        <p className="text-gray-600 text-sm">
                                                            {apt.provider_name} – {apt.service_name}
                                                        </p>
                                                        {apt.status === 'deleted' && apt.deleted_reason && (
                                                            <p className="text-amber-600 text-sm mt-0.5">Törlés oka: {apt.deleted_reason}</p>
                                                        )}
                                                        <div className="flex items-center text-gray-700 mt-1 text-sm">
                                                            <HourIcon className="h-4 w-4 mr-1 text-gray-500" />
                                                            {formatDate(apt.appointment_start)}
                                                        </div>
                                                        <div className="flex items-center text-gray-600 mt-0.5 text-sm">
                                                            <LightningIcon className="h-4 w-4 mr-1 text-gray-500" />
                                                            Időtartam: {apt.duration_minutes} perc
                                                        </div>
                                                        {apt.comment && <p className="text-gray-500 text-sm mt-1 italic">"{apt.comment}"</p>}
                                                    </div>
                                                </div>
                                                <div className="flex flex-row items-center justify-between md:flex-col md:items-end gap-2 mt-4 md:mt-0 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                                                    <p className="text-xl font-bold text-gray-900">{apt.price} Ft</p>
                                                    {getStatusBadge(apt.status, apt)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Appointment Detail Modal */}
            <CustomerAppointmentModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setSelectedAppointment(null);
                }}
                appointment={selectedAppointment}
                onCancel={handleCancelAppointment}
                cancelLoading={!!cancelingId}
                onRate={(apt) => {
                    setShowModal(false);
                    setRatingAppointment(apt);
                }}
            />

            {/* Rating Modal */}
            {ratingAppointment && (
                <RatingModal
                    appointment={ratingAppointment}
                    onClose={() => setRatingAppointment(null)}
                    onSaved={() => {
                        loadAppointments();
                        loadTopRatedSalons?.();
                    }}
                />
            )}
        </div>
    );
}
