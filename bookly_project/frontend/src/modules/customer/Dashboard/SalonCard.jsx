// Ikon
import SaveIcon from '../../../icons/SaveIcon';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../../config';

// Szalon kártya komponens - szalon adatainak megjelenítése
export default function SalonCard({ salon, savedSalonIds, toggleSaveSalon, showDistance, compact = false, onCardClick }) {
    const navigate = useNavigate();
    
    // Ellenőrizzük, hogy a szalon mentve van-e
    const isSaved = savedSalonIds.includes(salon.id);

    // Szalon részletek megnyitása
    function handleViewDetails() {
        navigate(`/salon/${salon.id}`);
    }

    return (
        <div
            className={`bg-white/40 backdrop-blur-md ${compact ? 'rounded-xl' : 'rounded-2xl'} shadow-lg border border-white/50 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col ${onCardClick ? 'cursor-pointer' : ''}`}
            onClick={onCardClick}
        >
            {/* Kártya fejléc */}
            <div
                className={`${compact ? 'h-16' : 'h-24'} relative shrink-0`}
                style={
                    salon.banner_image_url
                        ? { backgroundImage: `url(${API_URL + salon.banner_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : { background: `linear-gradient(135deg, ${salon.banner_color || '#3B82F6'} 0%, ${salon.banner_color || '#3B82F6'}dd 100%)` }
                }
            >
                {/* Szalon logo / kezdőbetű */}
                <div className={`absolute ${compact ? '-bottom-7' : '-bottom-10'} left-1/2 transform -translate-x-1/2 z-10`}>
                    <div className={`${compact ? 'w-14 h-14 text-lg' : 'w-20 h-20 text-2xl'} rounded-full border-4 border-white bg-white flex items-center justify-center font-bold text-dark-blue shadow-lg overflow-hidden`}>
                        {salon.logo_url ? (
                            <img src={API_URL + salon.logo_url} alt={salon.name} className="w-full h-full object-cover" />
                        ) : (
                            salon.name.charAt(0).toUpperCase()
                        )}
                    </div>
                </div>

                {/* Mentés gomb */}
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Megakadályozzuk a kártya kattintás eseményét
                        toggleSaveSalon(salon.id);
                    }}
                    className={`absolute top-2 left-2 p-2 rounded-lg backdrop-blur-sm transition-all ${
                        isSaved 
                            ? 'bg-yellow-400 text-white' 
                            : 'bg-white/90 text-gray-600 hover:bg-white hover:text-dark-blue'
                    }`}
                    title={isSaved ? 'Eltávolítás a mentett helyekből' : 'Mentés'}
                >
                    <SaveIcon filled={isSaved} className="w-4 h-4" />
                </button>

                {/* Távolság jelvény - csak akkor jelenik meg, ha van távolság adat */}
                {showDistance && salon.distance !== null && salon.distance !== undefined && (
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-semibold text-dark-blue">
                        📍 {salon.distance} km
                    </div>
                )}
            </div>

            {/* Kártya tartalom */}
            <div className={`${compact ? 'pt-9 px-3 pb-3' : 'pt-12 px-4 pb-4'} text-center flex flex-col flex-1`}>
                {/* Szalon név - fixed height for consistency */}
                <div className={`${compact ? 'mb-1' : 'mb-3'} h-14 flex items-center justify-center`}>
                    <h3 className={`${compact ? 'text-sm' : 'text-lg'} font-bold text-gray-900 line-clamp-2 leading-snug px-2`}>
                        {salon.name}
                    </h3>
                </div>
                
                {/* Cím - 1 soros */}
                <div className={compact ? 'mb-1' : 'mb-3'}>
                    <p className="text-xs text-gray-500 line-clamp-1 min-h-5">
                        {salon.address}
                    </p>
                </div>
                
                {/* Szolgáltatók száma - mindig látható */}
                <div className={compact ? 'mb-1' : 'mb-3'}>
                    <p className="text-xs text-gray-400 min-h-5">
                        {salon.providers && salon.providers.length > 0 
                            ? `${salon.providers.length} szolgáltató` 
                            : '0 szolgáltató'}
                    </p>
                </div>
                
                {/* Értékelés csillagokkal - mindig látható */}
                <div className={`flex items-center justify-center text-yellow-400 text-base ${compact ? 'mb-2' : 'mb-4'} min-h-7`}>
                    {salon.average_rating > 0 ? (
                        <>
                            <span className="tracking-wide">
                                {'★'.repeat(Math.round(salon.average_rating))}
                                {'☆'.repeat(5 - Math.round(salon.average_rating))}
                            </span>
                            <span className="text-gray-700 text-sm ml-2 font-medium">
                                {Number(salon.average_rating).toFixed(2)}
                            </span>
                            <span className="text-gray-400 text-xs ml-1">
                                ({salon.rating_count})
                            </span>
                        </>
                    ) : (
                        <span className="text-gray-400 text-xs">Még nincs értékelés</span>
                    )}
                </div>
                
                {/* Spacer - pushes button to bottom */}
                <div className="flex-1"></div>
                
                {/* Megnézem gomb - mindig alul */}
                <button
                    onClick={handleViewDetails}
                    className={`w-full ${compact ? 'py-2 text-sm' : 'py-2.5'} bg-dark-blue text-white rounded-xl font-medium hover:bg-blue-800 transition-colors shadow-sm`}
                >
                    Megnézem
                </button>
            </div>
        </div>
    );
}
