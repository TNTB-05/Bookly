import { useState, useRef, useEffect, useMemo } from 'react';
import { searchSalons, getSuggestions } from '../../../../services/searchService';
import { useDebounce } from '../../../../hooks/useDebounce';
import { useAddressAutocomplete, formatSuggestion } from '../../../../hooks/useAddressAutocomplete';
import { SkeletonCard, SkeletonBlock, SkeletonText } from '../../../../components/skeletons';

// Ikonok
import SearchIcon from '../../../../icons/SearchIcon';
import LocationIcon from '../../../../icons/LocationIcon';
import BuildingIcon from '../../../../icons/BuildingIcon';
import CalendarSimpleIcon from '../../../../icons/CalendarSimpleIcon';
import ClipboardCheckIcon from '../../../../icons/ClipboardCheckIcon';
import StarSmallIcon from '../../../../icons/StarSmallIcon';
import LeftArrowIcon from '../../../../icons/LeftArrowIcon';
import RightArrowIcon from '../../../../icons/RightArrowIcon';
import CloseIcon from '../../../../icons/CloseIcon';

// Komponensek
import SalonCard from '../SalonCard';
import SalonMap from '../SalonMap';
import SearchSuggestions from './SearchSuggestions';
import { useNotification } from '../../../../components/NotificationContext';
import { API_URL } from '../../../../config';

