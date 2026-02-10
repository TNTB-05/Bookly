import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Logo from '../../modules/Logo';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth';
import { authApi } from '../auth/auth';
import OverviewIcon from '../../icons/OverviewIcon';
import CalendarIcon from '../../icons/CalendarIcon';
import ServicesIcon from '../../icons/ServicesIcon';
import SalonIcon from '../../icons/SalonIcon';
import SalonManagement from './SalonManagement';
import { getUserFromToken } from '../auth/auth';
import TimeSpinner from '../../components/TimeSpinner';

// Section Components
const OverviewSection = () => {
    const [statistics, setStatistics] = useState({
        todayAppointments: 0,
        weeklyRevenue: 0,
        newCustomers: 0,
        upcomingAppointments: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStatistics();
    }, []);

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            const response = await authApi.get('/api/provider/calendar/statistics');
            const data = await response.json();
            if (data.success) {
                setStatistics(data.statistics);
            }
        } catch (error) {
            console.error('Error fetching statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('hu-HU').format(price);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('hu-HU', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'bg-green-100 text-green-700';
            case 'completed': return 'bg-blue-100 text-blue-700';
            case 'canceled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'scheduled': return 'Megerősítve';
            case 'completed': return 'Teljesítve';
            case 'canceled': return 'Törölve';
            default: return status;
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return parts[0][0] + parts[1][0];
        }
        return name.substring(0, 2).toUpperCase();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-blue"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-dark-blue">Áttekintés</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-600 font-medium">Mai Foglalások</h3>
                            <p className="text-4xl font-bold text-dark-blue mt-2">{statistics.todayAppointments}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <CalendarIcon className="text-dark-blue" />
                        </div>
                    </div>
                </div>
                <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-600 font-medium">Heti Bevétel</h3>
                            <p className="text-4xl font-bold text-dark-blue mt-2">{formatPrice(statistics.weeklyRevenue)} Ft</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-600 font-medium">Új Ügyfelek</h3>
                            <p className="text-4xl font-bold text-dark-blue mt-2">{statistics.newCustomers}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50">
                <h3 className="text-xl font-bold text-dark-blue mb-4">Következő Időpontok</h3>
                {statistics.upcomingAppointments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Nincsenek közelgő időpontok</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {statistics.upcomingAppointments.map((appointment) => (
                            <div key={appointment.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dark-blue to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                        {getInitials(appointment.user_name)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{appointment.user_name}</p>
                                        <p className="text-sm text-gray-600">
                                            {appointment.service_name} • {formatDate(appointment.appointment_start)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold text-dark-blue">
                                        {formatPrice(appointment.price)} Ft
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                        {getStatusText(appointment.status)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const CalendarSection = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    
    // Create appointment modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [services, setServices] = useState([]);
    const [saving, setSaving] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        is_guest: false,
        user_email: '',
        user_name: '',
        user_phone: '',
        service_id: '',
        appointment_date: '',
        appointment_time: '',
        comment: ''
    });
    
    // Working hours state (fetched from database)
    const [workingHours, setWorkingHours] = useState({ openingHour: 8, closingHour: 20 });

    // Derived timeline constants
    const START_HOUR = workingHours.openingHour;
    const END_HOUR = workingHours.closingHour;
    const MINUTES_PER_PIXEL = 1; // 1 minute = 1 pixel for better precision
    const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
    
    // Hours for the day view (only show hours where appointments can start)
    const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

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
        fetchServices();
    }, [fetchWorkingHours]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    // Fetch services for dropdown
    const fetchServices = async () => {
        try {
            const response = await authApi.get('/api/provider/calendar/services');
            const data = await response.json();
            if (data.success) {
                setServices(data.services.filter(s => s.status === 'available'));
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    // Handle opening create modal
    const handleOpenCreateModal = () => {
        // Create a Date object for the default time (opening hour)
        const defaultTime = new Date();
        defaultTime.setHours(workingHours.openingHour, 0, 0, 0);
        
        setCreateFormData({
            is_guest: false,
            user_email: '',
            user_name: '',
            user_phone: '',
            service_id: '',
            appointment_date: selectedDate.toISOString().split('T')[0],
            appointment_time: `${workingHours.openingHour.toString().padStart(2, '0')}:00`,
            comment: ''
        });
        setShowCreateModal(true);
    };

    // Handle create appointment
    const handleCreateAppointment = async () => {
        // Validation
        if (!createFormData.user_name || !createFormData.service_id) {
            alert('Név és szolgáltatás megadása kötelező!');
            return;
        }

        if (!createFormData.is_guest && !createFormData.user_email) {
            alert('Regisztrált felhasználóhoz email cím szükséges!');
            return;
        }

        if (createFormData.is_guest && !createFormData.user_email && !createFormData.user_phone) {
            alert('Vendég foglaláshoz legalább email vagy telefonszám szükséges!');
            return;
        }

        // Validate appointment time is within salon hours
        const [hours, minutes] = createFormData.appointment_time.split(':').map(Number);
        if (hours < workingHours.openingHour || hours >= workingHours.closingHour) {
            alert('Az időpont a szalon nyitvatartási idején kívül esik!');
            return;
        }

        try {
            setSaving(true);
            const response = await authApi.post('/api/provider/calendar/appointments', createFormData);
            const data = await response.json();
            
            if (data.success) {
                setShowCreateModal(false);
                fetchAppointments();
            } else {
                alert(data.message || 'Hiba történt a foglalás létrehozásakor');
            }
        } catch (error) {
            console.error('Create appointment error:', error);
            alert('Hiba történt a foglalás létrehozásakor');
        } finally {
            setSaving(false);
        }
    };

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
            <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-bold text-dark-blue">Naptár</h2>
                <button 
                    onClick={handleOpenCreateModal}
                    className="px-4 py-2 bg-dark-blue text-white rounded-xl font-medium hover:bg-blue-800 transition-colors shadow-md text-sm"
                >
                    + Új Időpont
                </button>
            </div>
            
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
                                <div className="flex" style={{ height: `${TOTAL_MINUTES * MINUTES_PER_PIXEL}px` }}>
                                    {/* Hour labels column */}
                                    <div className="w-12 sm:w-16 shrink-0 border-r border-gray-100 relative">
                                        {hours.map((hour, index) => (
                                            <div 
                                                key={hour} 
                                                className="absolute left-0 right-0 pr-1 sm:pr-2 text-right -translate-y-1/2"
                                                style={{ top: `${index * 60 * MINUTES_PER_PIXEL}px` }}
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
                                    >
                                        {/* Hour grid lines */}
                                        {hours.map((hour) => (
                                            <div 
                                                key={hour}
                                                className="absolute left-0 right-0 border-b-2 border-gray-300"
                                                style={{ top: `${(hour - START_HOUR) * 60 * MINUTES_PER_PIXEL}px` }}
                                            />
                                        ))}
                                        
                                        {/* Half-hour grid lines */}
                                        {hours.map((hour) => (
                                            <div 
                                                key={`half-${hour}`}
                                                className="absolute left-0 right-0 border-b border-gray-200 border-dashed"
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
                                                            px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg border transition-all overflow-hidden
                                                            hover:shadow-md hover:z-10 active:scale-[0.98]
                                                            ${getStatusColor(apt.status)}
                                                        `}
                                                        style={style}
                                                    >
                                                        <div className="flex flex-col h-full justify-between">
                                                            <div className="flex items-center justify-between gap-1">
                                                                <p className="font-semibold text-[10px] sm:text-xs truncate">
                                                                    {apt.user_name}
                                                                </p>
                                                                <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap shrink-0">
                                                                    {apt.price.toLocaleString()} Ft
                                                                </span>
                                                            </div>
                                                            {apt.service_name && (
                                                                <p className="text-[9px] sm:text-[10px] text-gray-600 truncate">
                                                                    {apt.service_name}
                                                                </p>
                                                            )}
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
            {showModal && selectedAppointment && createPortal(
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
                                    {selectedAppointment.service_name && (
                                        <p className="text-sm sm:text-base font-medium mt-0.5 opacity-90">
                                            {selectedAppointment.service_name}
                                        </p>
                                    )}
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
                </div>,
                document.body
            )}

            {/* Create Appointment Modal */}
            {showCreateModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowCreateModal(false)}
                    ></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md my-8 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-dark-blue">Új Időpont Létrehozása</h3>
                                <button 
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Booking Type Toggle */}
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Foglalás típusa</label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setCreateFormData({ ...createFormData, is_guest: false, user_email: '', user_phone: '' })}
                                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                                            !createFormData.is_guest 
                                                ? 'bg-dark-blue text-white shadow-md' 
                                                : 'bg-white text-gray-700 border border-gray-300 hover:border-dark-blue'
                                        }`}
                                    >
                                        Regisztrált felhasználó
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCreateFormData({ ...createFormData, is_guest: true })}
                                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                                            createFormData.is_guest 
                                                ? 'bg-dark-blue text-white shadow-md' 
                                                : 'bg-white text-gray-700 border border-gray-300 hover:border-dark-blue'
                                        }`}
                                    >
                                        Vendég
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Név *
                                </label>
                                <input
                                    type="text"
                                    value={createFormData.user_name}
                                    onChange={(e) => setCreateFormData({ ...createFormData, user_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                                    placeholder="Kovács János"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email {!createFormData.is_guest ? '*' : ''}
                                </label>
                                <input
                                    type="email"
                                    value={createFormData.user_email}
                                    onChange={(e) => setCreateFormData({ ...createFormData, user_email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                                    placeholder="pelda@email.hu"
                                />
                                {!createFormData.is_guest && (
                                    <p className="text-xs text-gray-500 mt-1">Meglévő felhasználó email címe vagy új létrehozásához</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Telefonszám {createFormData.is_guest && !createFormData.user_email ? '*' : ''}
                                </label>
                                <input
                                    type="tel"
                                    value={createFormData.user_phone}
                                    onChange={(e) => setCreateFormData({ ...createFormData, user_phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                                    placeholder="+36 20 123 4567"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Szolgáltatás *</label>
                                <select
                                    value={createFormData.service_id}
                                    onChange={(e) => setCreateFormData({ ...createFormData, service_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                                >
                                    <option value="">Válassz szolgáltatást...</option>
                                    {services.map(service => (
                                        <option key={service.id} value={service.id}>
                                            {service.name} - {service.duration_minutes} perc - {service.price.toLocaleString()} Ft
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dátum *</label>
                                    <input
                                        type="date"
                                        value={createFormData.appointment_date}
                                        onChange={(e) => setCreateFormData({ ...createFormData, appointment_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Időpont *</label>
                                    <TimeSpinner
                                        value={createFormData.appointment_time}
                                        onChange={(timeString) => setCreateFormData({ ...createFormData, appointment_time: timeString })}
                                        minHour={workingHours.openingHour}
                                        maxHour={workingHours.closingHour}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Megjegyzés</label>
                                <textarea
                                    value={createFormData.comment}
                                    onChange={(e) => setCreateFormData({ ...createFormData, comment: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent resize-none"
                                    rows={3}
                                    placeholder="Speciális kérések, megjegyzések..."
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                Mégse
                            </button>
                            <button
                                onClick={handleCreateAppointment}
                                disabled={saving}
                                className="flex-1 py-2.5 px-4 bg-dark-blue text-white font-medium rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                ) : (
                                    'Létrehozás'
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

const ServicesSection = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        duration_minutes: 30,
        price: 0,
        status: 'available'
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await authApi.get('/api/provider/calendar/services');
            const data = await response.json();
            if (data.success) {
                setServices(data.services);
            } else {
                setError('Nem sikerült betölteni a szolgáltatásokat');
            }
        } catch (error) {
            console.error('Fetch services error:', error);
            setError('Hiba történt a szolgáltatások betöltésekor');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('hu-HU').format(price);
    };

    const handleOpenModal = (service = null) => {
        if (service) {
            setEditingService(service);
            setFormData({
                name: service.name,
                description: service.description || '',
                duration_minutes: service.duration_minutes,
                price: service.price,
                status: service.status
            });
        } else {
            setEditingService(null);
            setFormData({
                name: '',
                description: '',
                duration_minutes: 30,
                price: 0,
                status: 'available'
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingService(null);
        setFormData({
            name: '',
            description: '',
            duration_minutes: 30,
            price: 0,
            status: 'available'
        });
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            alert('A szolgáltatás neve kötelező!');
            return;
        }
        if (formData.duration_minutes < 5) {
            alert('A minimum időtartam 5 perc!');
            return;
        }
        if (formData.price < 0) {
            alert('Az ár nem lehet negatív!');
            return;
        }

        try {
            setSaving(true);
            let response;
            
            if (editingService) {
                response = await authApi.put(`/api/provider/calendar/services/${editingService.id}`, formData);
            } else {
                response = await authApi.post('/api/provider/calendar/services', formData);
            }

            const data = await response.json();
            if (data.success) {
                handleCloseModal();
                fetchServices();
            } else {
                alert(data.message || 'Hiba történt a mentés során');
            }
        } catch (error) {
            console.error('Save service error:', error);
            alert('Hiba történt a mentés során');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (serviceId) => {
        try {
            setDeleting(true);
            const response = await authApi.delete(`/api/provider/calendar/services/${serviceId}`);
            const data = await response.json();
            
            if (data.success) {
                setDeleteConfirm(null);
                fetchServices();
            } else {
                alert(data.message || 'Hiba történt a törlés során');
            }
        } catch (error) {
            console.error('Delete service error:', error);
            alert('Hiba történt a törlés során');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-dark-blue">Szolgáltatások Kezelése</h2>
                <button 
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-dark-blue text-white rounded-xl font-medium hover:bg-blue-800 transition-colors shadow-md"
                >
                    + Új Szolgáltatás
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-blue"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                    {error}
                </div>
            ) : services.length === 0 ? (
                <div className="bg-white/40 backdrop-blur-md p-12 rounded-2xl shadow-lg border border-white/50 text-center">
                    <ServicesIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 text-lg">Még nincsenek szolgáltatások</p>
                    <p className="text-gray-500 text-sm mt-2">Kattints a "+ Új Szolgáltatás" gombra a kezdéshez</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                        <div key={service.id} className="group bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50 hover:border-white/80 transition-all hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-light-blue rounded-lg flex items-center justify-center text-dark-blue">
                                    <ServicesIcon />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleOpenModal(service)}
                                        className="p-1 hover:bg-white/50 rounded text-blue-600"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                        </svg>
                                    </button>
                                    <button 
                                        onClick={() => setDeleteConfirm(service)}
                                        className="p-1 hover:bg-white/50 rounded text-red-500"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900">{service.name}</h3>
                            {service.description && (
                                <p className="text-gray-600 text-sm mt-1 line-clamp-2">{service.description}</p>
                            )}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                                <span className="text-gray-500 text-sm">{service.duration_minutes} perc</span>
                                <span className="font-bold text-dark-blue">{formatPrice(service.price)} Ft</span>
                            </div>
                            {service.status !== 'available' && (
                                <div className="mt-2">
                                    <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                        Nem elérhető
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Service Modal */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={handleCloseModal}
                    ></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-dark-blue">
                                    {editingService ? 'Szolgáltatás Szerkesztése' : 'Új Szolgáltatás'}
                                </h3>
                                <button 
                                    onClick={handleCloseModal}
                                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Név *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                                    placeholder="pl. Férfi Hajvágás"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Leírás</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent resize-none"
                                    rows={3}
                                    placeholder="Rövid leírás a szolgáltatásról..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Időtartam (perc) *</label>
                                    <input
                                        type="number"
                                        value={formData.duration_minutes}
                                        onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                                        min="5"
                                        max="480"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ár (Ft) *</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Státusz</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                                >
                                    <option value="available">Elérhető</option>
                                    <option value="unavailable">Nem elérhető</option>
                                </select>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button
                                onClick={handleCloseModal}
                                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                Mégse
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-2.5 px-4 bg-dark-blue text-white font-medium rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                ) : (
                                    editingService ? 'Mentés' : 'Létrehozás'
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setDeleteConfirm(null)}
                    ></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm my-8">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Szolgáltatás Törlése</h3>
                            <p className="text-gray-600 text-center text-sm">
                                Biztosan törölni szeretnéd a <strong>"{deleteConfirm.name}"</strong> szolgáltatást? Ez a művelet nem vonható vissza.
                            </p>
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                Mégse
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm.id)}
                                disabled={deleting}
                                className="flex-1 py-2.5 px-4 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                ) : (
                                    'Törlés'
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

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

const UserDropdown = ({ isOpen, onLogout, onProfileEdit, providerProfile }) => {
    if (!isOpen) return null;
    
    return (
        <div className="absolute top-14 right-4 w-52 bg-white/60 backdrop-blur-md border border-white/50 rounded-2xl shadow-xl overflow-hidden animate-fade-in z-50">
            <div className="p-4 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-900">{providerProfile?.name || 'Szolgáltató'}</p>
                <p className="text-xs text-gray-500 truncate">{providerProfile?.email || ''}</p>
            </div>
            <div className="p-2 space-y-1">
                <button onClick={onProfileEdit} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white/50 rounded-lg transition-colors flex items-center gap-2">
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
    const user = getUserFromToken();
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    // Provider profile state
    const [providerProfile, setProviderProfile] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileFormData, setProfileFormData] = useState({ name: '', phone: '', description: '' });
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState(null);
    const [profileSuccess, setProfileSuccess] = useState(null);
    const [pictureUploading, setPictureUploading] = useState(false);
    const [pictureError, setPictureError] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordFormData, setPasswordFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordError, setPasswordError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(null);

    // Fetch provider profile on mount
    useEffect(() => {
        fetchProviderProfile();
    }, []);

    const fetchProviderProfile = async () => {
        try {
            const response = await authApi.get('/api/salon/me');
            const data = await response.json();
            if (data.success) setProviderProfile(data.provider);
        } catch (error) {
            console.error('Error fetching provider profile:', error);
        }
    };

    const getProviderInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const openProfileModal = () => {
        if (providerProfile) {
            setProfileFormData({
                name: providerProfile.name || '',
                phone: providerProfile.phone || '',
                description: providerProfile.description || ''
            });
        }
        setProfileError(null);
        setProfileSuccess(null);
        setPictureError(null);
        setShowProfileModal(true);
        setIsDropdownOpen(false);
    };

    const handleProviderProfileSave = async () => {
        if (!profileFormData.name.trim()) { setProfileError('A név megadása kötelező'); return; }
        if (!profileFormData.phone.trim()) { setProfileError('A telefonszám megadása kötelező'); return; }
        const phoneRegex = /^[\d\s+()-]+$/;
        if (!phoneRegex.test(profileFormData.phone.trim())) { setProfileError('Érvénytelen telefonszám formátum'); return; }

        setProfileSaving(true);
        setProfileError(null);
        try {
            const response = await authApi.put('/api/salon/me', {
                name: profileFormData.name.trim(),
                phone: profileFormData.phone.trim(),
                description: profileFormData.description.trim() || null
            });
            const data = await response.json();
            if (data.success) {
                setProviderProfile(data.provider);
                setProfileSuccess('Profil sikeresen frissítve!');
                setTimeout(() => setProfileSuccess(null), 3000);
            } else {
                setProfileError(data.message || 'Hiba történt a mentés során');
            }
        } catch (error) {
            setProfileError('Hiba történt a mentés során');
        } finally {
            setProfileSaving(false);
        }
    };

    const handleProviderPictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) { setPictureError('Csak JPG, PNG és WebP fájlok engedélyezettek'); return; }
        if (file.size > 5 * 1024 * 1024) { setPictureError('A fájl mérete nem haladhatja meg az 5MB-ot'); return; }

        setPictureUploading(true);
        setPictureError(null);
        try {
            const formData = new FormData();
            formData.append('profilePicture', file);
            const response = await authApi.upload('/api/salon/me/picture', formData);
            const data = await response.json();
            if (data.success) {
                setProviderProfile(prev => ({ ...prev, profile_picture_url: data.profile_picture_url }));
                setProfileSuccess('Profilkép sikeresen frissítve!');
                setTimeout(() => setProfileSuccess(null), 3000);
            } else {
                setPictureError(data.message || 'Hiba történt a kép feltöltésekor');
            }
        } catch (error) {
            setPictureError('Hiba történt a kép feltöltésekor');
        } finally {
            setPictureUploading(false);
            e.target.value = '';
        }
    };

    const openPasswordModal = () => {
        setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordError(null);
        setPasswordSuccess(null);
        setShowPasswordModal(true);
    };

    const handleProviderPasswordChange = async () => {
        if (!passwordFormData.currentPassword || !passwordFormData.newPassword || !passwordFormData.confirmPassword) { setPasswordError('Minden mező kitöltése kötelező'); return; }
        if (passwordFormData.newPassword.length < 6) { setPasswordError('Az új jelszónak legalább 6 karakter hosszúnak kell lennie'); return; }
        if (passwordFormData.newPassword !== passwordFormData.confirmPassword) { setPasswordError('Az új jelszavak nem egyeznek'); return; }

        setPasswordSaving(true);
        setPasswordError(null);
        try {
            const response = await authApi.put('/api/salon/me/password', passwordFormData);
            const data = await response.json();
            if (data.success) {
                setPasswordSuccess('Jelszó sikeresen megváltoztatva!');
                setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setTimeout(() => { setShowPasswordModal(false); setPasswordSuccess(null); }, 2000);
            } else {
                setPasswordError(data.message || 'Hiba történt a jelszó módosítása során');
            }
        } catch (error) {
            setPasswordError('Hiba történt a jelszó módosítása során');
        } finally {
            setPasswordSaving(false);
        }
    };

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
            case 'salon': return <SalonManagement />;
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
                            Üdv, {providerProfile?.name || user?.name || 'Szolgáltató'}
                        </span>
                        {providerProfile?.profile_picture_url ? (
                            <img src={`${apiUrl}${providerProfile.profile_picture_url}`} alt="Profil" className="w-10 h-10 rounded-full object-cover shadow-lg hover:shadow-xl hover:scale-105 transition-all border-2 border-white/50 cursor-pointer" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-dark-blue to-blue-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm font-bold border-2 border-white/50 cursor-pointer">
                                {getProviderInitials(providerProfile?.name || user?.name)}
                            </div>
                        )}
                    </button>

                    <UserDropdown 
                        isOpen={isDropdownOpen} 
                        onLogout={handleLogout}
                        onProfileEdit={openProfileModal}
                        providerProfile={providerProfile}
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
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="salon" 
                        label="Szalon kezelés" 
                        icon={<SalonIcon />} 
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
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="salon" 
                        label="Szalon" 
                        icon={<SalonIcon />} 
                        onClick={setActiveTab} 
                        isMobile={true}
                    />
                </nav>
            </div>

            {/* Profile Edit Modal */}
            {showProfileModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowProfileModal(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-dark-blue">Profil szerkesztése</h3>
                                <button onClick={() => setShowProfileModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            {profileSuccess && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {profileSuccess}
                                </div>
                            )}
                            {/* Avatar section */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative">
                                    {providerProfile?.profile_picture_url ? (
                                        <img src={`${apiUrl}${providerProfile.profile_picture_url}`} alt="Profil" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-dark-blue to-blue-500 text-white flex items-center justify-center text-2xl font-bold border-4 border-white shadow-lg">
                                            {getProviderInitials(providerProfile?.name)}
                                        </div>
                                    )}
                                    {pictureUploading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                                        </div>
                                    )}
                                </div>
                                <label className={`cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors ${pictureUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                    {pictureUploading ? 'Feltöltés...' : 'Kép módosítása'}
                                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleProviderPictureUpload} disabled={pictureUploading} />
                                </label>
                                {pictureError && <p className="text-red-500 text-xs">{pictureError}</p>}
                                <p className="text-xs text-gray-400">Max 5MB • JPG, PNG, WebP</p>
                            </div>
                            {profileError && (<div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{profileError}</div>)}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Név *</label>
                                <input type="text" value={profileFormData.name} onChange={(e) => setProfileFormData({...profileFormData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent" placeholder="Teljes név" disabled={profileSaving} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" value={providerProfile?.email || ''} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" disabled />
                                <p className="text-xs text-gray-400 mt-1">Az email cím nem módosítható</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telefonszám *</label>
                                <input type="tel" value={profileFormData.phone} onChange={(e) => setProfileFormData({...profileFormData, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent" placeholder="+36 20 123 4567" disabled={profileSaving} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bemutatkozás</label>
                                <textarea value={profileFormData.description} onChange={(e) => setProfileFormData({...profileFormData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent resize-none" rows={3} placeholder="Rövid bemutatkozás..." disabled={profileSaving} />
                            </div>
                            <div className="pt-2 border-t border-gray-200">
                                <button onClick={openPasswordModal} className="w-full text-left px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                                        Jelszó módosítása
                                    </span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button onClick={() => setShowProfileModal(false)} className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors" disabled={profileSaving}>Mégse</button>
                            <button onClick={handleProviderProfileSave} disabled={profileSaving} className="flex-1 py-2.5 px-4 bg-dark-blue text-white font-medium rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {profileSaving ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : 'Mentés'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Password Change Modal */}
            {showPasswordModal && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-dark-blue">Jelszó módosítása</h3>
                                <button onClick={() => setShowPasswordModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            {passwordError && (<div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{passwordError}</div>)}
                            {passwordSuccess && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {passwordSuccess}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jelenlegi jelszó *</label>
                                <input type="password" value={passwordFormData.currentPassword} onChange={(e) => setPasswordFormData({...passwordFormData, currentPassword: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent" placeholder="••••••••" disabled={passwordSaving} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Új jelszó *</label>
                                <input type="password" value={passwordFormData.newPassword} onChange={(e) => setPasswordFormData({...passwordFormData, newPassword: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent" placeholder="••••••••" disabled={passwordSaving} />
                                <p className="text-xs text-gray-500 mt-1">Legalább 6 karakter hosszú legyen</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Új jelszó megerősítése *</label>
                                <input type="password" value={passwordFormData.confirmPassword} onChange={(e) => setPasswordFormData({...passwordFormData, confirmPassword: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent" placeholder="••••••••" disabled={passwordSaving} />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors" disabled={passwordSaving}>Mégse</button>
                            <button onClick={handleProviderPasswordChange} disabled={passwordSaving || !!passwordSuccess} className="flex-1 py-2.5 px-4 bg-dark-blue text-white font-medium rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {passwordSaving ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : 'Jelszó módosítása'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}