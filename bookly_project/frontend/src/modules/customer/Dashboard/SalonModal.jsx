import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker, { registerLocale } from 'react-datepicker';
import { hu } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import CloseIcon from '../../../icons/CloseIcon';
import LeftArrowIcon from '../../../icons/LeftArrowIcon';
import { authApi } from '../../auth/auth';

// Register Hungarian locale for date picker
registerLocale('hu', hu);

// Booking steps
const STEPS = {
    SALON_INFO: 'salon_info',
    SELECT_PROVIDER: 'select_provider',
    SELECT_SERVICE: 'select_service',
    SELECT_DATETIME: 'select_datetime',
    CONFIRM: 'confirm',
    SUCCESS: 'success'
};

// Szalon részletek modal - szalon információk és foglalási folyamat
export default function SalonModal() {
    const { salonId } = useParams();
    const navigate = useNavigate();
    const [salon, setSalon] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Booking wizard state
    const [currentStep, setCurrentStep] = useState(STEPS.SALON_INFO);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [comment, setComment] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [booking, setBooking] = useState(false);
    const [bookingResult, setBookingResult] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);

    // Szalon adatok betöltése
    useEffect(() => {
        loadSalonDetails();
        loadUserProfile();
    }, [salonId]);

    // Load user profile
    async function loadUserProfile() {
        try {
            setLoadingUser(true);
            const response = await authApi.get('/api/user/profile');
            const data = await response.json();
            if (data.success) {
                setUserProfile(data.user);
            }
        } catch (error) {
            console.error('Hiba a profil betöltésekor:', error);
        } finally {
            setLoadingUser(false);
        }
    }

    // Check if user profile is complete (active)
    function isUserActive() {
        if (!userProfile) return false;
        return userProfile.name && userProfile.email && userProfile.phone;
    }

    // ESC billentyű kezelése
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                handleBack();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [currentStep]);

    // Load available time slots when date changes
    useEffect(() => {
        if (selectedProvider && selectedService && selectedDate && currentStep === STEPS.SELECT_DATETIME) {
            loadAvailableSlots();
        }
    }, [selectedDate]);

    // Szalon részletek lekérése
    async function loadSalonDetails() {
        try {
            setLoading(true);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/search/salon/${salonId}`);
            const data = await response.json();

            if (data.success) {
                setSalon(data.salon);
            } else {
                setError('Nem sikerült betölteni a szalon adatait');
            }
        } catch (err) {
            console.error('Hiba a szalon adatok betöltésekor:', err);
            setError('Hiba történt az adatok betöltése során');
        } finally {
            setLoading(false);
        }
    }

    // Format date in local timezone (avoids UTC shift)
    function formatDateLocal(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Load available time slots
    async function loadAvailableSlots() {
        if (!selectedProvider || !selectedService || !selectedDate) return;

        try {
            setLoadingSlots(true);
            setAvailableSlots([]);
            setSelectedTime(null);

            const dateStr = formatDateLocal(selectedDate);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(
                `${apiUrl}/api/user/provider/${selectedProvider.id}/availability?date=${dateStr}&serviceDuration=${selectedService.duration_minutes}`
            );
            const data = await response.json();

            if (data.success) {
                setAvailableSlots(data.slots);
            } else {
                setAvailableSlots([]);
            }
        } catch (err) {
            console.error('Error loading available slots:', err);
            setAvailableSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    }

    // Handle back navigation
    function handleBack() {
        switch (currentStep) {
            case STEPS.SALON_INFO:
                navigate(-1);
                break;
            case STEPS.SELECT_PROVIDER:
                setCurrentStep(STEPS.SALON_INFO);
                setSelectedProvider(null);
                break;
            case STEPS.SELECT_SERVICE:
                setCurrentStep(STEPS.SELECT_PROVIDER);
                setSelectedService(null);
                break;
            case STEPS.SELECT_DATETIME:
                setCurrentStep(STEPS.SELECT_SERVICE);
                setSelectedDate(null);
                setSelectedTime(null);
                setAvailableSlots([]);
                break;
            case STEPS.CONFIRM:
                setCurrentStep(STEPS.SELECT_DATETIME);
                break;
            case STEPS.SUCCESS:
                resetBooking();
                break;
            default:
                navigate(-1);
        }
    }

    // Reset booking state
    function resetBooking() {
        setCurrentStep(STEPS.SALON_INFO);
        setSelectedProvider(null);
        setSelectedService(null);
        setSelectedDate(null);
        setSelectedTime(null);
        setComment('');
        setAvailableSlots([]);
        setBookingResult(null);
    }

    // Start booking flow
    function startBooking() {
        setCurrentStep(STEPS.SELECT_PROVIDER);
    }

    // Select provider and move to next step
    function handleSelectProvider(provider) {
        setSelectedProvider(provider);
        setCurrentStep(STEPS.SELECT_SERVICE);
    }

    // Select service and move to next step
    function handleSelectService(service) {
        setSelectedService(service);
        setCurrentStep(STEPS.SELECT_DATETIME);
    }

    // Move to confirmation step
    function handleDateTimeConfirm() {
        if (selectedDate && selectedTime) {
            setCurrentStep(STEPS.CONFIRM);
        }
    }

    // Submit booking
    async function handleSubmitBooking() {
        if (!selectedProvider || !selectedService || !selectedDate || !selectedTime) {
            return;
        }

        try {
            setBooking(true);
            const dateStr = formatDateLocal(selectedDate);
            
            const response = await authApi.post('/api/user/appointments', {
                provider_id: selectedProvider.id,
                service_id: selectedService.id,
                appointment_date: dateStr,
                appointment_time: selectedTime,
                comment: comment || null
            });

            const data = await response.json();

            if (data.success) {
                setBookingResult(data.appointment);
                setCurrentStep(STEPS.SUCCESS);
            } else if (response.status === 409) {
                alert(data.message || 'Ez az időpont már foglalt. Kérjük, válasszon másik időpontot.');
                setCurrentStep(STEPS.SELECT_DATETIME);
                loadAvailableSlots();
            } else {
                alert(data.message || 'Hiba történt a foglalás létrehozásakor');
            }
        } catch (err) {
            console.error('Booking error:', err);
            alert('Hiba történt a foglalás létrehozásakor');
        } finally {
            setBooking(false);
        }
    }

    // Format date for display
    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Modal bezárása háttérre kattintáskor
    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            if (currentStep === STEPS.SALON_INFO) {
                navigate(-1);
            }
        }
    }

    // Get step title
    function getStepTitle() {
        switch (currentStep) {
            case STEPS.SELECT_PROVIDER:
                return 'Válasszon szolgáltatót';
            case STEPS.SELECT_SERVICE:
                return 'Válasszon szolgáltatást';
            case STEPS.SELECT_DATETIME:
                return 'Válasszon időpontot';
            case STEPS.CONFIRM:
                return 'Foglalás megerősítése';
            case STEPS.SUCCESS:
                return 'Sikeres foglalás';
            default:
                return salon?.name || 'Szalon';
        }
    }

    // Get step number for progress indicator
    function getStepNumber() {
        switch (currentStep) {
            case STEPS.SELECT_PROVIDER: return 1;
            case STEPS.SELECT_SERVICE: return 2;
            case STEPS.SELECT_DATETIME: return 3;
            case STEPS.CONFIRM: return 4;
            case STEPS.SUCCESS: return 5;
            default: return 0;
        }
    }

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-8 shadow-2xl">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-dark-blue border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-600 text-center">Betöltés...</p>
                </div>
            </div>
        );
    }

    if (error || !salon) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md">
                    <h3 className="text-xl font-bold text-red-600 mb-4">Hiba</h3>
                    <p className="text-gray-600 mb-6">{error || 'A szalon nem található'}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full py-2 bg-dark-blue text-white rounded-xl font-medium hover:bg-blue-800 transition-colors"
                    >
                        Vissza
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-8 max-h-[90vh] flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="shrink-0 bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Vissza"
                        >
                            <LeftArrowIcon />
                        </button>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900">{getStepTitle()}</h2>
                            {currentStep !== STEPS.SALON_INFO && currentStep !== STEPS.SUCCESS && (
                                <p className="text-sm text-gray-500">{salon.name}</p>
                            )}
                        </div>
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Bezárás"
                        >
                            <CloseIcon />
                        </button>
                    </div>
                    
                    {/* Progress indicator */}
                    {currentStep !== STEPS.SALON_INFO && currentStep !== STEPS.SUCCESS && (
                        <div className="mt-4 flex items-center gap-2">
                            {[1, 2, 3, 4].map((step) => (
                                <div key={step} className="flex-1 flex items-center">
                                    <div className={`h-2 flex-1 rounded-full transition-colors ${
                                        step <= getStepNumber() ? 'bg-indigo-600' : 'bg-gray-200'
                                    }`} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    
                    {/* STEP: Salon Info */}
                    {currentStep === STEPS.SALON_INFO && (
                        <div className="p-6 space-y-6">
                            {/* Banner & Logo */}
                            <div className="relative">
                                <div 
                                    className="h-32 rounded-2xl relative"
                                    style={
                                        salon.banner_image_url
                                            ? { backgroundImage: `url(${(import.meta.env.VITE_API_URL || 'http://localhost:3000') + salon.banner_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '1rem' }
                                            : { 
                                                background: salon.banner_color 
                                                    ? `linear-gradient(135deg, ${salon.banner_color} 0%, ${salon.banner_color}dd 100%)` 
                                                    : 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)'
                                              }
                                    }
                                >
                                    <div className="absolute -bottom-10 left-6">
                                        <div className="w-20 h-20 rounded-full border-4 border-white bg-white flex items-center justify-center shadow-lg overflow-hidden">
                                            {salon.logo_url ? (
                                                <img src={(import.meta.env.VITE_API_URL || 'http://localhost:3000') + salon.logo_url} alt={salon.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-3xl font-bold text-dark-blue">{salon.name.charAt(0).toUpperCase()}</span>
                                            )}
                                        </div>
                                    </div>
                                    {salon.status && (
                                        <div className="absolute top-3 right-3 px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-semibold">
                                            {salon.status === 'open' ? '✓ Nyitva' : salon.status}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Salon details */}
                            <div className="pt-8">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">{salon.name}</h3>
                                        {salon.type && (
                                            <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                                {salon.type}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                {salon.description && (
                                    <p className="mt-4 text-gray-600 leading-relaxed">{salon.description}</p>
                                )}
                            </div>

                            {/* Contact info */}
                            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                <h4 className="font-semibold text-gray-900">Elérhetőségek</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span>📍</span>
                                        <span className="text-gray-600">{salon.address}</span>
                                    </div>
                                    {salon.phone && (
                                        <div className="flex items-center gap-2">
                                            <span>📞</span>
                                            <a href={`tel:${salon.phone}`} className="text-indigo-600 hover:underline">{salon.phone}</a>
                                        </div>
                                    )}
                                    {salon.email && (
                                        <div className="flex items-center gap-2">
                                            <span>✉️</span>
                                            <a href={`mailto:${salon.email}`} className="text-indigo-600 hover:underline">{salon.email}</a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Providers preview */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3">
                                    Munkatársak ({salon.providers?.length || 0})
                                </h4>
                                <div className="flex -space-x-2">
                                    {salon.providers?.slice(0, 5).map((provider) => (
                                        <div 
                                            key={provider.id}
                                            className="w-10 h-10 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-600 overflow-hidden"
                                            title={provider.name}
                                        >
                                            {provider.profile_picture_url ? (
                                                <img src={(import.meta.env.VITE_API_URL || 'http://localhost:3000') + provider.profile_picture_url} alt={provider.name} className="w-full h-full object-cover" />
                                            ) : (
                                                provider.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                    ))}
                                    {salon.providers?.length > 5 && (
                                        <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                                            +{salon.providers.length - 5}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP: Select Provider */}
                    {currentStep === STEPS.SELECT_PROVIDER && (
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {salon.providers?.map((provider) => (
                                    <button
                                        key={provider.id}
                                        onClick={() => handleSelectProvider(provider)}
                                        className="text-left p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-600 group-hover:bg-indigo-200 transition-colors overflow-hidden">
                                                {provider.profile_picture_url ? (
                                                    <img src={(import.meta.env.VITE_API_URL || 'http://localhost:3000') + provider.profile_picture_url} alt={provider.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    provider.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                    {provider.name}
                                                </h4>
                                                {provider.role && (
                                                    <p className="text-sm text-gray-500">{provider.role}</p>
                                                )}
                                                {provider.average_rating > 0 ? (
                                                    <div className="flex items-center text-yellow-400 text-sm mt-1">
                                                        <span className="tracking-wide">
                                                            {'★'.repeat(Math.round(provider.average_rating))}
                                                            {'☆'.repeat(5 - Math.round(provider.average_rating))}
                                                        </span>
                                                        <span className="text-gray-700 text-xs ml-1 font-medium">
                                                            {Number(provider.average_rating).toFixed(2)}
                                                        </span>
                                                        <span className="text-gray-400 text-xs ml-1">
                                                            ({provider.rating_count})
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-400 mt-1">Még nincs értékelés</p>
                                                )}
                                                <p className="text-sm text-indigo-600 mt-1">
                                                    {provider.services?.length || 0} szolgáltatás
                                                </p>
                                            </div>
                                            <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                        {provider.description && (
                                            <p className="mt-3 text-sm text-gray-500 line-clamp-2">{provider.description}</p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP: Select Service */}
                    {currentStep === STEPS.SELECT_SERVICE && selectedProvider && (
                        <div className="p-6">
                            {/* Selected provider info */}
                            <div className="flex items-center gap-3 mb-6 p-3 bg-indigo-50 rounded-xl">
                                <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center font-bold text-indigo-700 overflow-hidden">
                                    {selectedProvider.profile_picture_url ? (
                                        <img src={(import.meta.env.VITE_API_URL || 'http://localhost:3000') + selectedProvider.profile_picture_url} alt={selectedProvider.name} className="w-full h-full object-cover" />
                                    ) : (
                                        selectedProvider.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{selectedProvider.name}</p>
                                    <p className="text-sm text-gray-500">Kiválasztott szolgáltató</p>
                                </div>
                            </div>

                            {/* Services list */}
                            <div className="space-y-3">
                                {selectedProvider.services?.map((service) => (
                                    <button
                                        key={service.id}
                                        onClick={() => handleSelectService(service)}
                                        className="w-full text-left p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                    {service.name}
                                                </h4>
                                                {service.description && (
                                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{service.description}</p>
                                                )}
                                                <p className="text-sm text-gray-400 mt-2">
                                                    ⏱️ {service.duration_minutes} perc
                                                </p>
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="text-lg font-bold text-indigo-600">{service.price} Ft</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                                {(!selectedProvider.services || selectedProvider.services.length === 0) && (
                                    <div className="text-center py-12 text-gray-500">
                                        Nincs elérhető szolgáltatás
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP: Select Date & Time */}
                    {currentStep === STEPS.SELECT_DATETIME && selectedProvider && selectedService && (
                        <div className="p-6">
                            {/* Selected info */}
                            <div className="flex items-center gap-3 mb-6 p-3 bg-indigo-50 rounded-xl">
                                <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center font-bold text-indigo-700 overflow-hidden">
                                    {selectedProvider.profile_picture_url ? (
                                        <img src={(import.meta.env.VITE_API_URL || 'http://localhost:3000') + selectedProvider.profile_picture_url} alt={selectedProvider.name} className="w-full h-full object-cover" />
                                    ) : (
                                        selectedProvider.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{selectedService.name}</p>
                                    <p className="text-sm text-gray-500">{selectedProvider.name} • {selectedService.duration_minutes} perc</p>
                                </div>
                                <p className="font-bold text-indigo-600">{selectedService.price} Ft</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Date picker */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Válasszon dátumot
                                    </label>
                                    <div className="flex justify-center">
                                        <DatePicker
                                            selected={selectedDate}
                                            onChange={(date) => setSelectedDate(date)}
                                            minDate={new Date()}
                                            locale="hu"
                                            dateFormat="yyyy. MMMM d."
                                            inline
                                            calendarClassName="!bg-white !border-gray-200 !rounded-xl !shadow-lg !font-sans"
                                        />
                                    </div>
                                </div>

                                {/* Time slots */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Válasszon időpontot
                                    </label>
                                    {!selectedDate ? (
                                        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                            <p className="text-gray-500">Először válasszon dátumot</p>
                                        </div>
                                    ) : loadingSlots ? (
                                        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl">
                                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
                                        </div>
                                    ) : availableSlots.length > 0 ? (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-1">
                                            {availableSlots.map((slot) => (
                                                <button
                                                    key={slot}
                                                    onClick={() => setSelectedTime(slot)}
                                                    className={`px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                                                        selectedTime === slot
                                                            ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-600 ring-offset-2'
                                                            : 'bg-white border border-gray-200 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50'
                                                    }`}
                                                >
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl">
                                            <p className="text-gray-500">Nincs elérhető időpont</p>
                                            <p className="text-sm text-gray-400 mt-1">Válasszon másik napot</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP: Confirm */}
                    {currentStep === STEPS.CONFIRM && selectedProvider && selectedService && selectedDate && selectedTime && (
                        <div className="p-6">
                            <div className="max-w-lg mx-auto">
                                {/* Booking summary */}
                                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                                    <h4 className="font-semibold text-gray-900 text-lg">Foglalás összegzése</h4>
                                    
                                    <div className="space-y-3 divide-y divide-gray-200">
                                        <div className="flex justify-between py-2">
                                            <span className="text-gray-500">Szalon</span>
                                            <span className="font-medium text-gray-900">{salon.name}</span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="text-gray-500">Szolgáltató</span>
                                            <span className="font-medium text-gray-900">{selectedProvider.name}</span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="text-gray-500">Szolgáltatás</span>
                                            <span className="font-medium text-gray-900">{selectedService.name}</span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="text-gray-500">Időtartam</span>
                                            <span className="font-medium text-gray-900">{selectedService.duration_minutes} perc</span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="text-gray-500">Időpont</span>
                                            <span className="font-medium text-gray-900 text-right">
                                                {selectedDate.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                <br />
                                                <span className="text-indigo-600">{selectedTime}</span>
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="text-gray-500">Fizetendő</span>
                                            <span className="text-xl font-bold text-indigo-600">{selectedService.price} Ft</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Comment */}
                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Megjegyzés (opcionális)
                                    </label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Pl.: Speciális kérések, allergiák..."
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP: Success */}
                    {currentStep === STEPS.SUCCESS && bookingResult && (
                        <div className="p-6 flex items-center justify-center min-h-100">
                            <div className="text-center max-w-md">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Sikeres foglalás!</h3>
                                <p className="text-gray-600 mb-8">Az időpontod sikeresen lefoglaltad.</p>
                                
                                <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Szalon:</span>
                                            <span className="font-medium text-gray-900">{bookingResult.salon_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Szolgáltató:</span>
                                            <span className="font-medium text-gray-900">{bookingResult.provider_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Szolgáltatás:</span>
                                            <span className="font-medium text-gray-900">{bookingResult.service_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Időpont:</span>
                                            <span className="font-medium text-gray-900">{formatDate(bookingResult.appointment_start)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Ár:</span>
                                            <span className="font-bold text-indigo-600">{bookingResult.price} Ft</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => navigate('/dashboard?tab=appointments')}
                                        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                                    >
                                        Foglalásaim megtekintése
                                    </button>
                                    <button
                                        onClick={resetBooking}
                                        className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        Új foglalás
                                    </button>
                                    <button
                                        onClick={() => navigate(-1)}
                                        className="w-full py-2 text-gray-500 font-medium hover:text-gray-700 transition-colors"
                                    >
                                        Bezárás
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="shrink-0 bg-white border-t border-gray-200 px-6 py-4">
                    {currentStep === STEPS.SALON_INFO && (
                        <div className="space-y-2">
                            {!isUserActive() && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                                    <p className="font-semibold mb-1">Profil kitöltése szükséges</p>
                                    <p>Az időpontfoglaláshoz add meg a neved, email címed és telefonszámod a profilodban.</p>
                                    <button
                                        onClick={() => navigate('/dashboard?tab=profile')}
                                        className="mt-2 text-indigo-600 font-medium hover:text-indigo-700 underline"
                                    >
                                        Profil szerkesztése →
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={startBooking}
                                disabled={!salon.providers || salon.providers.length === 0 || !isUserActive()}
                                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Időpontfoglalás
                            </button>
                        </div>
                    )}
                    
                    {currentStep === STEPS.SELECT_DATETIME && (
                        <button
                            onClick={handleDateTimeConfirm}
                            disabled={!selectedDate || !selectedTime}
                            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Tovább a megerősítéshez
                        </button>
                    )}
                    
                    {currentStep === STEPS.CONFIRM && (
                        <button
                            onClick={handleSubmitBooking}
                            disabled={booking}
                            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {booking ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                    Foglalás folyamatban...
                                </span>
                            ) : (
                                'Foglalás véglegesítése'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
