import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import DashboardNavbar from './DashboardNavbar';
import './Dashboard.css';
import { searchSalons } from '../../../services/searchService';
import { getUserFromToken } from '../../auth/auth';
import { authApi } from '../../auth/auth';

//Ikonok importálása
import SearchIcon from '../../../icons/SearchIcon';
import LocationIcon from '../../../icons/LocationIcon';
import EarthIcon from '../../../icons/EarthIcon';
import ServicesLoadingIcon from '../../../icons/ServicesLoadingIcon';
import BoardIcon from '../../../icons/BoardIcon';
import HourIcon from '../../../icons/HourIcon';
import TickIcon from '../../../icons/TickIcon';
import PlusIcon from '../../../icons/PlusIcon';
import DiaryIcon from '../../../icons/DiaryIcon';
import LeftArrowIcon from '../../../icons/LeftArrowIcon';
import RightArrowIcon from '../../../icons/RightArrowIcon';
import SaveIcon from '../../../icons/SaveIcon';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [providers, setProviders] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [serviceFilter, setServiceFilter] = useState('all');
    const [locationSearch, setLocationSearch] = useState('');
    const [userLocation, setUserLocation] = useState(null);
    const [searchActive, setSearchActive] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [serviceTypes, setServiceTypes] = useState([]);
    const [topRatedSalons, setTopRatedSalons] = useState([]);
    const [showAllFeatured, setShowAllFeatured] = useState(false);
    const [salonLimit, setSalonLimit] = useState(12);
    const [userProfile, setUserProfile] = useState(null);
    const [savedSalonIds, setSavedSalonIds] = useState([]);
    const [savedSalons, setSavedSalons] = useState([]);
    const carouselRef = useRef(null);

    // Profile edit modal state
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileFormData, setProfileFormData] = useState({
        name: '',
        email: '',
        phone: '',
        postalCode: '',
        city: '',
        street: ''
    });
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState(null);

    // Password change modal state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordFormData, setPasswordFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordError, setPasswordError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(null);

    useEffect(() => {
        loadData();
        loadServiceTypes();
        loadTopRatedSalons();
        loadUserProfile();
        loadSavedSalonIds();
    }, []);

    // Load full saved salons when visiting the "Mentett helyek" tab
    useEffect(() => {
        if (activeTab === 'book') {
            loadSavedSalons();
        }
    }, [activeTab]);

    async function loadData() {
        try {
            const tokenUser = getUserFromToken();
            setUser(tokenUser);

            const [appointmentsData, providersData, servicesData] = await Promise.all([
                getUserAppointments(),
                getProviders(),
                getServices()
            ]);

            setAppointments(appointmentsData);
            setProviders(providersData);
            setServices(servicesData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }

    //Gets the user's full profile data from the API
    async function loadUserProfile() {
        try {
            const response = await authApi.get('/api/user/profile');
            const data = await response.json();
            if (data.success) {
                setUserProfile(data.user);
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    //Gets the saved salon IDs to check which salons are saved
    async function loadSavedSalonIds() {
        try {
            const response = await authApi.get('/api/user/saved-salon-ids');
            const data = await response.json();
            if (data.success) {
                setSavedSalonIds(data.savedIds);
            }
        } catch (error) {
            console.error('Error loading saved salon IDs:', error);
        }
    }

    //Gets the full saved salons list
    async function loadSavedSalons() {
        try {
            const response = await authApi.get('/api/user/saved-salons');
            const data = await response.json();
            if (data.success) {
                setSavedSalons(data.salons);
            }
        } catch (error) {
            console.error('Error loading saved salons:', error);
        }
    }

    //Toggle save/unsave a salon
    async function toggleSaveSalon(salonId) {
        try {
            const isSaved = savedSalonIds.includes(salonId);
            
            if (isSaved) {
                await authApi.delete(`/api/user/saved-salons/${salonId}`);
                setSavedSalonIds(prev => prev.filter(id => id !== salonId));
                setSavedSalons(prev => prev.filter(salon => salon.id !== salonId));
            } else {
                await authApi.post(`/api/user/saved-salons/${salonId}`);
                setSavedSalonIds(prev => [...prev, salonId]);
            }
        } catch (error) {
            console.error('Error toggling save salon:', error);
        }
    }

    //Gets the service types for the service filter dropdown
    async function loadServiceTypes() {
        try {
            const response = await fetch('http://localhost:3000/api/search/types');
            const data = await response.json();
            if (data.success) {
                setServiceTypes(data.types);
            }
        } catch (error) {
            console.error('Error loading service types:', error);
        }
    }

    //Gets top rated salons for the featured section
    async function loadTopRatedSalons(limit = 12) {
        try {
            const response = await fetch(`http://localhost:3000/api/search/top-rated?limit=${limit}`);
            const data = await response.json();
            if (data.success) {
                setTopRatedSalons(data.salons);
            }
        } catch (error) {
            console.error('Error loading top-rated salons:', error);
        }
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getStatusBadge(status) {
        const statusMap = {
            scheduled: { text: 'Várható', className: 'bg-blue-100 text-blue-800' },
            completed: { text: 'Elvégezve', className: 'bg-green-100 text-green-800' },
            canceled: { text: 'Lemondva', className: 'bg-red-100 text-red-800' },
            no_show: { text: 'Nem jelent meg', className: 'bg-orange-100 text-orange-800' }
        };
        const statusInfo = statusMap[status] || {
            text: status,
            className: 'bg-gray-100 text-gray-800'
        };
        return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.className}`}>{statusInfo.text}</span>;
    }

    async function handleSearch() {
        // Check if any search criteria is provided
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

    function handleGetCurrentLocation() {
        if (!navigator.geolocation) {
            alert('A böngésző nem támogatja a helymeghatározást');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ latitude, longitude });

                // Reverse geocode to get full address
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
                        headers: {
                            'User-Agent': 'Bookly-App/1.0'
                        }
                    });
                    const data = await response.json();
                    
                    // Build full address string
                    const address = data.address;
                    const parts = [];
                    
                    // Add city first
                    const city = address.city || address.town || address.village || '';
                    if (city) parts.push(city);
                    
                    // Add street and house number
                    const street = address.road || '';
                    const houseNumber = address.house_number || '';
                    if (street) {
                        parts.push(houseNumber ? `${street} ${houseNumber}` : street);
                    }
                    
                    // Add postal code
                    const postalCode = address.postcode || '';
                    if (postalCode) parts.push(postalCode);
                    
                    const fullAddress = parts.join(', ') || 'Jelenlegi helyzet';
                    setLocationSearch(fullAddress);
                } catch (error) {
                    console.error('Reverse geocoding failed:', error);
                    setLocationSearch(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Nem sikerült lekérni a helyzetet. Kérjük, engedélyezd a helymeghatározást.');
            }
        );
    }

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

    function handleLoadMore() {
        const newLimit = salonLimit + 12;
        setSalonLimit(newLimit);
        loadTopRatedSalons(newLimit);
    }

    // Profile modal functions
    function openProfileModal() {
        // Parse existing address if available (format: "1234 Budapest, Példa utca 1.")
        let postalCode = '';
        let city = '';
        let street = '';
        
        if (userProfile?.address) {
            const addressParts = userProfile.address.match(/^(\d{4})\s+([^,]+),?\s*(.*)$/);
            if (addressParts) {
                postalCode = addressParts[1] || '';
                city = addressParts[2] || '';
                street = addressParts[3] || '';
            } else {
                // If parsing fails, put everything in street
                street = userProfile.address;
            }
        }
        
        setProfileFormData({
            name: userProfile?.name || '',
            email: userProfile?.email || '',
            phone: userProfile?.phone || '',
            postalCode,
            city,
            street
        });
        setProfileError(null);
        setShowProfileModal(true);
    }

    async function handleProfileSave() {
        if (!profileFormData.name.trim()) {
            setProfileError('A név megadása kötelező');
            return;
        }

        if (profileFormData.name.trim().length < 2) {
            setProfileError('A név legalább 2 karakter hosszú kell legyen');
            return;
        }

        if (!profileFormData.email.trim()) {
            setProfileError('Az email megadása kötelező');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(profileFormData.email.trim())) {
            setProfileError('Érvénytelen email formátum');
            return;
        }

        // Phone validation (if provided)
        if (profileFormData.phone.trim()) {
            const phoneRegex = /^[\d\s+()-]+$/;
            if (!phoneRegex.test(profileFormData.phone.trim())) {
                setProfileError('Érvénytelen telefonszám formátum');
                return;
            }
        }

        // Address validation (if any field is provided, validate all)
        const hasPostalCode = profileFormData.postalCode.trim();
        const hasCity = profileFormData.city.trim();
        const hasStreet = profileFormData.street.trim();
        
        if (hasPostalCode || hasCity || hasStreet) {
            // Postal code validation
            if (!hasPostalCode) {
                setProfileError('Kérjük adja meg az irányítószámot');
                return;
            }
            const postalCodeRegex = /^\d{4}$/;
            if (!postalCodeRegex.test(profileFormData.postalCode.trim())) {
                setProfileError('Az irányítószámnak 4 számjegyből kell állnia');
                return;
            }

            if (!hasCity) {
                setProfileError('Kérjük adja meg a várost');
                return;
            }
            if (profileFormData.city.trim().length < 2) {
                setProfileError('A város neve legalább 2 karakter hosszú kell legyen');
                return;
            }

            if (!hasStreet) {
                setProfileError('Kérjük adja meg az utcát és házszámot');
                return;
            }
        }

        // Combine address fields
        let combinedAddress = null;
        if (hasPostalCode && hasCity && hasStreet) {
            combinedAddress = `${profileFormData.postalCode.trim()} ${profileFormData.city.trim()}, ${profileFormData.street.trim()}`;
        }

        setProfileSaving(true);
        setProfileError(null);

        try {
            const response = await authApi.put('/api/user/profile', {
                name: profileFormData.name.trim(),
                email: profileFormData.email.trim(),
                phone: profileFormData.phone.trim() || null,
                address: combinedAddress
            });
            const data = await response.json();

            if (data.success) {
                setUserProfile(data.user);
                setShowProfileModal(false);
            } else {
                setProfileError(data.message || 'Hiba történt a mentés során');
            }
        } catch (error) {
            console.error('Profile save error:', error);
            setProfileError('Hiba történt a mentés során');
        } finally {
            setProfileSaving(false);
        }
    }

    // Password modal functions
    function openPasswordModal() {
        setPasswordFormData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setPasswordError(null);
        setPasswordSuccess(null);
        setShowPasswordModal(true);
    }

    async function handlePasswordChange() {
        // Validate all fields are filled
        if (!passwordFormData.currentPassword || !passwordFormData.newPassword || !passwordFormData.confirmPassword) {
            setPasswordError('Minden mező kitöltése kötelező');
            return;
        }

        // Validate new password length
        if (passwordFormData.newPassword.length < 6) {
            setPasswordError('Az új jelszónak legalább 6 karakter hosszúnak kell lennie');
            return;
        }

        // Validate passwords match
        if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
            setPasswordError('Az új jelszavak nem egyeznek');
            return;
        }

        setPasswordSaving(true);
        setPasswordError(null);
        setPasswordSuccess(null);

        try {
            const response = await authApi.put('/api/user/password', passwordFormData);
            const data = await response.json();

            if (data.success) {
                setPasswordSuccess('Jelszó sikeresen megváltoztatva!');
                setPasswordFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                // Close modal after 2 seconds
                setTimeout(() => {
                    setShowPasswordModal(false);
                    setPasswordSuccess(null);
                }, 2000);
            } else {
                setPasswordError(data.message || 'Hiba történt a jelszó módosítása során');
            }
        } catch (error) {
            console.error('Password change error:', error);
            setPasswordError('Hiba történt a jelszó módosítása során');
        } finally {
            setPasswordSaving(false);
        }
    }

    function formatProfileDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function getStatusDisplay(status) {
        switch (status) {
            case 'active': return { text: 'Aktív', color: 'bg-green-100 text-green-800' };
            case 'inactive': return { text: 'Inaktív', color: 'bg-yellow-100 text-yellow-800' };
            case 'banned': return { text: 'Letiltva', color: 'bg-red-100 text-red-800' };
            case 'deleted': return { text: 'Törölt', color: 'bg-gray-100 text-gray-800' };
            default: return { text: status || 'Ismeretlen', color: 'bg-gray-100 text-gray-800' };
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen text-2xl text-gray-600">Betöltés...</div>;
    }

    return (
        <div className="min-h-screen bg-base-blue font-sans text-gray-900">
            {/* Navbar */}
            <DashboardNavbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
            {/* Főoldal */}
            <main className="pt-16 pb-24 md:pb-12">
                <div className="animate-fade-in">
                    {/* ÁTTEKINTÉS TAB - Hero + Kiemelt szolgáltatól + Szolgáltatások */}
                    {activeTab === 'overview' && (
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
                                                {/* Search Bar */}
                                                <div className="flex-1 flex items-center bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-white/50 overflow-hidden">
                                                    <div className="pl-4">
                                                        <SearchIcon />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Keress szolgáltatót vagy szolgáltatást..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                                        className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none bg-transparent"
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
                                                            // Clear user location when typing manually
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
                                                    onClick={() => {
                                                        setSearchActive(false);
                                                        setSearchQuery('');
                                                        setLocationSearch('');
                                                        setServiceFilter('all');
                                                        setSearchResults([]);
                                                        setUserLocation(null);
                                                    }}
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
                                            <div
                                                key={salon.id}
                                                className="bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                                            >
                                                <div className="h-24 bg-linear-to-r from-blue-500 to-dark-blue relative">
                                                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                                                        <div className="w-16 h-16 rounded-full border-4 border-white bg-white flex items-center justify-center text-2xl font-bold text-dark-blue shadow-md">
                                                            {salon.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    </div>
                                                    {/* Save button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleSaveSalon(salon.id);
                                                        }}
                                                        className={`absolute top-2 left-2 p-2 rounded-lg backdrop-blur-sm transition-all ${
                                                            savedSalonIds.includes(salon.id) 
                                                                ? 'bg-yellow-400 text-white' 
                                                                : 'bg-white/90 text-gray-600 hover:bg-white hover:text-dark-blue'
                                                        }`}
                                                        title={savedSalonIds.includes(salon.id) ? 'Eltávolítás a mentett helyekből' : 'Mentés'}
                                                    >
                                                        <SaveIcon filled={savedSalonIds.includes(salon.id)} className="w-4 h-4" />
                                                    </button>
                                                    {/* Distance badge - only show when distance is available */}
                                                    {salon.distance !== null && salon.distance !== undefined && (
                                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-semibold text-dark-blue">
                                                            📍 {salon.distance} km
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="pt-10 p-4 text-center">
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1">{salon.name}</h3>
                                                    <p className="text-xs text-gray-500 mb-1">{salon.address}</p>
                                                    {salon.providers && salon.providers.length > 0 && (
                                                        <p className="text-xs text-gray-400 mb-2">{salon.providers.length} szolgáltató</p>
                                                    )}
                                                    <div className="flex items-center justify-center text-yellow-400 text-sm mb-2">
                                                        ★★★★★ <span className="text-gray-400 text-xs ml-1">(24)</span>
                                                    </div>
                                                    <button
                                                        onClick={() => setActiveTab('book')}
                                                        className="w-full py-2 bg-dark-blue text-white rounded-xl font-medium hover:bg-blue-800 transition-colors"
                                                    >
                                                        Megnézem
                                                    </button>
                                                </div>
                                            </div>
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
                                                    <div
                                                        key={salon.id}
                                                        className="shrink-0 w-80 bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                                                    >
                                                        <div className="h-24 bg-linear-to-r from-blue-500 to-dark-blue relative">
                                                            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                                                                <div className="w-16 h-16 rounded-full border-4 border-white bg-white flex items-center justify-center text-2xl font-bold text-dark-blue shadow-md">
                                                                    {salon.name.charAt(0).toUpperCase()}
                                                                </div>
                                                            </div>
                                                            {/* Save button */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleSaveSalon(salon.id);
                                                                }}
                                                                className={`absolute top-2 left-2 p-2 rounded-lg backdrop-blur-sm transition-all ${
                                                                    savedSalonIds.includes(salon.id) 
                                                                        ? 'bg-yellow-400 text-white' 
                                                                        : 'bg-white/90 text-gray-600 hover:bg-white hover:text-dark-blue'
                                                                }`}
                                                                title={savedSalonIds.includes(salon.id) ? 'Eltávolítás a mentett helyekből' : 'Mentés'}
                                                            >
                                                                <SaveIcon filled={savedSalonIds.includes(salon.id)} className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <div className="pt-10 p-4 text-center">
                                                            <h3 className="text-lg font-bold text-gray-900 mb-1">{salon.name}</h3>
                                                            <p className="text-xs text-gray-500 mb-2">{salon.address}</p>
                                                            {salon.providers && salon.providers.length > 0 && (
                                                                <p className="text-xs text-gray-400 mb-2">{salon.providers.length} szolgáltató</p>
                                                            )}
                                                            <div className="flex items-center justify-center text-yellow-400 text-sm mb-2">
                                                                {salon.average_rating > 0 ? (
                                                                    <>
                                                                        {'★'.repeat(Math.round(salon.average_rating))}{'☆'.repeat(5 - Math.round(salon.average_rating))}
                                                                        <span className="text-gray-400 text-xs ml-1">
                                                                            ({salon.rating_count})
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-gray-400 text-xs">Még nincs értékelés</span>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => setActiveTab('book')}
                                                                className="w-full py-2 bg-dark-blue text-white rounded-xl font-medium hover:bg-blue-800 transition-colors"
                                                            >
                                                                Megnézem
                                                            </button>
                                                        </div>
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
                                                <div
                                                    key={salon.id}
                                                    className="bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                                                >
                                                    <div className="h-24 bg-linear-to-r from-blue-500 to-dark-blue relative">
                                                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                                                            <div className="w-16 h-16 rounded-full border-4 border-white bg-white flex items-center justify-center text-2xl font-bold text-dark-blue shadow-md">
                                                                {salon.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        </div>
                                                        {/* Save button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleSaveSalon(salon.id);
                                                            }}
                                                            className={`absolute top-2 left-2 p-2 rounded-lg backdrop-blur-sm transition-all ${
                                                                savedSalonIds.includes(salon.id) 
                                                                    ? 'bg-yellow-400 text-white' 
                                                                    : 'bg-white/90 text-gray-600 hover:bg-white hover:text-dark-blue'
                                                            }`}
                                                            title={savedSalonIds.includes(salon.id) ? 'Eltávolítás a mentett helyekből' : 'Mentés'}
                                                        >
                                                            <SaveIcon filled={savedSalonIds.includes(salon.id)} className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="pt-10 p-4 text-center">
                                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{salon.name}</h3>
                                                        <p className="text-xs text-gray-500 mb-2">{salon.address}</p>
                                                        {salon.providers && salon.providers.length > 0 && (
                                                            <p className="text-xs text-gray-400 mb-2">{salon.providers.length} szolgáltató</p>
                                                        )}
                                                        <div className="flex items-center justify-center text-yellow-400 text-sm mb-2">
                                                            {salon.average_rating > 0 ? (
                                                                <>
                                                                    {'★'.repeat(Math.round(salon.average_rating))}{'☆'.repeat(5 - Math.round(salon.average_rating))}
                                                                    <span className="text-gray-400 text-xs ml-1">
                                                                        ({salon.rating_count})
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span className="text-gray-400 text-xs">Még nincs értékelés</span>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => setActiveTab('book')}
                                                            className="w-full py-2 bg-dark-blue text-white rounded-xl font-medium hover:bg-blue-800 transition-colors"
                                                        >
                                                            Megnézem
                                                        </button>
                                                    </div>
                                                </div>
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {services
                                            .filter((s) => serviceFilter === 'all' || s.name?.toLowerCase().includes(serviceFilter))
                                            .slice(0, 6)
                                            .map((service) => (
                                                <div
                                                    key={service.id}
                                                    className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h3 className="text-lg font-bold text-gray-900 mb-2">{service.name}</h3>
                                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                                {service.description || 'Professzionális szolgáltatás'}
                                                            </p>
                                                            <div className="flex items-center text-gray-500 text-sm mb-3">
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="h-4 w-4 mr-1"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                    />
                                                                </svg>
                                                                {service.duration || 60} perc
                                                            </div>
                                                        </div>
                                                        <div className="text-right ml-4">
                                                            <p className="text-2xl font-bold text-dark-blue">{service.price || 5000} Ft</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setActiveTab('book')}
                                                        className="w-full py-2.5 bg-dark-blue text-white rounded-xl font-medium hover:bg-blue-800 transition-colors mt-2"
                                                    >
                                                        Foglalás
                                                    </button>
                                                </div>
                                            ))}
                                        {services.length === 0 && (
                                            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                                                <ServicesLoadingIcon />
                                                <h3 className="text-lg font-medium text-gray-900">Szolgáltatások betöltése...</h3>
                                                <p className="text-gray-500 mt-1">A szolgáltatások hamarosan megjelennek</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FOGLALÁSAIM TAB - Statisztikák + Összes foglalás */}
                    {activeTab === 'appointments' && (
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
                            {/* Welcome & Stats */}
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Üdvözöljük, {user?.name}!</h1>
                                <p className="mt-2 text-gray-600">Itt láthatod a foglalásaid áttekintését.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Összes foglalás</p>
                                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{appointments.length}</h3>
                                        </div>
                                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                            <BoardIcon />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Aktív foglalás</p>
                                            <h3 className="text-3xl font-bold text-indigo-600 mt-1">
                                                {appointments.filter((a) => a.status === 'scheduled').length}
                                            </h3>
                                        </div>
                                        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                                            <HourIcon />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Befejezett</p>
                                            <h3 className="text-3xl font-bold text-green-600 mt-1">
                                                {appointments.filter((a) => a.status === 'completed').length}
                                            </h3>
                                        </div>
                                        <div className="p-3 bg-green-50 rounded-lg text-green-600">
                                            <TickIcon />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Összes foglalás lista */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">Összes foglalás</h2>
                                    <button
                                        onClick={() => setActiveTab('book')}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center"
                                    >
                                        <PlusIcon />
                                        Új foglalás
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {appointments.map((apt) => (
                                        <div
                                            key={apt.id}
                                            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 p-3 rounded-full bg-gray-100 hidden sm:block">
                                                    <span className="text-xl">📅</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900">{apt.provider_name}</h3>
                                                    <div className="flex items-center text-gray-700 mt-1">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="h-4 w-4 mr-1 text-gray-500"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                        {formatDate(apt.appointment_start)}
                                                    </div>
                                                    {apt.comment && <p className="text-gray-500 text-sm mt-1 italic">"{apt.comment}"</p>}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 mt-4 md:mt-0 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                                                {getStatusBadge(apt.status)}
                                                <p className="text-xl font-bold text-gray-900">{apt.price} Ft</p>
                                            </div>
                                        </div>
                                    ))}
                                    {appointments.length === 0 && (
                                        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                                            <DiaryIcon />
                                            <h3 className="text-lg font-medium text-gray-900">Még nincs foglalásod</h3>
                                            <p className="text-gray-500 mt-1">Foglalj időpontot szolgáltatásainkra!</p>
                                            <button
                                                onClick={() => setActiveTab('book')}
                                                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                                            >
                                                Új foglalás indítása
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mentett helyek TAB */}
                    {activeTab === 'book' && (
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
                            <h1 className="text-3xl font-bold text-gray-900">Mentett helyek</h1>
                            <p className="text-gray-600">Kedvenc szalonjaid egy helyen.</p>

                            {savedSalons.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {savedSalons.map((salon) => (
                                        <div
                                            key={salon.id}
                                            className="bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                                        >
                                            <div className="h-24 bg-linear-to-r from-blue-500 to-dark-blue relative">
                                                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                                                    <div className="w-16 h-16 rounded-full border-4 border-white bg-white flex items-center justify-center text-2xl font-bold text-dark-blue shadow-md">
                                                        {salon.name.charAt(0).toUpperCase()}
                                                    </div>
                                                </div>
                                                {/* Remove from saved button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleSaveSalon(salon.id);
                                                    }}
                                                    className="absolute top-2 left-2 p-2 rounded-lg backdrop-blur-sm transition-all bg-yellow-400 text-white hover:bg-red-500"
                                                    title="Eltávolítás a mentett helyekből"
                                                >
                                                    <SaveIcon filled={true} className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="pt-10 p-4 text-center">
                                                <h3 className="text-lg font-bold text-gray-900 mb-1">{salon.name}</h3>
                                                <p className="text-xs text-gray-500 mb-1">{salon.address}</p>
                                                <p className="text-xs text-gray-400 mb-2">{salon.type}</p>
                                                {salon.providers && salon.providers.length > 0 && (
                                                    <p className="text-xs text-gray-400 mb-2">{salon.providers.length} szolgáltató</p>
                                                )}
                                                <div className="flex items-center justify-center text-yellow-400 text-sm mb-2">
                                                    {salon.average_rating > 0 ? (
                                                        <>
                                                            {'★'.repeat(Math.round(salon.average_rating))}{'☆'.repeat(5 - Math.round(salon.average_rating))}
                                                            <span className="text-gray-400 text-xs ml-1">
                                                                ({salon.rating_count})
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">Még nincs értékelés</span>
                                                    )}
                                                </div>
                                                <button
                                                    className="w-full py-2 bg-dark-blue text-white rounded-xl font-medium hover:bg-blue-800 transition-colors"
                                                >
                                                    Megnézem
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-white/40 backdrop-blur-md rounded-xl border border-white/50">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                        <SaveIcon filled={false} className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">Még nincs mentett helyed</h3>
                                    <p className="text-gray-500 mt-1">Keresd meg kedvenc szalonjaidat és mentsd el őket!</p>
                                    <button
                                        onClick={() => setActiveTab('overview')}
                                        className="mt-4 px-6 py-2 bg-dark-blue text-white rounded-xl hover:bg-blue-800 font-medium transition-colors"
                                    >
                                        Szalonok böngészése
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* PROFIL TAB */}
                    {activeTab === 'profile' && (
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
                            <h1 className="text-3xl font-bold text-gray-900">Profilom</h1>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-3xl">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                    <h2 className="text-lg font-medium text-gray-800">Személyes adatok</h2>
                                    <button 
                                        onClick={openProfileModal}
                                        className="text-indigo-600 text-sm font-medium hover:text-indigo-800 transition-colors"
                                    >
                                        Szerkesztés
                                    </button>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Név</label>
                                            <p className="text-gray-900 font-medium text-lg border-b border-gray-100 pb-2">
                                                {userProfile?.name || user?.name || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</label>
                                            <p className="text-gray-900 font-medium text-lg border-b border-gray-100 pb-2">
                                                {userProfile?.email || user?.email || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Telefonszám</label>
                                            {userProfile?.phone ? (
                                                <p className="text-gray-900 font-medium text-lg border-b border-gray-100 pb-2">
                                                    {userProfile.phone}
                                                </p>
                                            ) : (
                                                <button 
                                                    onClick={openProfileModal}
                                                    className="text-indigo-600 font-medium text-lg border-b border-gray-100 pb-2 hover:text-indigo-800 transition-colors cursor-pointer"
                                                >
                                                    Nincs megadva
                                                </button>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Cím</label>
                                            {userProfile?.address ? (
                                                <p className="text-gray-900 font-medium text-lg border-b border-gray-100 pb-2">
                                                    {userProfile.address}
                                                </p>
                                            ) : (
                                                <button 
                                                    onClick={openProfileModal}
                                                    className="text-indigo-600 font-medium text-lg border-b border-gray-100 pb-2 hover:text-indigo-800 transition-colors cursor-pointer"
                                                >
                                                    Nincs megadva
                                                </button>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Státusz</label>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium mt-1 ${getStatusDisplay(userProfile?.status).color}`}>
                                                {getStatusDisplay(userProfile?.status).text}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                Regisztráció dátuma
                                            </label>
                                            <p className="text-gray-900 font-medium text-lg border-b border-gray-100 pb-2">
                                                {formatProfileDate(userProfile?.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Password Change Section */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-3xl">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                    <h2 className="text-lg font-medium text-gray-800">Biztonság</h2>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-gray-900 font-medium">Jelszó módosítása</h3>
                                            <p className="text-sm text-gray-500 mt-1">Változtasd meg a fiókoddal kapcsolatos jelszót</p>
                                        </div>
                                        <button
                                            onClick={openPasswordModal}
                                            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                                        >
                                            Jelszó módosítása
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Profile completion hint */}
                            {userProfile?.status !== 'active' && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 max-w-3xl">
                                    <div className="flex items-start gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-yellow-600 mt-0.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                        </svg>
                                        <div>
                                            <h4 className="text-yellow-800 font-medium">Profil kiegészítése szükséges</h4>
                                            <p className="text-yellow-700 text-sm mt-1">
                                                Töltsd ki az összes mezőt (név, email, telefonszám, cím), hogy aktív státuszra válts!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Profile Edit Modal */}
                    {showProfileModal && createPortal(
                        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 overflow-y-auto">
                            <div 
                                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                                onClick={() => setShowProfileModal(false)}
                            ></div>
                            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold text-gray-900">Profil szerkesztése</h3>
                                        <button 
                                            onClick={() => setShowProfileModal(false)}
                                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    {profileError && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                            {profileError}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Név *
                                        </label>
                                        <input
                                            type="text"
                                            value={profileFormData.name}
                                            onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            placeholder="Teljes név"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            value={profileFormData.email}
                                            onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            placeholder="pelda@email.hu"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Telefonszám
                                        </label>
                                        <input
                                            type="tel"
                                            value={profileFormData.phone}
                                            onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            placeholder="+36 20 123 4567"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Formátum: +36 20 123 4567</p>
                                    </div>

                                    {/* Address Section */}
                                    <div className="pt-2">
                                        <div className="flex items-center gap-2 mb-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                            </svg>
                                            <span className="text-sm font-medium text-gray-700">Lakcím</span>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-3 mb-3">
                                            <div className="col-span-1">
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Irányítószám
                                                </label>
                                                <input
                                                    type="text"
                                                    value={profileFormData.postalCode}
                                                    onChange={(e) => {
                                                        // Only allow digits and max 4 characters
                                                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                        setProfileFormData({ ...profileFormData, postalCode: value });
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-center"
                                                    placeholder="1234"
                                                    maxLength={4}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Város
                                                </label>
                                                <input
                                                    type="text"
                                                    value={profileFormData.city}
                                                    onChange={(e) => setProfileFormData({ ...profileFormData, city: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                    placeholder="Budapest"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Utca, házszám
                                            </label>
                                            <input
                                                type="text"
                                                value={profileFormData.street}
                                                onChange={(e) => setProfileFormData({ ...profileFormData, street: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                placeholder="Példa utca 1. 2. emelet 3. ajtó"
                                            />
                                        </div>
                                        
                                        <p className="text-xs text-gray-500 mt-2">
                                            A cím megadása nem kötelező, de ha elkezded kitölteni, minden mezőt ki kell töltened.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                                    <button
                                        onClick={() => setShowProfileModal(false)}
                                        className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                                    >
                                        Mégse
                                    </button>
                                    <button
                                        onClick={handleProfileSave}
                                        disabled={profileSaving}
                                        className="flex-1 py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {profileSaving ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        ) : (
                                            'Mentés'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}

                    {/* Password Change Modal */}
                    {showPasswordModal && createPortal(
                        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 overflow-y-auto">
                            <div 
                                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                                onClick={() => setShowPasswordModal(false)}
                            ></div>
                            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold text-gray-900">Jelszó módosítása</h3>
                                        <button 
                                            onClick={() => setShowPasswordModal(false)}
                                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    {passwordError && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                            {passwordError}
                                        </div>
                                    )}

                                    {passwordSuccess && (
                                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {passwordSuccess}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Jelenlegi jelszó *
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordFormData.currentPassword}
                                            onChange={(e) => setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Új jelszó *
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordFormData.newPassword}
                                            onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            placeholder="••••••••"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Legalább 6 karakter hosszú legyen</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Új jelszó megerősítése *
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordFormData.confirmPassword}
                                            onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                                    <button
                                        onClick={() => setShowPasswordModal(false)}
                                        className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                                    >
                                        Mégse
                                    </button>
                                    <button
                                        onClick={handlePasswordChange}
                                        disabled={passwordSaving || passwordSuccess}
                                        className="flex-1 py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {passwordSaving ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        ) : (
                                            'Jelszó módosítása'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}
                </div>
            </main>
        </div>
    );
}
