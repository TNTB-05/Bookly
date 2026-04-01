import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Marker } from 'react-leaflet';
import { authApi, useAuth } from '../../auth/auth';
import { useNotification } from '../../../components/NotificationContext';
import { API_URL } from '../../../config';
import BaseMap from '../../../components/BaseMap';
import BookingSheet from './BookingSheet';
import LeftArrowIcon from '../../../icons/LeftArrowIcon';
import StarFilledIcon from '../../../icons/StarFilledIcon';
import LocationIcon from '../../../icons/LocationIcon';
import ClockIcon from '../../../icons/ClockIcon';
import SaveIcon from '../../../icons/SaveIcon';

const HU_DAYS_SHORT = ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'];

function getSalonOpenStatus(salon) {
    if (!salon?.opening_hours || !salon?.closing_hours) return null;
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const openDays = salon.open_days || [];
    if (!openDays.includes(dayOfWeek)) return { open: false, label: 'Zárva' };
    const [oh, om] = salon.opening_hours.split(':').map(Number);
    const [ch, cm] = salon.closing_hours.split(':').map(Number);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = oh * 60 + om;
    const closeMinutes = ch * 60 + cm;
    if (nowMinutes >= openMinutes && nowMinutes < closeMinutes) {
        return { open: true, label: `Nyitva · Zár: ${salon.closing_hours}` };
    }
    return { open: false, label: `Zárva · Nyit: ${salon.opening_hours}` };
}

function getMinPrice(salon) {
    const prices = (salon?.providers || [])
        .flatMap(p => p.services || [])
        .map(s => s.price)
        .filter(Boolean);
    return prices.length > 0 ? Math.min(...prices) : null;
}

function AvatarFallback({ name, size = 40, className = 'rounded-full flex-shrink-0' }) {
    const initials = name
        ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : '?';
    return (
        <div
            className={`flex items-center justify-center font-semibold text-white ${className}`}
            style={{ width: size, height: size, background: '#0A8CBA', fontSize: size * 0.38 }}
        >
            {initials}
        </div>
    );
}

function StarRow({ rating, count }) {
    const stars = Math.round(rating || 0);
    return (
        <span className="flex items-center gap-1">
            {[1,2,3,4,5].map(i => (
                <StarFilledIcon key={i} className={`w-4 h-4 ${i <= stars ? 'text-amber-400' : 'text-gray-200'}`} />
            ))}
            {count != null && <span className="text-xs text-gray-400 ml-1">({count})</span>}
        </span>
    );
}

