import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardNavbar from './DashboardNavbar';
import './Dashboard.css';
import { getUserFromToken } from '../../auth/auth';
import { authApi } from '../../auth/auth';

// Tab komponensek
import OverviewTab from './tabs/OverviewTab';
import AppointmentsTab from './tabs/AppointmentsTab';
import SavedSalonsTab from './tabs/SavedSalonsTab';
import ProfileTab from './tabs/ProfileTab';

// Fő irányítópult komponens - kezeli a tabokat és az adatbetöltést
export default function Dashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // URL paraméterből activeTab beállítása
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get('tab') || 'overview';
    
    // Állapotok
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(tabFromUrl);
    const [serviceTypes, setServiceTypes] = useState([]);
    const [topRatedSalons, setTopRatedSalons] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [savedSalonIds, setSavedSalonIds] = useState([]);
    const [savedSalons, setSavedSalons] = useState([]);
    const [restoreLoading, setRestoreLoading] = useState(false);
    const [deletionDate, setDeletionDate] = useState(null);
    const [daysRemaining, setDaysRemaining] = useState(null);

    // URL paraméter változás figyelése
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const tabFromUrl = urlParams.get('tab') || 'overview';
        setActiveTab(tabFromUrl);
    }, [location.search]);

    // Kezdeti adatok betöltése
    useEffect(() => {
        loadData();
        loadServiceTypes();
        loadTopRatedSalons();
        loadUserProfile();
        loadSavedSalonIds();
    }, []);

    // Mentett szalonok betöltése ha a "Mentett helyek" tab aktív
    useEffect(() => {
        if (activeTab === 'book') {
            loadSavedSalons();
        }
    }, [activeTab]);

    // Felhasználó adatainak betöltése tokenből
    async function loadData() {
        try {
            const tokenUser = getUserFromToken();
            setUser(tokenUser);
        } catch (error) {
            console.error('Hiba az adatok betöltésekor:', error);
        } finally {
            setLoading(false);
        }
    }

    // Felhasználó profil adatainak lekérése az API-ból
    async function loadUserProfile() {
        try {
            const response = await authApi.get('/api/user/profile');
            const data = await response.json();
            if (data.success) {
                setUserProfile(data.user);
                // Calculate deletion countdown if user is deleted
                if (data.user.status === 'deleted' && data.user.deleted_at) {
                    const deletedAt = new Date(data.user.deleted_at);
                    const permanentDeleteDate = new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
                    setDeletionDate(permanentDeleteDate);
                    const now = new Date();
                    const remaining = Math.ceil((permanentDeleteDate - now) / (1000 * 60 * 60 * 24));
                    setDaysRemaining(Math.max(0, remaining));
                }
            }
        } catch (error) {
            console.error('Hiba a profil betöltésekor:', error);
        }
    }

    // Fiók visszaállítása
    async function handleRestoreAccount() {
        setRestoreLoading(true);
        try {
            const response = await authApi.post('/api/user/restore-account');
            const data = await response.json();
            if (data.success) {
                // Reload profile to get updated status
                await loadUserProfile();
                setDaysRemaining(null);
                setDeletionDate(null);
            } else {
                alert(data.message || 'Hiba történt a fiók visszaállítása során');
            }
        } catch (error) {
            console.error('Restore error:', error);
            alert('Hiba történt a fiók visszaállítása során');
        } finally {
            setRestoreLoading(false);
        }
    }

    // Mentett szalon ID-k lekérése
    async function loadSavedSalonIds() {
        try {
            const response = await authApi.get('/api/user/saved-salon-ids');
            const data = await response.json();
            if (data.success) {
                setSavedSalonIds(data.savedIds);
            }
        } catch (error) {
            console.error('Hiba a mentett szalon ID-k betöltésekor:', error);
        }
    }

    // Mentett szalonok teljes listájának lekérése
    async function loadSavedSalons() {
        try {
            const response = await authApi.get('/api/user/saved-salons');
            const data = await response.json();
            if (data.success) {
                setSavedSalons(data.salons);
            }
        } catch (error) {
            console.error('Hiba a mentett szalonok betöltésekor:', error);
        }
    }

    // Szalon mentése vagy törlése
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
            console.error('Hiba a szalon mentésekor/törlésekor:', error);
        }
    }

    // Szolgáltatás típusok lekérése a szűrőhöz
    async function loadServiceTypes() {
        try {
            const response = await fetch('http://localhost:3000/api/search/types');
            const data = await response.json();
            if (data.success) {
                setServiceTypes(data.types);
            }
        } catch (error) {
            console.error('Hiba a szolgáltatás típusok betöltésekor:', error);
        }
    }

    // Legjobban értékelt szalonok lekérése
    async function loadTopRatedSalons(limit = 12) {
        try {
            const response = await fetch(`http://localhost:3000/api/search/top-rated?limit=${limit}`);
            const data = await response.json();
            if (data.success) {
                setTopRatedSalons(data.salons);
            }
        } catch (error) {
            console.error('Hiba a legjobb szalonok betöltésekor:', error);
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen text-2xl text-gray-600">Betöltés...</div>;
    }

    return (
        <div className="min-h-screen bg-base-blue font-sans text-gray-900">
            {/* Navbar */}
            <DashboardNavbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} userProfile={userProfile} />
            
            {/* Restoration Banner */}
            {userProfile?.status === 'deleted' && daysRemaining !== null && (
                <div className="fixed top-16 left-0 right-0 z-40 bg-amber-500 text-white px-4 py-3 shadow-lg">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span className="text-sm font-medium">
                                A fiókod törlésre lett jelölve. A végleges törlés {daysRemaining} nap múlva történik ({deletionDate?.toLocaleDateString('hu-HU')}).
                            </span>
                        </div>
                        <button
                            onClick={handleRestoreAccount}
                            disabled={restoreLoading}
                            className="px-4 py-1.5 bg-white text-amber-700 font-semibold rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shrink-0"
                        >
                            {restoreLoading ? 'Visszaállítás...' : 'Fiók visszaállítása'}
                        </button>
                    </div>
                </div>
            )}

            {/* Főoldal */}
            <main className={`${userProfile?.status === 'deleted' && daysRemaining !== null ? 'pt-28' : 'pt-16'} pb-24 md:pb-12`}>
                <div className="animate-fade-in">
                    {/* ÁTTEKINTÉS TAB */}
                    {activeTab === 'overview' && (
                        <OverviewTab
                            setActiveTab={setActiveTab}
                            serviceTypes={serviceTypes}
                            topRatedSalons={topRatedSalons}
                            savedSalonIds={savedSalonIds}
                            toggleSaveSalon={toggleSaveSalon}
                            loadTopRatedSalons={loadTopRatedSalons}
                        />
                    )}

                    {/* FOGLALÁSAIM TAB */}
                    {activeTab === 'appointments' && (
                        <AppointmentsTab
                            user={user}
                            setActiveTab={setActiveTab}
                            loadTopRatedSalons={loadTopRatedSalons}
                        />
                    )}

                    {/* MENTETT HELYEK TAB */}
                    {activeTab === 'book' && (
                        <SavedSalonsTab
                            savedSalons={savedSalons}
                            savedSalonIds={savedSalonIds}
                            toggleSaveSalon={toggleSaveSalon}
                            setActiveTab={setActiveTab}
                        />
                    )}

                    {/* PROFIL TAB */}
                    {activeTab === 'profile' && (
                        <ProfileTab
                            user={user}
                            userProfile={userProfile}
                            setUserProfile={setUserProfile}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}
