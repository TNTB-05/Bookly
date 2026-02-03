import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Szolgáltató kártya komponens - szolgáltató adatainak megjelenítése
export default function ProviderCard({ provider, salonId }) {
    const navigate = useNavigate();
    const [showServices, setShowServices] = useState(false);

    // Foglalás gomb kezelése
    function handleBooking() {
        // TODO: Navigálás a foglalási oldalra a szolgáltató és szalon ID-vel
        navigate(`/dashboard/booking/${salonId}/${provider.id}`);
    }

    return (
        <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-lg hover:border-dark-blue transition-all duration-300">
            {/* Kártya fejléc */}
            <div className="h-20 bg-linear-to-r from-blue-500 to-dark-blue relative">
                {/* Szolgáltató kezdőbetű */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="w-16 h-16 rounded-full border-4 border-white bg-white flex items-center justify-center text-2xl font-bold text-dark-blue shadow-md">
                        {provider.name.charAt(0).toUpperCase()}
                    </div>
                </div>

                {/* Manager jelvény - csak akkor jelenik meg, ha valóban manager */}
                {provider.isManager === 1 && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                        👑 Manager
                    </div>
                )}
            </div>

            {/* Kártya tartalom */}
            <div className="pt-10 p-4 text-center space-y-3">
                {/* Név */}
                <h4 className="text-lg font-bold text-gray-900">{provider.name}</h4>

                {/* Szerepkör */}
                {provider.role && (
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                        {provider.role}
                    </p>
                )}

                {/* Leírás */}
                {provider.description && (
                    <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                        {provider.description}
                    </p>
                )}

                {/* Kapcsolat */}
                <div className="space-y-1">
                    {provider.phone && (
                        <p className="text-xs text-gray-500">
                            📞 {provider.phone}
                        </p>
                    )}
                    {provider.email && (
                        <p className="text-xs text-gray-500 truncate" title={provider.email}>
                            ✉️ {provider.email}
                        </p>
                    )}
                </div>

                {/* Szolgáltatások megjelenítése */}
                {provider.services && provider.services.length > 0 && (
                    <div className="pt-2 border-t border-gray-200">
                        <button
                            onClick={() => setShowServices(!showServices)}
                            className="w-full text-sm text-dark-blue font-medium hover:text-blue-800 transition-colors py-2 flex items-center justify-center gap-2"
                        >
                            {showServices ? '▼' : '▶'} {provider.services.length} szolgáltatás megtekintése
                        </button>
                        
                        {showServices && (
                            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                                {provider.services.map((service) => (
                                    <div
                                        key={service.id}
                                        className="bg-gray-50 rounded-lg p-3 text-left hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h5 className="text-sm font-semibold text-gray-900 truncate">
                                                    {service.name}
                                                </h5>
                                                {service.description && (
                                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                        {service.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-bold text-dark-blue">
                                                    {service.price} Ft
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {service.duration_minutes} perc
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Foglalás gomb */}
                <button
                    onClick={handleBooking}
                    className="w-full py-2.5 bg-dark-blue text-white rounded-xl font-medium hover:bg-blue-800 transition-colors mt-4 shadow-sm hover:shadow-md"
                >
                    Foglalás
                </button>
            </div>
        </div>
    );
}