// Áttekintés tab - keresés, térkép és szolgáltatások
export default function OverviewTab({
    setActiveTab,
    serviceTypes,
    savedSalonIds,
    toggleSaveSalon,
    recommendedSalons = []
}) {
    const { showToast } = useNotification();
    // UseState változók a kereséshez
    const [searchQuery, setSearchQuery] = useState('');
    const [serviceFilter, setServiceFilter] = useState('all');
    const [locationSearch, setLocationSearch] = useState('');
    const [userLocation, setUserLocation] = useState(null);
    const [searchActive, setSearchActive] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showAllFeatured, setShowAllFeatured] = useState(false);
    const [salonLimit, setSalonLimit] = useState(12);
    const [recentReviews, setRecentReviews] = useState([]);

    // Map state
    const [mapSalons, setMapSalons] = useState([]);
    const [mapLoading, setMapLoading] = useState(false);
    const [selectedSalonId, setSelectedSalonId] = useState(null);
    
    // Suggestions state
    const [suggestions, setSuggestions] = useState({ salons: [], serviceTypes: [] });
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchContainerRef = useRef(null);
    const locationContainerRef = useRef(null);
    const recommendedCarouselRef = useRef(null);

    // Address autocomplete for the location input (shared hook)
    const {
        suggestions: addressSuggestions,
        showSuggestions: showAddressSuggestions,
        setShowSuggestions: setShowAddressSuggestions,
        loading: addressLoading,
        debouncedFetch: debouncedAddressFetch,
        clearSuggestions: clearAddressSuggestions,
    } = useAddressAutocomplete({ debounceMs: 400, minLength: 3 });
    
    // Reactive map data: fetch salons whenever service filter changes
    useEffect(() => {
        async function fetchMapSalons() {
            setMapLoading(true);
            try {
                const apiUrl = API_URL;
                const params = new URLSearchParams();
                if (serviceFilter !== 'all') {
                    params.append('service_type', serviceFilter);
                }
                const url = params.toString()
                    ? `${apiUrl}/api/search/by-name?${params.toString()}`
                    : `${apiUrl}/api/search/by-name`;
                const response = await fetch(url);
                const data = await response.json();
                if (data.success) {
                    setMapSalons(data.salons);
                } else {
                    setMapSalons([]);
                }
            } catch (error) {
                console.error('Hiba a térkép szalonok betöltésekor:', error);
                setMapSalons([]);
            } finally {
                setMapLoading(false);
            }
        }
        fetchMapSalons();
    }, [serviceFilter]);

    // Legújabb értékelések betöltése
    useEffect(() => {
        async function fetchRecentReviews() {
            try {
                const response = await fetch(`${API_URL}/api/search/recent-reviews?limit=8`);
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
        setSearchLoading(true);

        const { salons, resolvedLocation } = await searchSalons({
            searchQuery,
            locationSearch,
            serviceFilter,
            userLocation
        });

        setSearchResults(salons || []);

        // If backend geocoded a place name, set user location for red marker + distances
        if (resolvedLocation && !userLocation) {
            setUserLocation(resolvedLocation);
        }

        setSearchLoading(false);
    }

    // Felhasználó aktuális GPS pozíciójának lekérése
    function handleGetCurrentLocation() {
        if (!navigator.geolocation) {
            showToast('A böngésző nem támogatja a helymeghatározást', 'warning');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ latitude, longitude });

                try {
                    const apiUrl = API_URL;
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
                showToast('Nem sikerült lekérni a helyzetet. Kérjük, engedélyezd a helymeghatározást.', 'warning');
            }
        );
    }

    // Keresés visszaállítása alapállapotba
    function resetSearch() {
        setSearchActive(false);
        setSearchQuery('');
        setLocationSearch('');
        setServiceFilter('all');
        setSearchResults([]);
        setSearchLoading(false);
        setUserLocation(null);
        clearAddressSuggestions();
    }

    // Derived: show only search results on map when search is active, otherwise all salons
    const displayedMapSalons = useMemo(
        () => searchActive && searchResults.length > 0 ? searchResults : mapSalons,
        [searchActive, searchResults, mapSalons]
    );

    // Handle location input change — trigger address autocomplete
    function handleLocationInputChange(e) {
        const value = e.target.value;
        setLocationSearch(value);
        if (userLocation) {
            setUserLocation(null);
        }
        debouncedAddressFetch(value);
    }

    // Handle selecting an address suggestion
    function handleSelectAddress(suggestion) {
        const { shortAddress, lat, lon } = formatSuggestion(suggestion);
        setLocationSearch(shortAddress);
        setUserLocation({ latitude: parseFloat(lat), longitude: parseFloat(lon) });
        clearAddressSuggestions();
    }

    // Scroll the recommended salons carousel left/right
    function scrollRecommendedCarousel(direction) {
        if (recommendedCarouselRef.current) {
            const cardWidth = 320;
            const gap = 24;
            const scrollAmount = cardWidth + gap;
            const newScrollPosition = recommendedCarouselRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
            recommendedCarouselRef.current.scrollTo({
                left: newScrollPosition,
                behavior: 'smooth'
            });
        }
    }

    // Close address suggestions on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (locationContainerRef.current && !locationContainerRef.current.contains(e.target)) {
                setShowAddressSuggestions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div>
            {/* Hero Section */}
            <div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 lg:py-24">
                    <div className="text-center">
                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-dark-blue">
                            Találd meg a tökéletes szolgáltatót
                        </h1>
                        <p className="text-base sm:text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
                            Foglalj időpontot a legjobb szakemberekhez egyszerűen és gyorsan
                        </p>

                        {/* Enhanced Search Bar */}
                        <div className="max-w-4xl mx-auto space-y-3 relative z-[1000]">
                            {/* First Line: Search Bar + Service Filter */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                {/* Search Bar with Suggestions */}
                                <div ref={searchContainerRef} className="flex-1 relative">
                                    <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-white/50 overflow-hidden">
                                        <div className="pl-4 shrink-0">
                                            <SearchIcon className="w-5 h-5 text-gray-400" />
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
                                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-md border-l-4 border-dark-blue text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                                    >
                                        <option value="all">Összes szolgáltatás</option>
                                        {serviceTypes.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Second Line: Location + Jelenlegi helyzetem + Keresés */}
                            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                                {/* Location Input with Address Autocomplete */}
                                <div ref={locationContainerRef} className="flex-1 relative">
                                    <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-white/50 overflow-hidden">
                                        <div className="pl-4 text-gray-500 shrink-0">
                                            <LocationIcon className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Helyszín (pl. Budapest, Kossuth utca 12)"
                                            value={locationSearch}
                                            onChange={handleLocationInputChange}
                                            onFocus={() => {
                                                if (addressSuggestions.length > 0) setShowAddressSuggestions(true);
                                            }}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                            className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none bg-transparent"
                                        />
                                        {addressLoading && (
                                            <div className="pr-3">
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Address Suggestions Dropdown */}
                                    {showAddressSuggestions && addressSuggestions.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                                            {addressSuggestions.map((suggestion, index) => {
                                                const addr = suggestion.address;
                                                const city = addr?.city || addr?.town || addr?.village || '';
                                                const street = addr?.road || '';
                                                const houseNumber = addr?.house_number || '';
                                                const postalCode = addr?.postcode || '';

                                                return (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onClick={() => handleSelectAddress(suggestion)}
                                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                                                    >
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {[city, street && (houseNumber ? `${street} ${houseNumber}` : street), postalCode].filter(Boolean).join(', ') || suggestion.display_name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate mt-0.5">
                                                            {suggestion.display_name}
                                                        </p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Jelenlegi helyzetem Button */}
                                <button
                                    onClick={handleGetCurrentLocation}
                                    className="px-4 py-3 bg-white/80 backdrop-blur-sm text-dark-blue rounded-xl font-medium hover:bg-white transition-colors whitespace-nowrap shadow-md border border-white/50"
                                    title="Jelenlegi helyzetem használata"
                                >
                                    <span>📍 <span className="hidden sm:inline">Jelenlegi </span>Helyzetem</span>
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
                                    <CloseIcon className="w-4 h-4 inline mr-1" /> Keresés törlése
                                </button>
                            )}

                            {/* Helper text */}
                            <p className="text-sm text-gray-500 text-center mt-1">
                                A térképen a kiválasztott szolgáltatás szalonjai jelennek meg.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search results + Map — side-by-side when search active */}
            {searchActive ? (
                <div className="w-[92%] mx-auto pt-4 pb-0 flex flex-col lg:h-[calc(100vh-80px)]">
                    {/* Header — compact */}
                    <div className="flex items-center justify-between mb-3 px-1">
                        <div>
                            <h2 className="text-xl font-bold text-dark-blue">Keresési eredmények</h2>
                            <p className="text-gray-600 text-sm">{searchLoading ? 'Keresés...' : `${searchResults.length} találat`}</p>
                        </div>
                    </div>

                    {/* Side-by-side layout: Map (left ~78%) + Cards (right ~22%) */}
                    <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0">
                        {/* Map — dominant area, fills remaining height */}
                        <div className="w-full lg:w-[78%] h-80 sm:h-96 lg:h-full">
                            <SalonMap salons={displayedMapSalons} userLocation={userLocation} height="100%" selectedSalonId={selectedSalonId} />
                        </div>

                        {/* Cards column — compact, scrollable */}
                        <div className="w-full lg:w-[22%] lg:h-full lg:overflow-y-auto space-y-2 lg:pr-0.5">
                            {searchLoading ? (
                                <div className="space-y-2">
                                    {Array(3).fill(0).map((_, i) => (
                                        <SkeletonCard key={i} className="p-0 overflow-hidden">
                                            <SkeletonBlock className="h-16 w-full rounded-none rounded-t-xl" />
                                            <div className="p-3 space-y-2">
                                                <SkeletonText lines={2} />
                                            </div>
                                        </SkeletonCard>
                                    ))}
                                </div>
                            ) : searchResults.length > 0 ? (
                                searchResults.map((salon) => (
                                    <SalonCard
                                        key={salon.id}
                                        salon={salon}
                                        savedSalonIds={savedSalonIds}
                                        toggleSaveSalon={toggleSaveSalon}
                                        showDistance={true}
                                        compact={true}
                                        onCardClick={() => setSelectedSalonId(prev => prev === salon.id ? null : salon.id)}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-8 bg-white/40 backdrop-blur-md rounded-xl border border-white/50">
                                    {!searchQuery.trim() && !locationSearch.trim() && serviceFilter === 'all' ? (
                                        <div>
                                            <p className="text-gray-700 font-medium text-sm mb-1">Keresési feltétel szükséges</p>
                                            <p className="text-gray-500 text-xs">Kérjük, adj meg egy szalon nevet, válassz szolgáltatást vagy add meg a helyzeted!</p>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-sm">Nincs találat a keresési feltételeknek megfelelően</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Default map — full width, no search results */
                <div className="max-w-7xl mx-auto mt-6 px-4 sm:px-6 lg:px-8">
                    {mapLoading ? (
                        <div className="h-125 rounded-2xl animate-pulse bg-gray-200" />
                    ) : (
                        <SalonMap salons={displayedMapSalons} userLocation={userLocation} />
                    )}
                </div>
            )}





            {/* Ajánlott szalonok */}
            {recommendedSalons.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex items-baseline gap-2 mb-6">
                        <h2 className="text-2xl font-bold text-dark-blue">Ajánlott neked</h2>
                        <span className="text-sm text-gray-400">aktivitásod alapján</span>
                    </div>
                    <div className="relative group">
                        {/* Left Arrow */}
                        <button
                            onClick={() => scrollRecommendedCarousel('left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110"
                            aria-label="Scroll left"
                        >
                            <LeftArrowIcon />
                        </button>

                        {/* Right Arrow */}
                        <button
                            onClick={() => scrollRecommendedCarousel('right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110"
                            aria-label="Scroll right"
                        >
                            <RightArrowIcon />
                        </button>

                        <div ref={recommendedCarouselRef} className="overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <div className="flex gap-6" style={{ minWidth: 'min-content' }}>
                                {recommendedSalons.map(salon => (
                                    <div key={salon.id} className="shrink-0 w-80">
                                        <SalonCard
                                            salon={salon}
                                            savedSalonIds={savedSalonIds}
                                            toggleSaveSalon={toggleSaveSalon}
                                            showDistance={true}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                            <SearchIcon className="w-6 h-6" />
                        </div>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-dark-blue text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">1</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Keresés</h3>
                        <p className="text-sm text-gray-500">Keresd meg a számodra ideális szalont név, szolgáltatás vagy helyszín alapján.</p>
                    </div>

                    {/* Lépés 2 */}
                    <div className="relative bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-sm text-center hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-100 text-dark-blue rounded-full flex items-center justify-center mx-auto mb-4">
                            <BuildingIcon className="w-6 h-6" />
                        </div>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-dark-blue text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">2</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Válassz szalont</h3>
                        <p className="text-sm text-gray-500">Böngészd az értékeléseket, szolgáltatásokat és válaszd ki a legjobbat.</p>
                    </div>

                    {/* Lépés 3 */}
                    <div className="relative bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-sm text-center hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-100 text-dark-blue rounded-full flex items-center justify-center mx-auto mb-4">
                            <CalendarSimpleIcon className="w-6 h-6" />
                        </div>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-dark-blue text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">3</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Foglalj időpontot</h3>
                        <p className="text-sm text-gray-500">Válaszd ki a neked megfelelő időpontot és foglald le pár kattintással.</p>
                    </div>

                    {/* Lépés 4 */}
                    <div className="relative bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-sm text-center hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-100 text-dark-blue rounded-full flex items-center justify-center mx-auto mb-4">
                            <ClipboardCheckIcon className="w-6 h-6" />
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
                                        <StarSmallIcon
                                            key={star}
                                            className={`w-4 h-4 ${star <= review.salon_rating ? 'text-amber-400' : 'text-gray-200'}`}
                                        />
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
