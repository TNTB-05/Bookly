import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { authApi } from '../../../auth/auth';
import { SkeletonCard, SkeletonAvatar, SkeletonText } from '../../../../components/skeletons';

const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
};

const getAvatarColor = (name) => {
    if (!name) return 'from-gray-400 to-gray-500';
    const colors = ['from-blue-400 to-blue-600', 'from-purple-400 to-purple-600', 'from-green-400 to-green-600', 'from-orange-400 to-orange-600', 'from-pink-400 to-pink-600', 'from-teal-400 to-teal-600'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

const getStatusColor = (status) => {
    switch (status) {
        case 'scheduled': return 'bg-blue-100 text-blue-700';
        case 'completed': return 'bg-green-100 text-green-700';
        case 'canceled': return 'bg-red-100 text-red-700';
        case 'no_show': return 'bg-gray-100 text-gray-700';
        default: return 'bg-gray-100 text-gray-700';
    }
};

const getStatusText = (status) => {
    switch (status) {
        case 'scheduled': return 'Megerősítve';
        case 'completed': return 'Teljesítve';
        case 'canceled': return 'Törölve';
        case 'no_show': return 'Nem jelent meg';
        default: return status;
    }
};

const CustomerDetailDrawer = ({ customer, onClose, onRemind, onOpenChat }) => {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [reminding, setReminding] = useState(false);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Budapest' }) : '–';
    const formatDateShort = (d) => d ? new Date(d).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Budapest' }) : '–';
    const formatPrice = (p) => new Intl.NumberFormat('hu-HU').format(p) + ' Ft';

    const handleRemind = async () => {
        setReminding(true);
        await onRemind(customer);
        setReminding(false);
    };

    useEffect(() => {
        if (!customer) { setDetail(null); return; }
        const fetchDetail = async () => {
            setLoading(true);
            setDetail(null);
            try {
                let url;
                if (customer.is_guest) {
                    url = `/api/provider/calendar/customers/guest?email=${encodeURIComponent(customer.email)}`;
                } else {
                    url = `/api/provider/calendar/customers/registered/${customer.id}`;
                }
                const res = await authApi.get(url);
                const data = await res.json();
                if (data.success) setDetail(data.customer);
            } catch (e) {
                console.error('Error fetching customer detail:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [customer]);

    const isOpen = !!customer;

    return createPortal(
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/30 z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white/90 backdrop-blur-xl shadow-2xl z-[101] flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-dark-blue">Ügyfél részletei</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {loading ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <SkeletonAvatar size="lg" />
                                <div className="flex-1"><SkeletonText lines={3} /></div>
                            </div>
                            {Array(3).fill(0).map((_, i) => (
                                <SkeletonCard key={i} className="p-4">
                                    <SkeletonText lines={2} />
                                </SkeletonCard>
                            ))}
                        </div>
                    ) : detail ? (
                        <>
                            {/* Profile header */}
                            <div className="flex items-center gap-4">
                                {detail.profile_picture_url ? (
                                    <img src={`${apiUrl}${detail.profile_picture_url}`} alt={detail.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-lg" />
                                ) : (
                                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarColor(detail.name)} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                                        {getInitials(detail.name)}
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-bold text-gray-800">{detail.name || 'Ismeretlen'}</h3>
                                        {detail.is_guest ? (
                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Vendég</span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Regisztrált</span>
                                        )}
                                    </div>
                                    {detail.email && <p className="text-sm text-gray-500 mt-0.5">{detail.email}</p>}
                                    {detail.phone && <p className="text-sm text-gray-500">{detail.phone}</p>}
                                </div>
                            </div>

                            {/* Reminder button */}
                            {detail && (
                                <button
                                    onClick={handleRemind}
                                    disabled={reminding || !detail.email}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium text-sm rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={!detail.email ? 'Nincs email cím' : undefined}
                                >
                                    {reminding ? (
                                        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                        </svg>
                                    )}
                                    Emlékeztető küldése
                                </button>
                            )}

                            {/* Chat button (registered customers only) */}
                            {onOpenChat && (
                                <button
                                    onClick={onOpenChat}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm rounded-xl transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                                    </svg>
                                    Üzenet küldése
                                </button>
                            )}

                            {/* Summary stats */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-blue-50 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-bold text-dark-blue">{detail.total_bookings}</p>
                                    <p className="text-xs text-gray-500 mt-1">Foglalás</p>
                                </div>
                                <div className="bg-green-50 rounded-xl p-3 text-center">
                                    <p className="text-lg font-bold text-green-700">{formatPrice(detail.total_spent)}</p>
                                    <p className="text-xs text-gray-500 mt-1">Összesen</p>
                                </div>
                                <div className="bg-purple-50 rounded-xl p-3 text-center">
                                    <p className="text-xs font-semibold text-purple-700">{formatDate(detail.first_booking_date)}</p>
                                    <p className="text-xs text-gray-500 mt-1">Első foglalás</p>
                                </div>
                            </div>

                            {/* Rating */}
                            {detail.rating && (
                                <div className="bg-yellow-50 rounded-xl p-4">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Értékelés</h4>
                                    <div className="flex items-center gap-1 mb-2">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={i < detail.rating.rating ? 'currentColor' : 'none'} stroke="currentColor" className={`w-5 h-5 ${i < detail.rating.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                            </svg>
                                        ))}
                                        <span className="text-sm text-gray-500 ml-1">{detail.rating.rating}/5</span>
                                    </div>
                                    {detail.rating.comment && <p className="text-sm text-gray-600 italic">"{detail.rating.comment}"</p>}
                                </div>
                            )}

                            {/* Booking history */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Foglalási előzmények</h4>
                                {detail.appointments && detail.appointments.length > 0 ? (
                                    <div className="space-y-2">
                                        {detail.appointments.map((apt) => (
                                            <div key={apt.id} className="flex items-center justify-between p-3 bg-white/70 rounded-xl border border-gray-100">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">{apt.service_name}</p>
                                                    <p className="text-xs text-gray-500">{formatDateShort(apt.appointment_start)}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-dark-blue">{formatPrice(apt.price)}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>{getStatusText(apt.status)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 text-center py-4">Nincs foglalási előzmény</p>
                                )}
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </>,
        document.body
    );
};

export default CustomerDetailDrawer;
