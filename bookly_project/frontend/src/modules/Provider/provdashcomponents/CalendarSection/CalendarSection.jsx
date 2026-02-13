import { useState, useEffect, useCallback } from 'react';
import { authApi } from '../../../auth/auth';
import TimeBlockModal from '../../TimeBlockModal';
import { timeBlocksService } from '../../../../services/timeBlocksService';
import AppointmentDetailModal from './AppointmentDetailModal';
import CreateAppointmentModal from './CreateAppointmentModal';

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

    // Time blocks state
    const [timeBlocks, setTimeBlocks] = useState([]);
    const [showTimeBlockModal, setShowTimeBlockModal] = useState(false);
    const [selectedTimeBlock, setSelectedTimeBlock] = useState(null);
    const [toast, setToast] = useState(null);

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

    // Fetch time blocks for the current month
    const fetchTimeBlocks = useCallback(async () => {
        try {
            const { startDate, endDate } = getMonthRange(currentDate);
            const data = await timeBlocksService.getTimeBlocks(startDate, endDate);
            if (data.success) {
                setTimeBlocks(data.timeBlocks);
            }
        } catch (error) {
            console.error('Error fetching time blocks:', error);
        }
    }, [currentDate]);

    // Toast notification helper
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Fetch working hours on mount
    useEffect(() => {
        fetchWorkingHours();
        fetchServices();
    }, [fetchWorkingHours]);

    useEffect(() => {
        fetchAppointments();
        fetchTimeBlocks();
    }, [fetchAppointments, fetchTimeBlocks]);

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
        const [hours] = createFormData.appointment_time.split(':').map(Number);
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

    // Get time blocks for selected date
    const getTimeBlocksForDate = (date) => {
        return timeBlocks.filter(block => {
            const blockDate = new Date(block.start_datetime);
            return blockDate.toDateString() === date.toDateString();
        });
    };

    // Calculate time block position and height for timeline
    const getTimeBlockStyle = (block) => {
        const start = new Date(block.start_datetime);
        const end = new Date(block.end_datetime);
        
        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const endMinutes = end.getHours() * 60 + end.getMinutes();
        
        const topOffset = startMinutes - (START_HOUR * 60);
        const duration = endMinutes - startMinutes;
        
        return {
            top: `${topOffset * MINUTES_PER_PIXEL}px`,
            height: `${Math.max(duration * MINUTES_PER_PIXEL, 20)}px`,
        };
    };

    // Handle time block click
    const handleTimeBlockClick = (block) => {
        setSelectedTimeBlock(block);
        setShowTimeBlockModal(true);
    };

    // Handle time block saved
    const handleTimeBlockSaved = () => {
        fetchTimeBlocks();
        showToast('Szünet sikeresen mentve');
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
            height: `${Math.max(duration * MINUTES_PER_PIXEL, 30)}px`,
        };
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
        const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        const daysInMonth = lastDay.getDate();
        
        const days = [];
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }
        return days;
    };

    // Total slots based on working hours
    const TOTAL_SLOTS = END_HOUR - START_HOUR;

    // Get booking status for a date
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

    const daysOfWeek = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
    const monthNames = ['Január', 'Február', 'Március', 'Április', 'Május', 'Június', 
                        'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'];

    const calendarDays = generateCalendarDays();
    const todayAppointments = getAppointmentsForDate(selectedDate);
    const todayTimeBlocks = getTimeBlocksForDate(selectedDate);

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-bold text-dark-blue">Naptár</h2>
                <div className="flex gap-2">
                    <button 
                        onClick={() => { setSelectedTimeBlock(null); setShowTimeBlockModal(true); }}
                        className="px-4 py-2 bg-gray-500 text-white rounded-xl font-medium hover:bg-gray-600 transition-colors shadow-md text-sm"
                    >
                        + Szünet
                    </button>
                    <button 
                        onClick={handleOpenCreateModal}
                        className="px-4 py-2 bg-dark-blue text-white rounded-xl font-medium hover:bg-blue-800 transition-colors shadow-md text-sm"
                    >
                        + Új Időpont
                    </button>
                </div>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                <div className="w-full lg:w-auto lg:min-w-[320px]">
                    <div className="bg-white/40 backdrop-blur-md p-3 sm:p-6 rounded-2xl shadow-lg border border-white/50">
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
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {daysOfWeek.map((day, index) => (
                                <div key={index} className="text-center text-[10px] sm:text-xs font-semibold text-gray-500 py-1 sm:py-2">
                                    {day}
                                </div>
                            ))}
                        </div>
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

                <div className="flex-1">
                    <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 overflow-hidden">
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
                                {todayTimeBlocks.length > 0 && ` · ${todayTimeBlocks.length} szünet`}
                            </p>
                        </div>
                        <div className="max-h-100 sm:max-h-125 lg:max-h-150 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dark-blue"></div>
                                </div>
                            ) : (
                                <div className="flex" style={{ height: `${TOTAL_MINUTES * MINUTES_PER_PIXEL}px` }}>
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
                                    <div className="flex-1 relative">
                                        {hours.map((hour) => (
                                            <div 
                                                key={hour}
                                                className="absolute left-0 right-0 border-b-2 border-gray-300"
                                                style={{ top: `${(hour - START_HOUR) * 60 * MINUTES_PER_PIXEL}px` }}
                                            />
                                        ))}
                                        {hours.map((hour) => (
                                            <div 
                                                key={`half-${hour}`}
                                                className="absolute left-0 right-0 border-b border-gray-200 border-dashed"
                                                style={{ top: `${((hour - START_HOUR) * 60 + 30) * MINUTES_PER_PIXEL}px` }}
                                            />
                                        ))}
                                        {todayAppointments.length === 0 && todayTimeBlocks.length === 0 ? (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <p className="text-gray-400 text-sm">Nincs foglalás erre a napra</p>
                                            </div>
                                        ) : (
                                            <>
                                            {todayTimeBlocks.map((block, index) => {
                                                const style = getTimeBlockStyle(block);
                                                return (
                                                    <button
                                                        key={`block-${block.id}-${index}`}
                                                        onClick={() => handleTimeBlockClick(block)}
                                                        className="absolute left-0 right-0 rounded-lg transition-all overflow-hidden hover:opacity-80 active:scale-[0.99] cursor-pointer z-[1]"
                                                        style={style}
                                                    >
                                                        <div className="w-full h-full bg-gray-300/60 border border-gray-400/40 border-dashed rounded-lg flex items-center justify-center px-2">
                                                            <p className="text-[10px] sm:text-xs text-gray-600 font-medium truncate">
                                                                {block.notes || 'Szünet'}
                                                            </p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                            {todayAppointments.map((apt) => {
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
                                            })}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {toast && (
                <div className={`fixed bottom-6 right-6 z-[9999] px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all animate-fade-in ${
                    toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                    {toast.message}
                </div>
            )}

            <TimeBlockModal
                isOpen={showTimeBlockModal}
                onClose={() => { setShowTimeBlockModal(false); setSelectedTimeBlock(null); }}
                onSaved={handleTimeBlockSaved}
                block={selectedTimeBlock}
                workingHours={workingHours}
                selectedDate={selectedDate}
            />

            <AppointmentDetailModal 
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                appointment={selectedAppointment}
                deleteLoading={deleteLoading}
                onDelete={handleDeleteAppointment}
            />

            <CreateAppointmentModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                formData={createFormData}
                setFormData={setCreateFormData}
                services={services}
                workingHours={workingHours}
                saving={saving}
                onCreate={handleCreateAppointment}
            />
        </div>
    );
};

export default CalendarSection;
