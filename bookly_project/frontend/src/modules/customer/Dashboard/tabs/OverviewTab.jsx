import { useState, useRef, useEffect } from 'react';
import { searchSalons, getSuggestions } from '../../../../services/searchService';
import { useDebounce } from '../../../../hooks/useDebounce';

// Ikonok
import SearchIcon from '../../../../icons/SearchIcon';
import LocationIcon from '../../../../icons/LocationIcon';

import LeftArrowIcon from '../../../../icons/LeftArrowIcon';
import RightArrowIcon from '../../../../icons/RightArrowIcon';

// Komponensek
import SalonCard from '../SalonCard';
import SearchSuggestions from './SearchSuggestions';

// Áttekintés tab - keresés, kiemelt szalonok és szolgáltatások
export default function OverviewTab({
    setActiveTab,
    serviceTypes,
    topRatedSalons,
    savedSalonIds,
    toggleSaveSalon,
    loadTopRatedSalons
}) {
    // UseState változók a kereséshez
    const [searchQuery, setSearchQuery] = useState('');
    const [serviceFilter, setServiceFilter] = useState('all');
    const [locationSearch, setLocationSearch] = useState('');
    const [userLocation, setUserLocation] = useState(null);
    const [searchActive, setSearchActive] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [showAllFeatured, setShowAllFeatured] = useState(false);
    const [salonLimit, setSalonLimit] = useState(12);
    const [recentReviews, setRecentReviews] = useState([]);
    const carouselRef = useRef(null);
    
    // Suggestions state
    const [suggestions, setSuggestions] = useState({ salons: [], serviceTypes: [] });
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchContainerRef = useRef(null);
    
    // Legújabb értékelések betöltése
    useEffect(() => {
        async function fetchRecentReviews() {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/search/recent-reviews?limit=8`);
                const data = await response.json();
                if (data.success) {
                    setRecentReviews(data.reviews);
                }
            } catch (error) {
                console.error('Hiba a legújabb értékelések betöltésekor:', error);
            }
        }
        fetchRecentReviews();
    }, []);

    // Debounce search query for suggestions
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    
    // Fetch suggestions when debounced search query changes
    useEffect(() => {
        async function fetchSuggestions() {
            if (debouncedSearchQuery && debouncedSearchQuery.trim().length >= 2) {
                const results = await getSuggestions(debouncedSearchQuery);
                setSuggestions(results);
                setShowSuggestions(true);
            } else {
                setSuggestions({ salons: [], serviceTypes: [] });
                setShowSuggestions(false);
            }
        }

        fetchSuggestions();
    }, [debouncedSearchQuery]);
    
    // Handle selecting a salon suggestion
    function handleSelectSalon(salon) {
        setSearchQuery(salon.name);
        setShowSuggestions(false);
    }

    // Handle selecting a service type suggestion
    function handleSelectServiceType(type) {
        setServiceFilter(type);
        setSearchQuery(''); // Clear search input when selecting a service type
        setShowSuggestions(false);
    }

    // Close suggestions dropdown
    function handleCloseSuggestions() {
        setShowSuggestions(false);
    }

    // Szalonok keresése a megadott feltételek alapján
    async function handleSearch() {
        const hasSearchQuery = searchQuery.trim().length > 0;
        const hasLocationSearch = locationSearch.trim().length > 0;
        const hasServiceFilter = serviceFilter !== 'all';
        
        if (!hasSearchQuery && !hasLocationSearch && !hasServiceFilter) {
            setSearchActive(true);
            setSearchResults([]);
            return;
        }

        setSearchActive(true);

        const results = await searchSalons({
            searchQuery,
            locationSearch,
            serviceFilter,
            userLocation
        });

        setSearchResults(results || []);
    }

    // Felhasználó aktuális GPS pozíciójának lekérése
    function handleGetCurrentLocation() {
        if (!navigator.geolocation) {
            alert('A böngésző nem támogatja a helymeghatározást');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ latitude, longitude });

                try {
                    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                    const response = await fetch(`${apiUrl}/api/search/reverse-geocode`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ latitude, longitude })
                    });
                    const data = await response.json();
                    
                    if (data.success) {
                        setLocationSearch(data.address);
                    } else {
                        setLocationSearch(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                    }
                } catch (error) {
                    console.error('Fordított geokódolás sikertelen:', error);
                    setLocationSearch(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                }
            },
            (error) => {
                console.error('Helymeghatározási hiba:', error);
                alert('Nem sikerült lekérni a helyzetet. Kérjük, engedélyezd a helymeghatározást.');
            }
        );
    }

    // === KARUSSZEL ÉS LAPOZÁS FUNKCIÓK ===

    /**
     * Karusszel görgetése balra vagy jobbra
     * @param {string} direction - Görgetés iránya ('left' vagy 'right')
     */
    function scrollCarousel(direction) {
        if (carouselRef.current) {
            const cardWidth = 320; // w-80 = 320px
            const gap = 24; // gap-6 = 24px
            const scrollAmount = cardWidth + gap;
            const newScrollPosition = carouselRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
            carouselRef.current.scrollTo({
                left: newScrollPosition,
                behavior: 'smooth'
            });
        }
    }

    // További szalonok betöltése
    function handleLoadMore() {
        const newLimit = salonLimit + 12;
        setSalonLimit(newLimit);
        loadTopRatedSalons(newLimit);
    }

    // Keresés visszaállítása alapállapotba
    function resetSearch() {
        setSearchActive(false);
        setSearchQuery('');
        setLocationSearch('');
        setServiceFilter('all');
        setSearchResults([]);
        setUserLocation(null);
    }

    return (
        <div>
            {/* Hero Section */}
            <div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                    <div className="text-center">
                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-dark-blue">
                            Találd meg a tökéletes szolgáltatót
                        </h1>
                        <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
                            Foglalj időpontot a legjobb szakemberekhez egyszerűen és gyorsan
                        </p>

                        {/* Enhanced Search Bar */}
                        <div className="max-w-4xl mx-auto space-y-3">
                            {/* First Line: Search Bar + Service Filter */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                {/* Search Bar with Suggestions */}
                                <div ref={searchContainerRef} className="flex-1 relative">
                                    <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-white/50 overflow-hidden">
                                        <div className="pl-4">
                                            <SearchIcon />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Keress szolgáltatót vagy szolgáltatást..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSearch();
                                                    setShowSuggestions(false);
                                                }
                                            }}
                                            onFocus={() => {
                                                if (suggestions.salons.length > 0 || suggestions.serviceTypes.length > 0) {
                                                    setShowSuggestions(true);
                                                }
                                            }}
                                            className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none bg-transparent"
                                        />
                                    </div>
                                    
                                    {/* Search Suggestions Dropdown */}
                                    <SearchSuggestions
                                        suggestions={suggestions}
                                        onSelectSalon={handleSelectSalon}
                                        onSelectServiceType={handleSelectServiceType}
                                        onClose={handleCloseSuggestions}
                                        isVisible={showSuggestions}
                                    />
                                </div>

                                {/* Service Filter */}
                                <div className="w-full sm:w-64">
                                    <select
                                        value={serviceFilter}
                                        onChange={(e) => setServiceFilter(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-white/50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                                    >
                                        <option value="all">Összes szolgáltatás</option>
                                        {serviceTypes.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Second Line: Location + Jelenlegi helyzetem + Keresés */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                {/* Location Input */}
                                <div className="flex-1 flex items-center bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-white/50 overflow-hidden">
                                    <div className="pl-4 text-gray-500">
                                        <LocationIcon />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Helyszín (pl. Budapest, sample street 12, 1111)"
                                        value={locationSearch}
                                        onChange={(e) => {
                                            setLocationSearch(e.target.value);
                                            if (userLocation) {
                                                setUserLocation(null);
                                            }
                                        }}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none bg-transparent"
                                    />
                                </div>

                                {/* Jelenlegi helyzetem Button */}
                                <button
                                    onClick={handleGetCurrentLocation}
                                    className="px-4 py-3 bg-white/80 backdrop-blur-sm text-dark-blue rounded-xl font-medium hover:bg-white transition-colors whitespace-nowrap shadow-md border border-white/50"
                                    title="Jelenlegi helyzetem használata"
                                >
                                    📍 Jelenlegi helyzetem
                                </button>

                                {/* Keresés Button */}
                                <button
                                    onClick={handleSearch}
                                    className="px-8 py-3 bg-dark-blue text-white font-semibold hover:bg-blue-800 transition-colors rounded-xl shadow-md"
                                >
                                    Keresés
                                </button>
                            </div>

                            {/* Reset Search Button */}
                            {searchActive && (
                                <button
                                    onClick={resetSearch}
                                    className="text-dark-blue font-medium hover:text-blue-800 transition-colors"
                                >
                                    ✕ Keresés törlése
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Keresési eredmények - Show when search is active */}
            {searchActive && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-dark-blue">Keresési eredmények</h2>
                            <p className="text-gray-600 mt-1">{searchResults.length} találat</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {searchResults.map((salon) => (
                            <SalonCard
                                key={salon.id}
                                salon={salon}
                                savedSalonIds={savedSalonIds}
                                toggleSaveSalon={toggleSaveSalon}
                                showDistance={true}
                            />
                        ))}
                        
                        {/* Empty state */}
                        {searchResults.length === 0 && (
                            <div className="col-span-full text-center py-12 bg-white/40 backdrop-blur-md rounded-xl border border-white/50">
                                {!searchQuery.trim() && !locationSearch.trim() && serviceFilter === 'all' ? (
                                    <div>
                                        <p className="text-gray-700 font-medium text-lg mb-2">Keresési feltétel szükséges</p>
                                        <p className="text-gray-500">Kérjük, adj meg egy szalon nevet, válassz szolgáltatást vagy add meg a helyzeted!</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">Nincs találat a keresési feltételeknek megfelelően</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Kiemelt szalonok - Always visible */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-dark-blue">Kiemelt szalonok</h2>
                        <p className="text-gray-600 mt-1">A legjobban értékelt partnereink</p>
                    </div>
                    <button
                        onClick={() => setShowAllFeatured(!showAllFeatured)}
                        className="text-dark-blue font-medium hover:text-blue-800 flex items-center transition-colors"
                    >
                        {showAllFeatured ? 'Kevesebb mutatása' : 'Összes megtekintése'}
                        <RightArrowIcon />
                    </button>
                </div>
                
                {!showAllFeatured ? (
                    /* Carousel view */
                    <div className="relative group">
                        {/* Left Arrow */}
                        <button
                            onClick={() => scrollCarousel('left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                            aria-label="Scroll left"
                        >
                            <LeftArrowIcon />
                        </button>

                        {/* Right Arrow */}
                        <button
                            onClick={() => scrollCarousel('right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                            aria-label="Scroll right"
                        >
                            <RightArrowIcon/>
                        </button>

                        <div ref={carouselRef} className="overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <div className="flex gap-6" style={{ minWidth: 'min-content' }}>
                                {topRatedSalons.map((salon) => (
                                    <div key={salon.id} className="shrink-0 w-80">
                                        <SalonCard
                                            salon={salon}
                                            savedSalonIds={savedSalonIds}
                                            toggleSaveSalon={toggleSaveSalon}
                                            showDistance={false}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Grid view */
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {topRatedSalons.map((salon) => (
                                <SalonCard
                                    key={salon.id}
                                    salon={salon}
                                    savedSalonIds={savedSalonIds}
                                    toggleSaveSalon={toggleSaveSalon}
                                    showDistance={false}
                                />
                            ))}
                        </div>
                        {topRatedSalons.length >= salonLimit && (
                            <div className="mt-8 text-center">
                                <button
                                    onClick={handleLoadMore}
                                    className="px-8 py-3 bg-dark-blue text-white rounded-xl font-medium hover:bg-blue-800 transition-colors shadow-lg hover:shadow-xl"
                                >
                                    Még több mutatása
                                </button>
                            </div>
                        )}
                    </>
                )}
                
                {topRatedSalons.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white/40 backdrop-blur-md rounded-xl border border-white/50">
                        <p className="text-gray-500">Szalonok betöltése...</p>
                    </div>
                )}
            </div>

            {/* Hogyan működik? */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-bold text-dark-blue">Hogyan működik?</h2>
                    <p className="text-gray-600 mt-2">Foglalj időpontot néhány egyszerű lépésben</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Lépés 1 */}
                    <div className="relative bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-sm text-center hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-100 text-dark-blue rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-dark-blue text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">1</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Keresés</h3>
                        <p className="text-sm text-gray-500">Keresd meg a számodra ideális szalont név, szolgáltatás vagy helyszín alapján.</p>
                    </div>

                    {/* Lépés 2 */}
                    <div className="relative bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-sm text-center hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-100 text-dark-blue rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-dark-blue text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">2</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Válassz szalont</h3>
                        <p className="text-sm text-gray-500">Böngészd az értékeléseket, szolgáltatásokat és válaszd ki a legjobbat.</p>
                    </div>

                    {/* Lépés 3 */}
                    <div className="relative bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-sm text-center hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-100 text-dark-blue rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-dark-blue text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">3</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Foglalj időpontot</h3>
                        <p className="text-sm text-gray-500">Válaszd ki a neked megfelelő időpontot és foglald le pár kattintással.</p>
                    </div>

                    {/* Lépés 4 */}
                    <div className="relative bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-sm text-center hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-100 text-dark-blue rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        </div>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-dark-blue text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">4</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Kezeld a foglalásaid</h3>
                        <p className="text-sm text-gray-500">Kövesd nyomon foglalásaidat, és értékeld a szolgáltatót a látogatás után.</p>
                    </div>
                </div>
            </div>

            {/* Legújabb értékelések */}
            {recentReviews.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-dark-blue">Legújabb értékelések</h2>
                        <p className="text-gray-600 mt-2">Vendégeink visszajelzései</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {recentReviews.map((review) => (
                            <div key={review.id} className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/50 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-dark-blue text-white flex items-center justify-center text-sm font-bold shrink-0">
                                        {review.user_name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{review.user_name}</p>
                                        <p className="text-xs text-gray-500 truncate">{review.salon_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 mb-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <svg
                                            key={star}
                                            className={`w-4 h-4 ${star <= review.salon_rating ? 'text-amber-400' : 'text-gray-200'}`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-3 flex-1">"{review.salon_comment}"</p>
                                <p className="text-xs text-gray-400 mt-3">
                                    {new Date(review.created_at).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
