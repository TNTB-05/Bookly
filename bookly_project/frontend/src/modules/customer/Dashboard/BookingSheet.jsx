import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi, useAuth } from '../../auth/auth';
import { useNotification } from '../../../components/NotificationContext';
import { API_URL } from '../../../config';
import CloseIcon from '../../../icons/CloseIcon';
import LeftArrowIcon from '../../../icons/LeftArrowIcon';
import TickIcon from '../../../icons/TickIcon';
import CalendarIcon from '../../../icons/CalendarIcon';

const STEPS = {
    PROVIDER: 'provider',
    SERVICE: 'service',
    DATETIME: 'datetime',
    CONFIRM: 'confirm',
    SUCCESS: 'success',
    WAITLIST: 'waitlist',
};

const MONTH_NAMES = ['Január','Február','Március','Április','Május','Június','Július','Augusztus','Szeptember','Október','November','December'];
const DAY_HEADERS = ['H','K','Sz','Cs','P','Szo','V'];

// ── Mini Calendar ──────────────────────────────────────────────────────────────
function MiniCalendar({ selectedDate, onSelectDate, openDays, minDate }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const effectiveMin = minDate || today;
    const [viewDate, setViewDate] = useState(selectedDate || effectiveMin);
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    // Mon=0 offset
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
        cells.push(new Date(year, month, d));
    }

    function isDisabled(date) {
        if (!date) return true;
        if (date < effectiveMin) return true;
        if (openDays && openDays.length > 0 && !openDays.includes(date.getDay())) return true;
        return false;
    }

    function isSameDay(a, b) {
        if (!a || !b) return false;
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
    const canGoPrev = new Date(year, month - 1, 1) >= new Date(effectiveMin.getFullYear(), effectiveMin.getMonth(), 1);

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <button
                    onClick={prevMonth}
                    disabled={!canGoPrev}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-cyan-50 text-dark-blue disabled:opacity-30 hover:bg-cyan-100 transition-colors text-sm font-bold"
                >‹</button>
                <span className="text-sm font-bold text-gray-800">{MONTH_NAMES[month]} {year}</span>
                <button
                    onClick={nextMonth}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-cyan-50 text-dark-blue hover:bg-cyan-100 transition-colors text-sm font-bold"
                >›</button>
            </div>
            <div className="grid grid-cols-7 gap-0.5">
                {DAY_HEADERS.map(d => (
                    <div key={d} className="text-center text-[10px] font-semibold text-gray-400 pb-1">{d}</div>
                ))}
                {cells.map((date, i) => {
                    if (!date) return <div key={`e${i}`} />;
                    const disabled = isDisabled(date);
                    const selected = isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, new Date());
                    return (
                        <button
                            key={date.toISOString()}
                            disabled={disabled}
                            onClick={() => !disabled && onSelectDate(date)}
                            className={[
                                'text-xs py-1.5 rounded-full text-center w-full transition-colors',
                                disabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer hover:bg-cyan-50',
                                selected ? '!bg-dark-blue !text-white font-bold' : '',
                                isToday && !selected ? 'bg-cyan-100 text-dark-blue font-bold' : (!disabled && !selected ? 'text-gray-700' : ''),
                            ].join(' ')}
                        >
                            {date.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ── BookingSheet ───────────────────────────────────────────────────────────────
export default function BookingSheet({ salon, isOpen, onClose, preselectedProviderId = null, fastBooking = null }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const { showToast } = useNotification();

    const [step, setStep] = useState(STEPS.PROVIDER);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [comment, setComment] = useState('');
    const [booking, setBooking] = useState(false);
    const [bookingResult, setBookingResult] = useState(null);
    const [userProfile, setUserProfile] = useState(null);

    // Waitlist
    const [waitlistDateFrom, setWaitlistDateFrom] = useState(null);
    const [waitlistDateTo, setWaitlistDateTo] = useState(null);
    const [waitlistTimePreference, setWaitlistTimePreference] = useState('');
    const [waitlistLoading, setWaitlistLoading] = useState(false);
    const [waitlistSuccess, setWaitlistSuccess] = useState(false);
    const [waitlistAvailableWarning, setWaitlistAvailableWarning] = useState(null);

    // Reset when sheet closes
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStep(STEPS.PROVIDER);
                setSelectedProvider(null);
                setSelectedService(null);
                setSelectedDate(null);
                setSelectedTime(null);
                setAvailableSlots([]);
                setComment('');
                setBookingResult(null);
                setWaitlistDateFrom(null);
                setWaitlistDateTo(null);
                setWaitlistTimePreference('');
                setWaitlistSuccess(false);
                setWaitlistAvailableWarning(null);
            }, 300);
        }
    }, [isOpen]);

    // Handle preselection or fastBooking when sheet opens
    useEffect(() => {
        if (!isOpen || !salon?.providers) return;
        if (fastBooking) {
            const provider = salon.providers.find(p => p.id === fastBooking.providerId);
            const service = provider?.services?.find(s => s.id === fastBooking.serviceId);
            if (provider && service) {
                setSelectedProvider(provider);
                setSelectedService(service);
                if (fastBooking.preselectedDate) {
                    setSelectedDate(new Date(fastBooking.preselectedDate + 'T12:00:00'));
                }
                setStep(STEPS.DATETIME);
                return;
            }
        }
        if (preselectedProviderId) {
            const provider = salon.providers.find(p => p.id === preselectedProviderId);
            if (provider) {
                setSelectedProvider(provider);
                setStep(STEPS.SERVICE);
            }
        }
    }, [isOpen, salon]); // eslint-disable-line react-hooks/exhaustive-deps

    // Load user profile when authenticated
    useEffect(() => {
        if (isAuthenticated && isOpen) loadUserProfile();
    }, [isAuthenticated, isOpen]);

    // Load slots when date changes on DATETIME step
    useEffect(() => {
        if (selectedProvider && selectedService && selectedDate && step === STEPS.DATETIME) {
            loadAvailableSlots();
        }
    }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

    // ESC key
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === 'Escape') handleBack(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, step]); // eslint-disable-line react-hooks/exhaustive-deps

    async function loadUserProfile() {
        try {
            const res = await authApi.get('/api/user/profile');
            const data = await res.json();
            if (data.success) setUserProfile(data.user);
        } catch {}
    }

    function isUserActive() {
        return userProfile?.name && userProfile?.email && userProfile?.phone;
    }

    function formatDateLocal(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    async function loadAvailableSlots() {
        if (!selectedProvider || !selectedService || !selectedDate) return;
        const effectiveProviderId = selectedProvider.isAny
            ? selectedService._provider?.id
            : selectedProvider.id;
        if (!effectiveProviderId) return;
        try {
            setLoadingSlots(true);
            setAvailableSlots([]);
            setSelectedTime(null);
            const dateStr = formatDateLocal(selectedDate);
            const res = await fetch(
                `${API_URL}/api/user/provider/${effectiveProviderId}/availability?date=${dateStr}&serviceDuration=${selectedService.duration_minutes}`
            );
            const data = await res.json();
            setAvailableSlots(data.success ? data.slots : []);
        } catch {
            setAvailableSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    }

    async function handleSubmitBooking() {
        if (!selectedProvider || !selectedService || !selectedDate || !selectedTime) return;
        if (!isAuthenticated) {
            navigate('/login', { state: { from: location } });
            return;
        }
        if (!isUserActive()) {
            showToast('Kérjük, töltsd ki a profilod a foglalás előtt.', 'warning');
            navigate('/dashboard?tab=profile');
            return;
        }
        try {
            setBooking(true);
            const effectiveProviderId = selectedProvider.isAny
                ? selectedService._provider?.id
                : selectedProvider.id;
            const res = await authApi.post('/api/user/appointments', {
                provider_id: effectiveProviderId,
                service_id: selectedService.id,
                appointment_date: formatDateLocal(selectedDate),
                appointment_time: selectedTime,
                comment: comment || null,
            });
            const data = await res.json();
            if (data.success) {
                setBookingResult(data.appointment);
                setStep(STEPS.SUCCESS);
            } else if (res.status === 409) {
                showToast(data.message || 'Ez az időpont már foglalt. Kérjük, válasszon másik időpontot.', 'warning');
                setStep(STEPS.DATETIME);
                loadAvailableSlots();
            } else {
                showToast(data.message || 'Hiba történt a foglalás létrehozásakor', 'error');
            }
        } catch {
            showToast('Hiba történt a foglalás létrehozásakor', 'error');
        } finally {
            setBooking(false);
        }
    }

    async function handleJoinWaitlist() {
        if (!waitlistDateFrom || !waitlistDateTo) return;
        setWaitlistLoading(true);
        setWaitlistAvailableWarning(null);
        const timeMap = {
            morning: { from: '08:00', to: '12:00' },
            afternoon: { from: '12:00', to: '17:00' },
            evening: { from: '17:00', to: '20:00' },
        };
        const timeRange = timeMap[waitlistTimePreference] || {};
        const msPerDay = 86400000;
        const totalDays = Math.min(Math.round((waitlistDateTo - waitlistDateFrom) / msPerDay) + 1, 60);
        // When "any provider" was selected, use the actual provider from the chosen service
        const effectiveProviderId = selectedProvider?.isAny
            ? selectedService?._provider?.id
            : selectedProvider?.id;
        if (!effectiveProviderId) {
            setWaitlistLoading(false);
            return;
        }
        try {
            for (let i = 0; i < totalDays; i++) {
                const checkDate = new Date(waitlistDateFrom.getTime() + i * msPerDay);
                const dateStr = formatDateLocal(checkDate);
                const res = await fetch(
                    `${API_URL}/api/user/provider/${effectiveProviderId}/availability?date=${dateStr}&serviceDuration=${selectedService.duration_minutes}`
                );
                const data = await res.json();
                if (data.success && data.slots?.length > 0) {
                    const match = timeRange.from
                        ? data.slots.find(s => s >= timeRange.from && s < timeRange.to)
                        : data.slots[0];
                    if (match) {
                        setWaitlistAvailableWarning({ date: dateStr, slot: match });
                        setWaitlistLoading(false);
                        return;
                    }
                }
            }
            const res = await authApi.post('/api/waitlist', {
                provider_id: effectiveProviderId,
                service_id: selectedService.id,
                date_from: formatDateLocal(waitlistDateFrom),
                date_to: formatDateLocal(waitlistDateTo),
                time_from: timeRange.from || null,
                time_to: timeRange.to || null,
            });
            const resData = await res.json();
            if (resData.success) setWaitlistSuccess(true);
        } finally {
            setWaitlistLoading(false);
        }
    }

    function handleBack() {
        switch (step) {
            case STEPS.PROVIDER:
                onClose();
                break;
            case STEPS.SERVICE:
                if (fastBooking) { onClose(); break; }
                setSelectedProvider(null);
                setStep(STEPS.PROVIDER);
                break;
            case STEPS.DATETIME:
                if (fastBooking) { onClose(); break; }
                setSelectedService(null);
                setSelectedDate(null);
                setSelectedTime(null);
                setAvailableSlots([]);
                setStep(STEPS.SERVICE);
                break;
            case STEPS.CONFIRM:
                setStep(STEPS.DATETIME);
                break;
            case STEPS.WAITLIST:
                setStep(STEPS.DATETIME);
                break;
            case STEPS.SUCCESS:
                onClose();
                break;
            default:
                onClose();
        }
    }

    function getStepIndex() {
        switch (step) {
            case STEPS.PROVIDER: return 1;
            case STEPS.SERVICE: return 2;
            case STEPS.DATETIME: return 3;
            case STEPS.CONFIRM: return 4;
            default: return 0;
        }
    }

    function formatPrice(price) {
        if (!price && price !== 0) return '';
        return `${Number(price).toLocaleString('hu-HU')} Ft`;
    }

    function formatDateDisplay(date) {
        if (!date) return '';
        return date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    const showProgress = [STEPS.PROVIDER, STEPS.SERVICE, STEPS.DATETIME, STEPS.CONFIRM].includes(step);
    const stepIndex = getStepIndex();

    const stepTitles = {
        [STEPS.PROVIDER]: 'Válassz munkatársat',
        [STEPS.SERVICE]: 'Válassz szolgáltatást',
        [STEPS.DATETIME]: 'Válassz időpontot',
        [STEPS.CONFIRM]: 'Foglalás összefoglalása',
        [STEPS.SUCCESS]: 'Foglalás sikeres!',
        [STEPS.WAITLIST]: 'Várólistára feliratkozás',
    };

    return (
        <div
            className={`fixed inset-0 z-50 transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sheet */}
            <div
                className={`absolute bottom-0 left-0 right-0 flex flex-col rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
                style={{
                    background: '#f0f9fc',
                    maxHeight: '92vh',
                    borderTop: '1.5px solid #cceaf4',
                }}
            >
                {/* Handle */}
                <div className="shrink-0 pt-3 pb-1 flex justify-center">
                    <div className="w-10 h-1 rounded-full" style={{ background: '#b2d8e8' }} />
                </div>

                {/* Header */}
                <div className="shrink-0 px-5 pb-3 flex items-center gap-3">
                    <button
                        onClick={handleBack}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cyan-100 transition-colors text-dark-blue"
                    >
                        <LeftArrowIcon className="w-4 h-4" />
                    </button>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900" style={{ fontSize: 16 }}>{stepTitles[step]}</h3>
                        {showProgress && (
                            <p className="text-xs text-gray-400">{salon?.name}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cyan-100 transition-colors text-gray-400"
                    >
                        <CloseIcon className="w-4 h-4" />
                    </button>
                </div>

                {/* Progress bar */}
                {showProgress && (
                    <div className="shrink-0 px-5 pb-3 flex gap-1.5">
                        {[1, 2, 3, 4].map(i => (
                            <div
                                key={i}
                                className="flex-1 h-1 rounded-full transition-all duration-300"
                                style={{
                                    background: i < stepIndex ? '#0A8CBA' : i === stepIndex ? 'linear-gradient(90deg,#0A8CBA,#7DE1F4)' : '#d0eaf4',
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-5 pb-6">

                    {/* ── STEP: PROVIDER ── */}
                    {step === STEPS.PROVIDER && (
                        <div className="space-y-2.5">
                            {/* Any provider option */}
                            <button
                                onClick={() => { setSelectedProvider({ id: 'any', name: 'Bármelyik munkatárs', isAny: true }); setStep(STEPS.SERVICE); }}
                                className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 border-cyan-100 bg-white hover:border-dark-blue/30 hover:bg-cyan-50/50 transition-all text-left"
                            >
                                <div className="w-11 h-11 rounded-full flex items-center justify-center text-dark-blue font-bold text-sm flex-shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #C9F5FA, #7DE1F4)' }}>
                                    ✦
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-gray-900 text-sm">Bármelyik munkatárs</div>
                                    <div className="text-xs text-gray-400">Legjobb szabad időpont</div>
                                </div>
                            </button>

                            {/* Provider list */}
                            {salon?.providers?.map(provider => (
                                <button
                                    key={provider.id}
                                    onClick={() => { setSelectedProvider(provider); setStep(STEPS.SERVICE); }}
                                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 border-cyan-100 bg-white hover:border-dark-blue/40 hover:bg-cyan-50/50 transition-all text-left"
                                >
                                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0 overflow-hidden"
                                        style={{ background: 'linear-gradient(135deg, #0A8CBA, #7DE1F4)' }}>
                                        {provider.profile_picture_url
                                            ? <img src={API_URL + provider.profile_picture_url} alt={provider.name} className="w-full h-full object-cover" />
                                            : provider.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-gray-900 text-sm">{provider.name}</div>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            {provider.average_rating > 0 && (
                                                <span className="text-xs text-yellow-500 font-semibold">★ {Number(provider.average_rating).toFixed(1)}</span>
                                            )}
                                            {provider.services?.length > 0 && (
                                                <span className="text-xs text-gray-400">
                                                    {provider.average_rating > 0 ? ' · ' : ''}
                                                    {provider.services.map(s => s.name).join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-gray-300 text-sm">›</div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ── STEP: SERVICE ── */}
                    {step === STEPS.SERVICE && (
                        <div className="space-y-2.5">
                            {/* Selected provider banner */}
                            {selectedProvider && !selectedProvider.isAny && (
                                <div className="flex items-center gap-3 p-3 rounded-xl mb-1"
                                    style={{ background: 'rgba(10,140,186,0.06)', border: '1px solid rgba(10,140,186,0.15)' }}>
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0 overflow-hidden"
                                        style={{ background: 'linear-gradient(135deg, #0A8CBA, #7DE1F4)' }}>
                                        {selectedProvider.profile_picture_url
                                            ? <img src={API_URL + selectedProvider.profile_picture_url} alt={selectedProvider.name} className="w-full h-full object-cover" />
                                            : selectedProvider.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold text-dark-blue">{selectedProvider.name}</div>
                                        {selectedProvider.average_rating > 0 && (
                                            <div className="text-xs text-yellow-500">★ {Number(selectedProvider.average_rating).toFixed(1)}</div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => { setSelectedProvider(null); setStep(STEPS.PROVIDER); }}
                                        className="text-xs text-dark-blue underline"
                                    >
                                        Változtat
                                    </button>
                                </div>
                            )}

                            {/* Services of selected provider (or all if "any") */}
                            {(selectedProvider?.isAny
                                ? salon?.providers?.flatMap(p => (p.services || []).map(s => ({ ...s, _provider: p })))
                                : (selectedProvider?.services || [])
                            )?.map(service => (
                                <button
                                    key={service.id}
                                    onClick={() => { setSelectedService(service); setStep(STEPS.DATETIME); }}
                                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 border-cyan-100 bg-white hover:border-dark-blue/40 hover:bg-cyan-50/50 transition-all text-left"
                                >
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                                        style={{ background: '#e0f7fa' }}>
                                        ✂
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-gray-900 text-sm">{service.name}</div>
                                        <div className="text-xs text-gray-400">{service.duration_minutes} perc</div>
                                    </div>
                                    <div className="text-dark-blue font-bold text-sm">{formatPrice(service.price)}</div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ── STEP: DATETIME ── */}
                    {step === STEPS.DATETIME && (
                        <div>
                            {/* Selection summary banner */}
                            <div className="flex items-center gap-2 p-3 rounded-xl mb-4"
                                style={{ background: 'rgba(10,140,186,0.06)', border: '1px solid rgba(10,140,186,0.15)' }}>
                                <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #0A8CBA, #7DE1F4)' }}>
                                    {selectedProvider?.isAny ? '✦' : selectedProvider?.name?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-dark-blue truncate">
                                        {selectedProvider?.isAny ? 'Bármelyik munkatárs' : selectedProvider?.name} · {selectedService?.name}
                                    </div>
                                    <div className="text-xs text-gray-400">{selectedService?.duration_minutes} perc · {formatPrice(selectedService?.price)}</div>
                                </div>
                            </div>

                            {/* Calendar */}
                            <div className="bg-white rounded-2xl p-4 border border-cyan-100 mb-4">
                                <MiniCalendar
                                    selectedDate={selectedDate}
                                    onSelectDate={setSelectedDate}
                                    openDays={salon?.open_days}
                                />
                            </div>

                            {/* Time slots */}
                            {selectedDate && (
                                <div className="mb-4">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                                        Szabad időpontok — {formatDateDisplay(selectedDate)}
                                    </p>
                                    {loadingSlots ? (
                                        <div className="flex gap-2 flex-wrap">
                                            {[...Array(6)].map((_, i) => (
                                                <div key={i} className="h-9 w-16 rounded-xl bg-cyan-50 animate-pulse" />
                                            ))}
                                        </div>
                                    ) : availableSlots.length === 0 ? (
                                        <div className="text-sm text-gray-400 py-2">Ezen a napon nincs szabad időpont.</div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {availableSlots.map(slot => (
                                                <button
                                                    key={slot}
                                                    onClick={() => setSelectedTime(slot)}
                                                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                                                        selectedTime === slot
                                                            ? 'bg-dark-blue text-white border-dark-blue shadow-sm'
                                                            : 'bg-white text-gray-700 border-cyan-100 hover:border-dark-blue/40 hover:bg-cyan-50'
                                                    }`}
                                                >
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Waitlist link */}
                            <div className="rounded-xl p-3 mb-4 flex items-center gap-2"
                                style={{ background: '#fffbe6', border: '1px solid #ffe082' }}>
                                <span className="text-sm">⏳</span>
                                <p className="text-xs text-yellow-800 flex-1">
                                    Nem találsz megfelelő időpontot?{' '}
                                    <button
                                        onClick={() => setStep(STEPS.WAITLIST)}
                                        className="underline font-semibold"
                                    >
                                        Iratkozz fel a várólistára →
                                    </button>
                                </p>
                            </div>

                            {/* Next CTA */}
                            <button
                                onClick={() => selectedDate && selectedTime && setStep(STEPS.CONFIRM)}
                                disabled={!selectedDate || !selectedTime}
                                className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ background: 'linear-gradient(135deg, #0A8CBA, #7DE1F4)', boxShadow: '0 4px 16px rgba(10,140,186,0.25)' }}
                            >
                                Következő →
                            </button>
                        </div>
                    )}

                    {/* ── STEP: CONFIRM ── */}
                    {step === STEPS.CONFIRM && (
                        <div>
                            {/* Summary card */}
                            <div className="bg-white rounded-2xl border border-cyan-100 overflow-hidden mb-4">
                                <div className="divide-y divide-cyan-50">
                                    {[
                                        ['Szalon', salon?.name],
                                        ['Munkatárs', selectedProvider?.isAny ? 'Bármelyik' : selectedProvider?.name],
                                        ['Szolgáltatás', selectedService?.name],
                                        ['Időtartam', `${selectedService?.duration_minutes} perc`],
                                        ['Dátum', formatDateDisplay(selectedDate)],
                                        ['Időpont', selectedTime],
                                    ].map(([label, val]) => (
                                        <div key={label} className="flex justify-between items-center px-4 py-3">
                                            <span className="text-sm text-gray-400">{label}</span>
                                            <span className="text-sm font-semibold text-gray-800">{val}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="px-4 py-3 flex justify-between items-center"
                                    style={{ background: 'rgba(10,140,186,0.04)', borderTop: '1.5px solid #cceaf4' }}>
                                    <span className="font-bold text-gray-800">Összesen</span>
                                    <span className="text-xl font-black text-dark-blue">{formatPrice(selectedService?.price)}</span>
                                </div>
                            </div>

                            {/* Comment */}
                            <textarea
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                placeholder="Megjegyzés (opcionális)..."
                                rows={2}
                                className="w-full bg-white border-2 border-cyan-100 rounded-2xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 resize-none mb-4 focus:outline-none focus:border-dark-blue/40 transition-colors"
                            />

                            {/* Submit */}
                            <button
                                onClick={handleSubmitBooking}
                                disabled={booking}
                                className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #0A8CBA, #7DE1F4)', boxShadow: '0 4px 16px rgba(10,140,186,0.25)' }}
                            >
                                {booking ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Foglalás...
                                    </>
                                ) : (
                                    <>
                                        <TickIcon className="w-4 h-4" />
                                        Foglalás véglegesítése
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleBack}
                                className="w-full py-3 mt-2.5 rounded-2xl font-semibold text-sm border-2 border-cyan-100 text-dark-blue bg-transparent hover:bg-cyan-50 transition-colors"
                            >
                                ← Vissza
                            </button>
                        </div>
                    )}

                    {/* ── STEP: SUCCESS ── */}
                    {step === STEPS.SUCCESS && (
                        <div className="flex flex-col items-center text-center pt-2 pb-4">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                                style={{ background: 'linear-gradient(135deg, #0A8CBA, #7DE1F4)', boxShadow: '0 6px 24px rgba(10,140,186,0.3)' }}>
                                <TickIcon className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-1">Foglalás sikeres!</h3>
                            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                                Visszaigazolást küldtünk az e-mail<br />címedre. Várunk szeretettel!
                            </p>

                            {/* Booking details */}
                            <div className="w-full bg-white rounded-2xl border border-cyan-100 overflow-hidden mb-5">
                                <div className="divide-y divide-cyan-50">
                                    {[
                                        ['Munkatárs', selectedProvider?.isAny ? 'Bármelyik' : selectedProvider?.name],
                                        ['Szolgáltatás', selectedService?.name],
                                    ].map(([label, val]) => (
                                        <div key={label} className="flex justify-between px-4 py-3">
                                            <span className="text-sm text-gray-400">{label}</span>
                                            <span className="text-sm font-semibold text-gray-800">{val}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between px-4 py-3">
                                        <span className="text-sm text-gray-400">Időpont</span>
                                        <span className="text-sm font-bold text-dark-blue">
                                            {formatDateDisplay(selectedDate)} {selectedTime}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/dashboard?tab=appointments')}
                                className="w-full py-3.5 rounded-2xl font-bold text-white text-sm mb-2.5"
                                style={{ background: 'linear-gradient(135deg, #0A8CBA, #7DE1F4)', boxShadow: '0 4px 16px rgba(10,140,186,0.25)' }}
                            >
                                <CalendarIcon className="inline w-4 h-4 mr-1.5" />
                                Foglalásaim megtekintése
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-2xl font-semibold text-sm border-2 border-cyan-100 text-dark-blue hover:bg-cyan-50 transition-colors"
                            >
                                Vissza a szalonhoz
                            </button>
                        </div>
                    )}

                    {/* ── STEP: WAITLIST ── */}
                    {step === STEPS.WAITLIST && (
                        <div>
                            {waitlistSuccess ? (
                                <div className="flex flex-col items-center text-center pt-4 pb-4">
                                    <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                                        style={{ background: 'linear-gradient(135deg, #0A8CBA, #7DE1F4)', boxShadow: '0 4px 18px rgba(10,140,186,0.28)' }}>
                                        <TickIcon className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900 mb-1">Feliratkoztál!</h3>
                                    <p className="text-sm text-gray-400 mb-5">Értesítünk, ha szabad időpont lesz a megadott időszakban.</p>
                                    <button onClick={() => { setStep(STEPS.DATETIME); setWaitlistSuccess(false); }}
                                        className="w-full py-3 rounded-2xl font-semibold text-sm border-2 border-cyan-100 text-dark-blue hover:bg-cyan-50 transition-colors">
                                        ← Vissza az időponthoz
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                                        Ha szabaddá válik egy időpont a megadott időszakban, értesítünk.
                                    </p>

                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Dátum intervallum</p>
                                    <div className="grid grid-cols-2 gap-3 mb-5">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Kezdete</p>
                                            <div className="bg-white border-2 border-cyan-100 rounded-xl p-3">
                                                <MiniCalendar
                                                    selectedDate={waitlistDateFrom}
                                                    onSelectDate={(d) => {
                                                        setWaitlistDateFrom(d);
                                                        if (waitlistDateTo && waitlistDateTo < d) setWaitlistDateTo(null);
                                                    }}
                                                    openDays={salon?.open_days}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Vége</p>
                                            <div className="bg-white border-2 border-cyan-100 rounded-xl p-3">
                                                <MiniCalendar
                                                    selectedDate={waitlistDateTo}
                                                    onSelectDate={setWaitlistDateTo}
                                                    openDays={salon?.open_days}
                                                    minDate={waitlistDateFrom || undefined}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Preferált idősáv (opcionális)</p>
                                    <div className="flex gap-2 mb-5">
                                        {[
                                            { key: 'morning', label: 'Reggel', sub: '8–12' },
                                            { key: 'afternoon', label: 'Délután', sub: '12–17' },
                                            { key: 'evening', label: 'Este', sub: '17–20' },
                                        ].map(({ key, label, sub }) => (
                                            <button
                                                key={key}
                                                onClick={() => setWaitlistTimePreference(p => p === key ? '' : key)}
                                                className={`flex-1 py-2.5 rounded-xl border-2 text-center transition-all ${
                                                    waitlistTimePreference === key
                                                        ? 'border-dark-blue bg-cyan-50 text-dark-blue'
                                                        : 'border-cyan-100 bg-white text-gray-600 hover:border-dark-blue/30'
                                                }`}
                                            >
                                                <div className="text-xs font-bold">{label}</div>
                                                <div className="text-[10px] text-gray-400">{sub}</div>
                                            </button>
                                        ))}
                                    </div>

                                    {waitlistAvailableWarning && (
                                        <div className="rounded-xl p-3 mb-4 text-sm"
                                            style={{ background: '#fffbe6', border: '1px solid #ffe082' }}>
                                            <p className="font-semibold text-yellow-800 mb-1">Van szabad időpont!</p>
                                            <p className="text-yellow-700 text-xs">
                                                {waitlistAvailableWarning.date} – {waitlistAvailableWarning.slot} szabad.
                                                Vissza az időponthoz és válaszd ki!
                                            </p>
                                            <button
                                                onClick={() => { setSelectedDate(new Date(waitlistAvailableWarning.date + 'T12:00:00')); setStep(STEPS.DATETIME); }}
                                                className="mt-2 text-xs font-bold text-dark-blue underline"
                                            >
                                                Időponthoz ugrás →
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleJoinWaitlist}
                                        disabled={!waitlistDateFrom || !waitlistDateTo || waitlistLoading}
                                        className="w-full py-3.5 rounded-2xl font-bold text-white text-sm mb-2.5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        style={{ background: 'linear-gradient(135deg, #0A8CBA, #7DE1F4)', boxShadow: '0 4px 16px rgba(10,140,186,0.25)' }}
                                    >
                                        {waitlistLoading ? (
                                            <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Ellenőrzés...</>
                                        ) : 'Feliratkozás a várólistára'}
                                    </button>
                                    <button
                                        onClick={() => setStep(STEPS.DATETIME)}
                                        className="w-full py-3 rounded-2xl font-semibold text-sm border-2 border-cyan-100 text-dark-blue hover:bg-cyan-50 transition-colors"
                                    >
                                        ← Vissza az időponthoz
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
