import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { authApi } from '../../auth/auth';
import StarRatingInput from './StarRatingInput';

// Értékelés modal - szalon és szolgáltató értékelése
export default function RatingModal({ appointment, onClose, onSaved }) {
    const [salonRating, setSalonRating] = useState(0);
    const [providerRating, setProviderRating] = useState(0);
    const [salonComment, setSalonComment] = useState('');
    const [providerComment, setProviderComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [isEdit, setIsEdit] = useState(false);
    const [error, setError] = useState(null);

    // Meglévő értékelés betöltése
    useEffect(() => {
        loadExistingRating();
    }, [appointment.id]);

    async function loadExistingRating() {
        try {
            setFetching(true);
            const response = await authApi.get(`/api/user/ratings/appointment/${appointment.id}`);
            const data = await response.json();

            if (data.success && data.rating) {
                setSalonRating(data.rating.salon_rating);
                setProviderRating(data.rating.provider_rating);
                setSalonComment(data.rating.salon_comment || '');
                setProviderComment(data.rating.provider_comment || '');
                setIsEdit(true);
            }
        } catch (err) {
            console.error('Error loading rating:', err);
        } finally {
            setFetching(false);
        }
    }

    async function handleSubmit() {
        if (salonRating === 0 || providerRating === 0) {
            setError('Kérjük, adj értékelést mind a szalonnak, mind a szolgáltatónak!');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await authApi.post('/api/user/ratings', {
                appointmentId: appointment.id,
                salonId: appointment.salon_id,
                providerId: appointment.provider_id,
                salonRating,
                providerRating,
                salonComment: salonComment.trim(),
                providerComment: providerComment.trim()
            });
            const data = await response.json();

            if (data.success) {
                onSaved?.();
                onClose();
            } else {
                setError(data.message || 'Hiba történt az értékelés mentésekor');
            }
        } catch (err) {
            console.error('Rating submit error:', err);
            setError('Hiba történt az értékelés mentésekor');
        } finally {
            setLoading(false);
        }
    }

    // Dátum formázás
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Budapest'
        });
    }

    return createPortal(
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 overflow-y-auto">
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            ></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-amber-50">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-amber-900">
                            {isEdit ? 'Értékelés módosítása' : 'Értékelés'}
                        </h3>
                        <button 
                            onClick={onClose}
                            className="p-1 hover:bg-amber-100 rounded-lg transition-colors text-amber-700"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {fetching ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent mx-auto"></div>
                        <p className="mt-3 text-gray-500 text-sm">Betöltés...</p>
                    </div>
                ) : (
                    <>
                        {/* Appointment info */}
                        <div className="px-6 pt-5 pb-3">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <h4 className="font-semibold text-gray-900">{appointment.salon_name}</h4>
                                <p className="text-sm text-gray-600">{appointment.provider_name} – {appointment.service_name}</p>
                                <p className="text-xs text-gray-500 mt-1">{formatDate(appointment.appointment_start)}</p>
                            </div>
                        </div>

                        {/* Rating form */}
                        <div className="px-6 pb-2 space-y-5">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Salon rating */}
                            <div className="space-y-2">
                                <StarRatingInput
                                    value={salonRating}
                                    onChange={setSalonRating}
                                    label="Szalon értékelése"
                                />
                                <textarea
                                    value={salonComment}
                                    onChange={(e) => setSalonComment(e.target.value)}
                                    placeholder="Vélemény a szalonról (opcionális)..."
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
                                />
                            </div>

                            {/* Provider rating */}
                            <div className="space-y-2">
                                <StarRatingInput
                                    value={providerRating}
                                    onChange={setProviderRating}
                                    label="Szolgáltató értékelése"
                                />
                                <textarea
                                    value={providerComment}
                                    onChange={(e) => setProviderComment(e.target.value)}
                                    placeholder="Vélemény a szolgáltatóról (opcionális)..."
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                Mégse
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || salonRating === 0 || providerRating === 0}
                                className="flex-1 py-2.5 px-4 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                ) : (
                                    isEdit ? 'Módosítás mentése' : 'Értékelés mentése'
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
}
