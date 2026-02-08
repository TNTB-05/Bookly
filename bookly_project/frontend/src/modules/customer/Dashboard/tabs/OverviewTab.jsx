import { useState, useRef, useEffect } from 'react';
import { searchSalons, getSuggestions } from '../../../../services/searchService';
import { useDebounce } from '../../../../hooks/useDebounce';

// Ikonok
import SearchIcon from '../../../../icons/SearchIcon';
import LocationIcon from '../../../../icons/LocationIcon';
import ServicesLoadingIcon from '../../../../icons/ServicesLoadingIcon';
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
    const carouselRef = useRef(null);
    
    // Suggestions state
    const [suggestions, setSuggestions] = useState({ salons: [], serviceTypes: [] });
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchContainerRef = useRef(null);
    
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
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
                        headers: {
                            'User-Agent': 'Bookly-App/1.0'
                        }
                    });
                    const data = await response.json();
                    
                    const address = data.address;
                    const parts = [];
                    
                    const city = address.city || address.town || address.village || '';
                    if (city) parts.push(city);
                    
                    const street = address.road || '';
                    const houseNumber = address.house_number || '';
                    if (street) {
                        parts.push(houseNumber ? `${street} ${houseNumber}` : street);
                    }
                    
                    const postalCode = address.postcode || '';
                    if (postalCode) parts.push(postalCode);
                    
                    const fullAddress = parts.join(', ') || 'Jelenlegi helyzet';
                    setLocationSearch(fullAddress);
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
            const scrollAmount = 400;
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

            {/* Szolgáltatások */}
            <div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-dark-blue mb-3">Szolgáltatások</h2>
                        
                        {/* Filter by Service Type */}
                        <div className="flex gap-2 flex-wrap">
                            <button
                                key="all"
                                onClick={() => setServiceFilter('all')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                    serviceFilter === 'all'
                                        ? 'bg-dark-blue text-white shadow-lg'
                                        : 'bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/70 border border-white/50'
                                }`}
                            >
                                Összes
                            </button>
                            {serviceTypes.map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setServiceFilter(type)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                        serviceFilter === type
                                            ? 'bg-dark-blue text-white shadow-lg'
                                            : 'bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/70 border border-white/50'
                                    }`}
                                >
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="text-center py-12 bg-white/40 backdrop-blur-md rounded-xl border border-white/50">
                        <ServicesLoadingIcon />
                        <h3 className="text-lg font-medium text-gray-900">Szolgáltatások hamarosan</h3>
                        <p className="text-gray-500 mt-1">A szolgáltatások böngészése fejlesztés alatt áll</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
