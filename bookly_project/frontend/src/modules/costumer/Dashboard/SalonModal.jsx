import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CloseIcon from '../../../icons/CloseIcon';
import LocationIcon from '../../../icons/LocationIcon';
import ProviderCard from './ProviderCard';

// Szalon részletek modal - szalon információk és szolgáltatók megjelenítése
export default function SalonModal() {
    const { salonId } = useParams();
    const navigate = useNavigate();
    const [salon, setSalon] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Szalon adatok betöltése
    useEffect(() => {
        loadSalonDetails();
    }, [salonId]);

    // ESC billentyű kezelése
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                navigate(-1);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [navigate]);

    // Szalon részletek lekérése
    async function loadSalonDetails() {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:3000/api/search/salon/${salonId}`);
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

    // Modal bezárása háttérre kattintáskor
    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            navigate(-1);
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
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-5xl my-8 max-h-[90vh] flex flex-col border border-white/50 overflow-hidden">
                {/* Fejléc - Kártya stílusú */}
                <div className="relative shrink-0">
                    {/* Egyedi színű banner */}
                    <div 
                        className="h-32 rounded-t-3xl relative"
                        style={{ 
                            background: salon.banner_color 
                                ? `linear-gradient(135deg, ${salon.banner_color} 0%, ${salon.banner_color}dd 100%)` 
                                : 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)'
                        }}
                    >
                        {/* Szalon logó vagy kezdőbetű - középen */}
                        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 z-20">
                            <div className="w-24 h-24 rounded-full border-4 border-white bg-white flex items-center justify-center shadow-xl overflow-hidden">
                                {salon.logo_url ? (
                                    <img 
                                        src={salon.logo_url} 
                                        alt={salon.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-4xl font-bold text-dark-blue">
                                        {salon.name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Bezárás gomb */}
                        <button
                            onClick={() => navigate(-1)}
                            className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-lg transition-colors backdrop-blur-sm shadow-md z-10"
                            title="Bezárás"
                        >
                            <CloseIcon />
                        </button>
                        
                        {/* Státusz jelvény */}
                        {salon.status && (
                            <div className="absolute top-4 left-4 px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-semibold shadow-md z-10">
                                {salon.status === 'open' ? '✓ Nyitva' : salon.status}
                            </div>
                        )}
                    </div>
                    
                    {/* Szalon név - a kör alatt */}
                    <div className="pt-16 pb-6 text-center bg-white/80 backdrop-blur-sm">
                        <h2 className="text-3xl font-bold text-gray-900">{salon.name}</h2>
                        {salon.type && (
                            <span className="inline-block mt-2 px-4 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                {salon.type}
                            </span>
                        )}
                    </div>
                </div>

                {/* Tartalom - Görgethető rész */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-white/70 backdrop-blur-sm">
                    {/* Leírás */}
                    {salon.description && (
                        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Rólunk</h3>
                            <p className="text-gray-700 leading-relaxed">{salon.description}</p>
                        </div>
                    )}

                    {/* Munkatársak */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            Munkatársak {salon.providers && `(${salon.providers.length})`}
                        </h3>

                        {salon.providers && salon.providers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {salon.providers.map((provider) => (
                                    <ProviderCard key={provider.id} provider={provider} salonId={salon.id} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-gray-200">
                                <p className="text-gray-500">Jelenleg nincs elérhető munkatárs</p>
                            </div>
                        )}
                    </div>

                    {/* Szalon információk - Kártya stílusban */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50 space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Elérhetőségek</h3>
                        
                        {/* Cím */}
                        <div className="flex items-start gap-3 p-3 bg-white/50 rounded-xl hover:bg-white/70 transition-colors">
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Cím</p>
                                <p className="text-gray-900 font-medium">{salon.address}</p>
                            </div>
                        </div>

                        {/* Telefonszám */}
                        {salon.phone && (
                            <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl hover:bg-white/70 transition-colors">
                                <span className="text-2xl">📞</span>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Telefonszám</p>
                                    <a href={`tel:${salon.phone}`} className="text-dark-blue hover:underline font-medium">
                                        {salon.phone}
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        {salon.email && (
                            <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl hover:bg-white/70 transition-colors">
                                <span className="text-2xl">✉️</span>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Email</p>
                                    <a href={`mailto:${salon.email}`} className="text-dark-blue hover:underline font-medium break-all">
                                        {salon.email}
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Lábléc */}
                <div className="shrink-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 px-6 py-4 rounded-b-3xl">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full py-3 bg-dark-blue text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors shadow-md hover:shadow-lg"
                    >
                        Bezárás
                    </button>
                </div>
            </div>
        </div>
    );
}
