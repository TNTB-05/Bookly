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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-8 max-h-[90vh] overflow-y-auto">
                {/* Fejléc */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                    <h2 className="text-2xl font-bold text-gray-900">{salon.name}</h2>
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Bezárás"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Tartalom */}
                <div className="p-6 space-y-8">
                    {/* Szalon információk */}
                    <div className="space-y-4">
                        {/* Cím */}
                        <div className="flex items-start gap-3">
                            <div className="text-gray-500 mt-1">
                                <LocationIcon />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Cím</p>
                                <p className="text-gray-900">{salon.address}</p>
                            </div>
                        </div>

                        {/* Típus */}
                        {salon.type && (
                            <div>
                                <p className="text-sm text-gray-500 font-medium mb-1">Típus</p>
                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                    {salon.type}
                                </span>
                            </div>
                        )}

                        {/* Telefonszám */}
                        {salon.phone && (
                            <div>
                                <p className="text-sm text-gray-500 font-medium mb-1">Telefonszám</p>
                                <a href={`tel:${salon.phone}`} className="text-dark-blue hover:underline">
                                    {salon.phone}
                                </a>
                            </div>
                        )}

                        {/* Email */}
                        {salon.email && (
                            <div>
                                <p className="text-sm text-gray-500 font-medium mb-1">Email</p>
                                <a href={`mailto:${salon.email}`} className="text-dark-blue hover:underline">
                                    {salon.email}
                                </a>
                            </div>
                        )}

                        {/* Leírás */}
                        {salon.description && (
                            <div>
                                <p className="text-sm text-gray-500 font-medium mb-2">Leírás</p>
                                <p className="text-gray-700 leading-relaxed">{salon.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Elválasztó */}
                    <div className="border-t border-gray-200"></div>

                    {/* Szolgáltatók */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            Szolgáltatók {salon.providers && `(${salon.providers.length})`}
                        </h3>

                        {salon.providers && salon.providers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {salon.providers.map((provider) => (
                                    <ProviderCard key={provider.id} provider={provider} salonId={salon.id} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-xl">
                                <p className="text-gray-500">Jelenleg nincs elérhető szolgáltató</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Lábléc */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        Bezárás
                    </button>
                </div>
            </div>
        </div>
    );
}