export default function SalonPage() {
    const { salonId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { showToast } = useNotification();

    const [salon, setSalon] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);
    const [savingToggle, setSavingToggle] = useState(false);
    const [bookingOpen, setBookingOpen] = useState(false);
    const [preselectedProviderId, setPreselectedProviderId] = useState(null);
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        loadSalon();
        loadReviews();
        if (isAuthenticated) loadSavedStatus();
    }, [salonId]);

    async function loadSalon() {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/search/salon/${salonId}`);
            const data = await res.json();
            if (data.success) setSalon(data.salon);
            else setError('Nem sikerült betölteni a szalon adatait');
        } catch {
            setError('Hiba történt az adatok betöltésekor');
        } finally {
            setLoading(false);
        }
    }

    async function loadSavedStatus() {
        try {
            const res = await authApi.get('/api/user/saved-salon-ids');
            const data = await res.json();
            if (data.success) setSaved((data.savedIds || []).includes(parseInt(salonId)));
        } catch { /* ignore */ }
    }

    async function loadReviews() {
        try {
            const res = await fetch(`${API_URL}/api/search/salon/${salonId}/reviews`);
            const data = await res.json();
            if (data.success) setReviews(data.reviews || []);
        } catch { /* ignore */ }
    }

    async function toggleSave() {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: { pathname: `/salon/${salonId}` } } });
            return;
        }
        setSavingToggle(true);
        try {
            if (saved) {
                await authApi.delete(`/api/user/saved-salons/${salonId}`);
                setSaved(false);
                showToast('Szalon eltávolítva a mentett listáról', 'info');
            } else {
                await authApi.post(`/api/user/saved-salons/${salonId}`);
                setSaved(true);
                showToast('Szalon elmentve!', 'success');
            }
        } catch {
            showToast('Hiba a mentés során', 'error');
        } finally {
            setSavingToggle(false);
        }
    }

    function openBooking(providerId = null) {
        setPreselectedProviderId(providerId);
        setBookingOpen(true);
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f9fc' }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#0A8CBA', borderTopColor: 'transparent' }} />
                    <p className="text-sm" style={{ color: '#0A8CBA' }}>Betöltés...</p>
                </div>
            </div>
        );
    }

    if (error || !salon) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f9fc' }}>
                <div className="bg-white rounded-2xl p-8 shadow text-center max-w-sm">
                    <p className="text-gray-600 mb-4">{error || 'A szalon nem található'}</p>
                    <button onClick={() => navigate(-1)} className="px-6 py-2 rounded-xl text-white font-medium" style={{ background: '#0A8CBA' }}>
                        Vissza
                    </button>
                </div>
            </div>
        );
    }

    const openStatus = getSalonOpenStatus(salon);
    const minPrice = getMinPrice(salon);

    const heroStyle = salon.banner_image_url
        ? { backgroundImage: `url(${API_URL}${salon.banner_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: salon.banner_color || 'linear-gradient(135deg, #0A8CBA 0%, #7DE1F4 100%)' };

    return (
        <div className="min-h-screen" style={{ background: '#f0f9fc' }}>

            {/* ── HERO ─────────────────────────────────────────────────── */}
            <div className="relative w-full" style={{ height: 260 }}>
                <div className="absolute inset-0" style={heroStyle} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 50%, rgba(0,0,0,0.25) 100%)' }} />

                {/* Nav buttons */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 safe-top">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-sm"
                        style={{ background: 'rgba(255,255,255,0.85)' }}
                    >
                        <LeftArrowIcon className="w-5 h-5" style={{ color: '#0d2d3a' }} />
                    </button>
                    <button
                        onClick={toggleSave}
                        disabled={savingToggle}
                        className="w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-sm"
                        style={{ background: 'rgba(255,255,255,0.85)' }}
                    >
                        <SaveIcon filled={saved} className="w-5 h-5" style={{ color: saved ? '#0A8CBA' : '#0d2d3a' }} />
                    </button>
                </div>

                {/* Rating badge */}
                {salon.average_rating != null && (
                    <div
                        className="absolute bottom-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold"
                        style={{ background: 'rgba(255,255,255,0.92)', color: '#0d2d3a' }}
                    >
                        <StarFilledIcon className="w-4 h-4 text-amber-400" />
                        <span>{Number(salon.average_rating).toFixed(1)}</span>
                        {salon.rating_count != null && <span className="text-gray-400 font-normal text-xs">({salon.rating_count})</span>}
                    </div>
                )}
            </div>

            {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
            <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-6 lg:max-w-6xl lg:mx-auto lg:px-6 lg:pt-6 relative" style={{ marginTop: -32 }}>

                {/* ── LEFT COLUMN ───────────────────────────────────────── */}
                <div className="flex flex-col gap-4 pb-28 lg:pb-8">

                    {/* Identity card */}
                    <div className="bg-white rounded-3xl shadow-sm px-5 pt-5 pb-4 mx-4 lg:mx-0">
                        <div className="flex items-start gap-4">
                            {/* Logo */}
                            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 flex-shrink-0 shadow" style={{ borderColor: '#cceaf4' }}>
                                {salon.logo_url
                                    ? <img src={`${API_URL}${salon.logo_url}`} alt={salon.name} className="w-full h-full object-cover" />
                                    : <AvatarFallback name={salon.name} size={60} className="rounded-none" />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-xl font-bold leading-tight" style={{ color: '#0d2d3a' }}>{salon.name}</h1>
                                {salon.type && <p className="text-sm mt-0.5" style={{ color: '#0A8CBA' }}>{salon.type}</p>}
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {openStatus && (
                                        <span
                                            className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                            style={{
                                                background: openStatus.open ? '#dcfce7' : '#fee2e2',
                                                color: openStatus.open ? '#166534' : '#991b1b',
                                            }}
                                        >
                                            {openStatus.label}
                                        </span>
                                    )}
                                    {salon.opening_hours && salon.closing_hours && (
                                        <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: '#f0f9fc', color: '#0A8CBA' }}>
                                            <ClockIcon className="w-3 h-3" />
                                            {salon.opening_hours} – {salon.closing_hours}
                                        </span>
                                    )}
                                    {salon.phone && (
                                        <a href={`tel:${salon.phone}`} className="text-xs px-2.5 py-1 rounded-full" style={{ background: '#f0f9fc', color: '#0A8CBA' }}>
                                            📞 {salon.phone}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Book CTA banner */}
                    <div
                        className="mx-4 lg:mx-0 rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm"
                        style={{ background: 'linear-gradient(135deg, #0A8CBA 0%, #1ea8d8 100%)' }}
                    >
                        <div>
                            <p className="text-sm font-medium text-white/80">Foglalj időpontot</p>
                            {minPrice != null && (
                                <p className="text-lg font-bold text-white mt-0.5">{minPrice.toLocaleString('hu-HU')} Ft-tól</p>
                            )}
                        </div>
                        <button
                            onClick={() => openBooking(null)}
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                            style={{ background: 'rgba(255,255,255,0.95)', color: '#0A8CBA' }}
                        >
                            Foglalás
                        </button>
                    </div>

                    {/* Services grouped by provider */}
                    {(salon.providers || []).length > 0 && (
                        <div className="bg-white rounded-3xl shadow-sm px-5 py-5 mx-4 lg:mx-0">
                            <h2 className="text-base font-bold mb-4" style={{ color: '#0d2d3a' }}>Szolgáltatások</h2>
                            <div className="flex flex-col gap-5">
                                {salon.providers.map(provider => (
                                    provider.services && provider.services.length > 0 && (
                                        <div key={provider.id}>
                                            {/* Provider header */}
                                            <div className="flex items-center gap-3 mb-3">
                                                {provider.profile_picture_url
                                                    ? <img src={`${API_URL}${provider.profile_picture_url}`} alt={provider.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                                                    : <AvatarFallback name={provider.name} size={36} />
                                                }
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold truncate" style={{ color: '#0d2d3a' }}>{provider.name}</p>
                                                    {provider.average_rating != null && (
                                                        <StarRow rating={provider.average_rating} count={provider.rating_count} />
                                                    )}
                                                </div>
                                            </div>
                                            {/* Services for this provider */}
                                            <div className="flex flex-col gap-2 pl-3 border-l-2" style={{ borderColor: '#7DE1F4' }}>
                                                {provider.services.map(service => (
                                                    <div
                                                        key={service.id}
                                                        className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl"
                                                        style={{ background: '#f8fdff' }}
                                                    >
                                                        {service.images && service.images.length > 0 && (
                                                            <img
                                                                src={`${API_URL}${service.images[0].image_url}`}
                                                                alt={service.name}
                                                                className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                                                            />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate" style={{ color: '#0d2d3a' }}>{service.name}</p>
                                                            <p className="text-xs mt-0.5" style={{ color: '#0A8CBA' }}>
                                                                {service.duration_minutes} perc · {service.price ? service.price.toLocaleString('hu-HU') + ' Ft' : '–'}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => openBooking(provider.id)}
                                                            className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-all active:scale-95"
                                                            style={{ background: '#0A8CBA', color: '#fff' }}
                                                        >
                                                            Foglalás
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Team section */}
                    {(salon.providers || []).length > 0 && (
                        <div className="bg-white rounded-3xl shadow-sm py-5 mx-4 lg:mx-0">
                            <h2 className="text-base font-bold mb-4 px-5" style={{ color: '#0d2d3a' }}>Csapat</h2>
                            <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-hide">
                                {salon.providers.map(provider => (
                                    <div
                                        key={provider.id}
                                        onClick={() => openBooking(provider.id)}
                                        className="flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl w-36 cursor-pointer active:scale-95 transition-transform"
                                        style={{ background: '#f0f9fc' }}
                                    >
                                        {provider.profile_picture_url
                                            ? <img src={`${API_URL}${provider.profile_picture_url}`} alt={provider.name} className="w-14 h-14 rounded-full object-cover" />
                                            : <AvatarFallback name={provider.name} size={56} />
                                        }
                                        <p className="text-sm font-semibold text-center leading-tight" style={{ color: '#0d2d3a' }}>{provider.name}</p>
                                        {provider.average_rating != null && (
                                            <div className="flex items-center gap-1">
                                                <StarFilledIcon className="w-3 h-3 text-amber-400" />
                                                <span className="text-xs" style={{ color: '#0A8CBA' }}>{Number(provider.average_rating).toFixed(1)}</span>
                                            </div>
                                        )}
                                        {provider.services && provider.services.length > 0 && (
                                            <p className="text-xs text-center text-gray-400 leading-tight">
                                                {provider.services.slice(0, 2).map(s => s.name).join(', ')}
                                                {provider.services.length > 2 && ` +${provider.services.length - 2}`}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* About section */}
                    {(salon.description || salon.address || salon.email || (salon.open_days && salon.open_days.length > 0)) && (
                        <div className="bg-white rounded-3xl shadow-sm px-5 py-5 mx-4 lg:mx-0">
                            <h2 className="text-base font-bold mb-3" style={{ color: '#0d2d3a' }}>A szalonról</h2>
                            {salon.description && (
                                <p className="text-sm text-gray-600 leading-relaxed mb-4">{salon.description}</p>
                            )}
                            {salon.open_days && salon.open_days.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-xs font-semibold mb-2" style={{ color: '#0A8CBA' }}>Nyitvatartás</p>
                                    <div className="flex gap-1.5 flex-wrap">
                                        {[1,2,3,4,5,6,0].map(day => {
                                            const isOpen = salon.open_days.includes(day);
                                            return (
                                                <span
                                                    key={day}
                                                    className="text-xs px-2 py-1 rounded-lg font-medium"
                                                    style={{
                                                        background: isOpen ? '#0A8CBA' : '#f0f9fc',
                                                        color: isOpen ? '#fff' : '#9ca3af',
                                                    }}
                                                >
                                                    {HU_DAYS_SHORT[day]}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            {salon.address && (
                                <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                                    <LocationIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#0A8CBA' }} />
                                    <span>{salon.address}</span>
                                </div>
                            )}
                            {salon.email && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span style={{ color: '#0A8CBA' }}>✉</span>
                                    <a href={`mailto:${salon.email}`} className="hover:underline">{salon.email}</a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Reviews section */}
                    {(salon.average_rating != null || reviews.length > 0) && (
                        <div className="bg-white rounded-3xl shadow-sm px-5 py-5 mx-4 lg:mx-0">
                            <h2 className="text-base font-bold mb-4" style={{ color: '#0d2d3a' }}>Értékelések</h2>

                            {/* Summary row */}
                            {salon.average_rating != null && (
                                <div className="flex items-center gap-5 mb-5">
                                    <div className="text-center">
                                        <p className="text-5xl font-bold" style={{ color: '#0A8CBA' }}>{Number(salon.average_rating).toFixed(1)}</p>
                                        <StarRow rating={salon.average_rating} />
                                        <p className="text-xs text-gray-400 mt-1">{salon.rating_count || 0} értékelés</p>
                                    </div>
                                    <div className="flex-1">
                                        {[5,4,3,2,1].map(star => {
                                            const fill = Math.max(0, Math.min(100, (salon.average_rating / 5) * 100 - (5 - star) * 10));
                                            return (
                                                <div key={star} className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs w-3 text-gray-400">{star}</span>
                                                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#f0f9fc' }}>
                                                        <div className="h-full rounded-full" style={{ width: `${fill}%`, background: '#0A8CBA' }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Individual reviews */}
                            {reviews.length > 0 && (
                                <div className="flex flex-col gap-3">
                                    {reviews.map(review => (
                                        <div key={review.id} className="rounded-2xl p-4" style={{ background: '#f0f9fc' }}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                                        style={{ background: '#0A8CBA' }}
                                                    >
                                                        {review.profile_picture_url ? (
                                                            <img src={`${API_URL}${review.profile_picture_url}`} alt={review.user_name} className="w-full h-full object-cover rounded-full" />
                                                        ) : (
                                                            review.user_name[0].toUpperCase()
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-semibold" style={{ color: '#0d2d3a' }}>{review.user_name}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {[1,2,3,4,5].map(i => (
                                                        <StarFilledIcon key={i} className={`w-3.5 h-3.5 ${i <= review.salon_rating ? 'text-amber-400' : 'text-gray-200'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            {review.salon_comment && (
                                                <p className="text-sm text-gray-600 leading-relaxed">{review.salon_comment}</p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-2">
                                                {new Date(review.created_at).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {reviews.length === 0 && salon.rating_count > 0 && (
                                <p className="text-sm text-gray-400 text-center py-2">Még nincsenek szöveges értékelések.</p>
                            )}
                        </div>
                    )}

                    {/* Map section */}
                    {salon.latitude && salon.longitude && (
                        <div className="bg-white rounded-3xl shadow-sm overflow-hidden mx-4 lg:mx-0" style={{ position: 'relative', zIndex: 0 }}>
                            <div className="px-5 pt-5 pb-3">
                                <h2 className="text-base font-bold" style={{ color: '#0d2d3a' }}>Helyszín</h2>
                            </div>
                            <BaseMap
                                center={[salon.latitude, salon.longitude]}
                                zoom={15}
                                height="200px"
                                scrollWheelZoom={false}
                                attributionControl={false}
                            >
                                <Marker position={[salon.latitude, salon.longitude]} />
                            </BaseMap>
                        </div>
                    )}

                </div>

                {/* ── RIGHT SIDEBAR (desktop only) ──────────────────────── */}
                <div className="hidden lg:flex flex-col gap-4 lg:pt-0 sticky top-6 self-start max-h-screen overflow-y-auto pb-8">

                    {/* Booking card */}
                    <div className="bg-white rounded-3xl shadow-sm p-5">
                        <h3 className="text-base font-bold mb-1" style={{ color: '#0d2d3a' }}>Foglalj időpontot</h3>
                        {minPrice != null && (
                            <p className="text-2xl font-bold mb-4" style={{ color: '#0A8CBA' }}>{minPrice.toLocaleString('hu-HU')} Ft-tól</p>
                        )}
                        <button
                            onClick={() => openBooking(null)}
                            className="w-full py-3 rounded-2xl text-white font-semibold text-sm transition-all active:scale-95"
                            style={{ background: 'linear-gradient(135deg, #0A8CBA 0%, #1ea8d8 100%)' }}
                        >
                            Foglalás
                        </button>
                        <button
                            onClick={toggleSave}
                            disabled={savingToggle}
                            className="w-full py-3 rounded-2xl font-semibold text-sm mt-3 transition-all border"
                            style={{ borderColor: '#cceaf4', color: saved ? '#0A8CBA' : '#0d2d3a', background: saved ? '#f0f9fc' : 'transparent' }}
                        >
                            {saved ? '♥ Mentve' : '♡ Mentés'}
                        </button>
                    </div>

                    {/* Sidebar map */}
                    {salon.latitude && salon.longitude && (
                        <div className="bg-white rounded-3xl shadow-sm overflow-hidden" style={{ position: 'relative', zIndex: 0 }}>
                            <BaseMap
                                center={[salon.latitude, salon.longitude]}
                                zoom={14}
                                height="220px"
                                scrollWheelZoom={false}
                                attributionControl={false}
                            >
                                <Marker position={[salon.latitude, salon.longitude]} />
                            </BaseMap>
                            {salon.address && (
                                <div className="px-4 py-3 flex items-start gap-2 text-sm text-gray-600">
                                    <LocationIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#0A8CBA' }} />
                                    <span>{salon.address}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── STICKY BOTTOM BAR (mobile) ────────────────────────────── */}
            <div
                className="lg:hidden fixed bottom-0 left-0 right-0 flex items-center gap-3 px-4 pb-safe pt-3"
                style={{ background: 'rgba(240,249,252,0.96)', backdropFilter: 'blur(12px)', borderTop: '1px solid #cceaf4', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
            >
                <button
                    onClick={toggleSave}
                    disabled={savingToggle}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl border transition-all flex-shrink-0"
                    style={{ borderColor: '#cceaf4', background: saved ? '#f0f9fc' : '#fff', color: saved ? '#0A8CBA' : '#0d2d3a' }}
                >
                    <SaveIcon filled={saved} className="w-5 h-5" />
                </button>
                <button
                    onClick={() => openBooking(null)}
                    className="flex-1 py-3 rounded-2xl text-white font-semibold text-sm transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #0A8CBA 0%, #1ea8d8 100%)' }}
                >
                    {minPrice != null ? `Foglalás – ${minPrice.toLocaleString('hu-HU')} Ft-tól` : 'Foglalás'}
                </button>
            </div>

            {/* ── BOOKING SHEET ─────────────────────────────────────────── */}
            <BookingSheet
                salon={salon}
                isOpen={bookingOpen}
                onClose={() => setBookingOpen(false)}
                preselectedProviderId={preselectedProviderId}
            />
        </div>
    );
}
