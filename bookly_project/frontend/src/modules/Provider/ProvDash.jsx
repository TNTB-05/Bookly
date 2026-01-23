import { useState, useRef, useEffect, useCallback } from 'react';
import Logo from '../../modules/Logo';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth';
import { authApi } from '../auth/auth';
import OverviewIcon from '../../icons/OverviewIcon';
import CalendarIcon from '../../icons/CalendarIcon';
import ServicesIcon from '../../icons/ServicesIcon';

// Section Components
const OverviewSection = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-dark-blue">Áttekintés</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50">
                <h3 className="text-gray-600 font-medium">Mai Foglalások</h3>
                <p className="text-4xl font-bold text-dark-blue mt-2">8</p>
            </div>
            <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50">
                <h3 className="text-gray-600 font-medium">Heti Bevétel</h3>
                <p className="text-4xl font-bold text-dark-blue mt-2">125.000 Ft</p>
            </div>
            <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50">
                <h3 className="text-gray-600 font-medium">Új Ügyfelek</h3>
                <p className="text-4xl font-bold text-dark-blue mt-2">12</p>
            </div>
        </div>
        
        <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50">
            <h3 className="text-xl font-bold text-dark-blue mb-4">Következő Időpontok</h3>
            <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center justify-between p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                KQ
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">Kiss Quinn</p>
                                <p className="text-sm text-gray-600">Hajvágás - 14:00</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Megerősítve
                        </span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const CalendarSection = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    
    // Working hours state (fetched from database)
    const [workingHours, setWorkingHours] = useState({ openingHour: 8, closingHour: 20 });

    // Derived timeline constants
    const START_HOUR = workingHours.openingHour;
    const END_HOUR = workingHours.closingHour;
    const MINUTES_PER_PIXEL = 1; // 1 minute = 1 pixel for better precision
    const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
    
    // Hours for the day view
    const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

    // Get start and end of current month for fetching appointments
    const getMonthRange = (date) => {
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        };
    };

    // Fetch working hours
    const fetchWorkingHours = useCallback(async () => {
        try {
            const response = await authApi.get('/api/provider/calendar/working-hours');
            const data = await response.json();
            if (data.success) {
                setWorkingHours({
                    openingHour: data.openingHour,
                    closingHour: data.closingHour
                });
            }
        } catch (error) {
            console.error('Error fetching working hours:', error);
        }
    }, []);

    // Fetch appointments
    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        try {
            const { startDate, endDate } = getMonthRange(currentDate);
            const response = await authApi.get(`/api/provider/calendar/appointments?startDate=${startDate}&endDate=${endDate}`);
            const data = await response.json();
            if (data.success) {
                setAppointments(data.appointments);
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    }, [currentDate]);

    // Fetch working hours on mount
    useEffect(() => {
        fetchWorkingHours();
    }, [fetchWorkingHours]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    // Get appointments for selected date
    const getAppointmentsForDate = (date) => {
        return appointments.filter(apt => {
            const aptDate = new Date(apt.appointment_start);
            return aptDate.toDateString() === date.toDateString();
        });
    };

    // Calculate appointment position and height for timeline
    const getAppointmentStyle = (apt) => {
        const start = new Date(apt.appointment_start);
        const end = new Date(apt.appointment_end);
        
        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const endMinutes = end.getHours() * 60 + end.getMinutes();
        
        const topOffset = startMinutes - (START_HOUR * 60);
        const duration = endMinutes - startMinutes;
        
        return {
            top: `${topOffset * MINUTES_PER_PIXEL}px`,
            height: `${Math.max(duration * MINUTES_PER_PIXEL, 30)}px`, // Minimum 30px height
        };
    };

    // Calendar navigation
    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // Generate calendar days
    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0
        const daysInMonth = lastDay.getDate();
        
        const days = [];
        
        // Empty cells for days before month starts
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }
        
        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }
        
        return days;
    };

    // Total slots based on working hours
    const TOTAL_SLOTS = END_HOUR - START_HOUR;

    // Get booking status for a date: 'empty' | 'available' | 'full'
    const getBookingStatus = (date) => {
        if (!date) return 'empty';
        
        const dayAppointments = appointments.filter(apt => {
            const aptDate = new Date(apt.appointment_start);
            return aptDate.toDateString() === date.toDateString() && apt.status !== 'canceled';
        });

        if (dayAppointments.length === 0) return 'empty';
        if (dayAppointments.length >= TOTAL_SLOTS) return 'full';
        return 'available';
    };

    // Format time
    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('hu-HU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'canceled': return 'bg-red-100 text-red-700 border-red-200';
            case 'no_show': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    // Get status text
    const getStatusText = (status) => {
        switch (status) {
            case 'scheduled': return 'Foglalt';
            case 'completed': return 'Teljesítve';
            case 'canceled': return 'Törölve';
            case 'no_show': return 'Nem jelent meg';
            default: return status;
        }
    };

    // Handle appointment click
    const handleAppointmentClick = (appointment) => {
        setSelectedAppointment(appointment);
        setShowModal(true);
    };

    // Handle delete appointment
    const handleDeleteAppointment = async () => {
        if (!selectedAppointment) return;
        
        setDeleteLoading(true);
        try {
            const response = await authApi.delete(`/api/provider/calendar/appointments/${selectedAppointment.id}`);
            const data = await response.json();
            if (data.success) {
                setShowModal(false);
                setSelectedAppointment(null);
                fetchAppointments();
            }
        } catch (error) {
            console.error('Error deleting appointment:', error);
        } finally {
            setDeleteLoading(false);
        }
    };

    // Days of week header
    const daysOfWeek = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];

    // Format month name
    const monthNames = ['Január', 'Február', 'Március', 'Április', 'Május', 'Június', 
                        'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'];

    const calendarDays = generateCalendarDays();
    const todayAppointments = getAppointmentsForDate(selectedDate);

    return (
        <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-dark-blue">Naptár</h2>
            
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                {/* Calendar - Mini on mobile, larger on desktop */}
                <div className="w-full lg:w-auto lg:min-w-[320px]">
                    <div className="bg-white/40 backdrop-blur-md p-3 sm:p-6 rounded-2xl shadow-lg border border-white/50">
                        {/* Month Navigation */}
                        <div className="flex items-center justify-between mb-4">
                            <button 
                                onClick={prevMonth}
                                className="p-1.5 sm:p-2 hover:bg-white/50 rounded-lg transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 text-dark-blue">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                            <h3 className="text-base sm:text-lg font-bold text-dark-blue">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h3>
                            <button 
                                onClick={nextMonth}
                                className="p-1.5 sm:p-2 hover:bg-white/50 rounded-lg transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 text-dark-blue">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        </div>

                        {/* Days of week header */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {daysOfWeek.map((day, index) => (
                                <div key={index} className="text-center text-[10px] sm:text-xs font-semibold text-gray-500 py-1 sm:py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((date, index) => {
                                const isToday = date && date.toDateString() === new Date().toDateString();
                                const isSelected = date && date.toDateString() === selectedDate.toDateString();
                                const bookingStatus = getBookingStatus(date);
                                
                                return (
                                    <button
                                        key={index}
                                        onClick={() => date && setSelectedDate(date)}
                                        disabled={!date}
                                        className={`
                                            aspect-square p-0.5 sm:p-1 rounded-lg text-xs sm:text-sm font-medium transition-all relative
                                            ${!date ? 'cursor-default' : 'hover:bg-white/50 cursor-pointer'}
                                            ${isToday ? 'ring-2 ring-dark-blue' : ''}
                                            ${isSelected ? 'bg-dark-blue text-white' : 'text-gray-700'}
                                        `}
                                    >
                                        {date?.getDate()}
                                        {bookingStatus !== 'empty' && !isSelected && (
                                            <div className={`absolute bottom-0.5 sm:bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                                                bookingStatus === 'full' ? 'bg-red-500' : 'bg-green-500'
                                            }`}></div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Day View - Schedule */}
                <div className="flex-1">
                    <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 overflow-hidden">
                        {/* Day header */}
                        <div className="p-3 sm:p-4 border-b border-white/50 bg-white/20">
                            <h3 className="text-base sm:text-lg font-bold text-dark-blue">
                                {selectedDate.toLocaleDateString('hu-HU', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                {todayAppointments.filter(a => a.status !== 'canceled').length} foglalás
                            </p>
                        </div>

                        {/* Timeline view */}
                        <div className="max-h-100 sm:max-h-125 lg:max-h-150 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dark-blue"></div>
                                </div>
                            ) : (
                                <div className="flex">
                                    {/* Hour labels column */}
                                    <div className="w-12 sm:w-16 shrink-0 border-r border-gray-100">
                                        {hours.map((hour) => (
                                            <div 
                                                key={hour} 
                                                className="h-15 p-1 sm:p-2 text-right border-b border-gray-50"
                                            >
                                                <span className="text-[10px] sm:text-xs font-medium text-gray-400">
                                                    {hour.toString().padStart(2, '0')}:00
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Timeline with appointments */}
                                    <div 
                                        className="flex-1 relative"
                                        style={{ height: `${TOTAL_MINUTES * MINUTES_PER_PIXEL}px` }}
                                    >
                                        {/* Hour grid lines */}
                                        {hours.map((hour) => (
                                            <div 
                                                key={hour}
                                                className="absolute left-0 right-0 border-b border-gray-100"
                                                style={{ top: `${(hour - START_HOUR) * 60 * MINUTES_PER_PIXEL}px` }}
                                            />
                                        ))}
                                        
                                        {/* Half-hour grid lines */}
                                        {hours.map((hour) => (
                                            <div 
                                                key={`half-${hour}`}
                                                className="absolute left-0 right-0 border-b border-gray-50 border-dashed"
                                                style={{ top: `${((hour - START_HOUR) * 60 + 30) * MINUTES_PER_PIXEL}px` }}
                                            />
                                        ))}
                                        
                                        {/* Appointments */}
                                        {todayAppointments.length === 0 ? (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <p className="text-gray-400 text-sm">Nincs foglalás erre a napra</p>
                                            </div>
                                        ) : (
                                            todayAppointments.map((apt) => {
                                                const style = getAppointmentStyle(apt);
                                                return (
                                                    <button
                                                        key={apt.id}
                                                        onClick={() => handleAppointmentClick(apt)}
                                                        className={`
                                                            absolute left-1 right-1 sm:left-2 sm:right-2 
                                                            p-1.5 sm:p-2 rounded-lg border transition-all overflow-hidden
                                                            hover:shadow-md hover:z-10 active:scale-[0.98]
                                                            ${getStatusColor(apt.status)}
                                                        `}
                                                        style={style}
                                                    >
                                                        <div className="flex flex-col h-full">
                                                            <p className="font-semibold text-xs sm:text-sm truncate">
                                                                {apt.user_name}
                                                            </p>
                                                            <p className="text-[10px] sm:text-xs opacity-80">
                                                                {formatTime(apt.appointment_start)} - {formatTime(apt.appointment_end)}
                                                            </p>
                                                            <span className="text-[10px] sm:text-xs font-medium mt-auto">
                                                                {apt.price.toLocaleString()} Ft
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Appointment Detail Modal */}
            {showModal && selectedAppointment && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    ></div>
                    
                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                        {/* Header */}
                        <div className={`p-4 sm:p-6 ${getStatusColor(selectedAppointment.status)}`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg sm:text-xl font-bold">
                                        {selectedAppointment.user_name}
                                    </h3>
                                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-white/30">
                                        {getStatusText(selectedAppointment.status)}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => setShowModal(false)}
                                    className="p-1 hover:bg-white/30 rounded-lg transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 sm:p-6 space-y-4">
                            {/* Time */}
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-600">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Időpont</p>
                                    <p className="font-medium text-gray-900">
                                        {new Date(selectedAppointment.appointment_start).toLocaleDateString('hu-HU', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {formatTime(selectedAppointment.appointment_start)} - {formatTime(selectedAppointment.appointment_end)}
                                    </p>
                                </div>
                            </div>

                            {/* Contact */}
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-600">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Kapcsolat</p>
                                    <p className="font-medium text-gray-900">{selectedAppointment.user_email}</p>
                                    {selectedAppointment.user_phone && (
                                        <p className="text-sm text-gray-600">{selectedAppointment.user_phone}</p>
                                    )}
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-yellow-600">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Ár</p>
                                    <p className="font-bold text-lg text-gray-900">
                                        {selectedAppointment.price.toLocaleString()} Ft
                                    </p>
                                </div>
                            </div>

                            {/* Comment */}
                            {selectedAppointment.comment && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-purple-600">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Megjegyzés</p>
                                        <p className="text-sm text-gray-700">{selectedAppointment.comment}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        {selectedAppointment.status === 'scheduled' && (
                            <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50">
                                <button
                                    onClick={handleDeleteAppointment}
                                    disabled={deleteLoading}
                                    className="w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {deleteLoading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                            Foglalás törlése
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const ServicesSection = () => (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-dark-blue">Szolgáltatások Kezelése</h2>
            <button className="px-4 py-2 bg-dark-blue text-white rounded-xl font-medium hover:bg-blue-800 transition-colors shadow-md">
                + Új Szolgáltatás
            </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4].map((item) => (
                <div key={item} className="group bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50 hover:border-white/80 transition-all hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-light-blue rounded-lg flex items-center justify-center text-dark-blue">
                             <ServicesIcon />
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1 hover:bg-white/50 rounded text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                            </button>
                            <button className="p-1 hover:bg-white/50 rounded text-red-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </button>
                        </div>
                    </div>
                    <h3 className="font-bold text-lg text-gray-900">Férfi Hajvágás</h3>
                    <p className="text-gray-500 text-sm mt-1">30 perc • 4.500 Ft</p>
                </div>
            ))}
        </div>
    </div>
);

const NavButton = ({ activeTab, tabId, label, icon, onClick, isMobile }) => (
    <button
        onClick={() => onClick(tabId)}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 relative overflow-hidden
            ${activeTab === tabId
                ? 'bg-dark-blue text-white shadow-lg scale-105'
                : 'hover:bg-white/40 text-gray-700 hover:text-dark-blue'
            }
            ${isMobile ? 'flex-col text-[10px] gap-1 p-2 w-full justify-center' : 'w-full'}
        `}
    >
        <div className={`transition-transform duration-300 ${activeTab === tabId && !isMobile ? 'translate-x-1' : ''}`}>
             {icon}
        </div>
        <span className={`${isMobile ? 'font-medium' : 'font-semibold'}`}>{label}</span>
        
        {/* Active Indicator Glow */}
        {activeTab === tabId && (
            <div className="absolute inset-0 bg-white/10 opacity-50 blur-md rounded-xl"></div>
        )}
    </button>
);

const UserDropdown = ({ isOpen, onLogout }) => {
    if (!isOpen) return null;
    
    return (
        <div className="absolute top-14 right-4 w-52 bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl overflow-hidden animate-fade-in z-50">
            <div className="p-4 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-900">Minta Szolgáltató</p>
                <p className="text-xs text-gray-500 truncate">info@mintaszolgaltato.hu</p>
            </div>
            <div className="p-2 space-y-1">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white/50 rounded-lg transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    Profil Szerkesztése
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white/50 rounded-lg transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Beállítások
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button 
                    onClick={onLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    Kijelentkezés
                </button>
            </div>
        </div>
    );
};

export default function ProvDash() {
    const [activeTab, setActiveTab] = useState('overview');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const { setIsAuthenticated } = useAuth();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        setIsAuthenticated(false);
        navigate('/');
    };
    
    const renderContent = () => {
        switch(activeTab) {
            case 'overview': return <OverviewSection />;
            case 'calendar': return <CalendarSection />;
            case 'services': return <ServicesSection />;
            default: return <OverviewSection />;
        }
    };

    return (
        <div className="min-h-screen bg-base-blue flex flex-col font-sans text-gray-900">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/30 backdrop-blur-md border-b border-white/40 shadow-sm flex items-center justify-between px-4 sm:px-6">
                <div className="h-10 flex items-center">
                    <Logo className="h-full w-auto object-contain cursor-pointer" />
                </div>
                
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 focus:outline-none group"
                    >
                        <span className="hidden sm:block text-sm font-medium text-gray-700 group-hover:text-dark-blue transition-colors">
                            Üdv, Szolgáltató!
                        </span>
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-dark-blue to-blue-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm font-bold border-2 border-white/50 cursor-pointer">
                            Sz
                        </div>
                    </button>

                    <UserDropdown 
                        isOpen={isDropdownOpen} 
                        onLogout={handleLogout}
                    />
                </div>
            </header>

            <div className="flex flex-1 pt-16 h-screen overflow-hidden">
                {/* Desktop Sidebar */}
                <aside className="hidden md:flex w-72 flex-col bg-white/30 backdrop-blur-md border-r border-white/40 h-full p-6 gap-3 z-40 transition-all">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">Menü</p>
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="overview" 
                        label="Áttekintés" 
                        icon={<OverviewIcon />} 
                        onClick={setActiveTab} 
                    />
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="calendar" 
                        label="Naptár" 
                        icon={<CalendarIcon />} 
                        onClick={setActiveTab} 
                    />
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="services" 
                        label="Szolgáltatások" 
                        icon={<ServicesIcon />} 
                        onClick={setActiveTab} 
                    />
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 scroll-smooth">
                    <div className="max-w-6xl mx-auto animate-fade-in">
                        {renderContent()}
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/50 p-2 pb-safe z-50 flex justify-around items-center shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="overview" 
                        label="Áttekintés" 
                        icon={<OverviewIcon />} 
                        onClick={setActiveTab} 
                        isMobile={true}
                    />
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="calendar" 
                        label="Naptár" 
                        icon={<CalendarIcon />} 
                        onClick={setActiveTab} 
                        isMobile={true}
                    />
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="services" 
                        label="Szolgáltatások" 
                        icon={<ServicesIcon />} 
                        onClick={setActiveTab} 
                        isMobile={true}
                    />
                </nav>
            </div>
        </div>
    );
}