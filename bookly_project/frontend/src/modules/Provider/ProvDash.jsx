import { useState, useRef, useEffect } from 'react';
import Logo from '../../modules/Logo';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth';
import OverviewIcon from '../../icons/OverviewIcon';
import CalendarIcon from '../../icons/CalendarIcon';
import ServicesIcon from '../../icons/ServicesIcon';

// Section Components
const OverviewSection = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-dark-blue">Áttekintés</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50">
                <h3 className="text-gray-600 font-medium">Mai Foglalások</h3>
                <p className="text-4xl font-bold text-dark-blue mt-2">8</p>
            </div>
            <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50">
                <h3 className="text-gray-600 font-medium">Heti Bevétel</h3>
                <p className="text-4xl font-bold text-dark-blue mt-2">125.000 Ft</p>
            </div>
            <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50">
                <h3 className="text-gray-600 font-medium">Új Ügyfelek</h3>
                <p className="text-4xl font-bold text-dark-blue mt-2">12</p>
            </div>
        </div>
        
        <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50">
            <h3 className="text-xl font-bold text-dark-blue mb-4">Következő Időpontok</h3>
            <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center justify-between p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                KQ
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">Kiss Quinn</p>
                                <p className="text-sm text-gray-600">Hajvágás - 14:00</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Megerősítve
                        </span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const CalendarSection = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-dark-blue">Naptár</h2>
        <div className="bg-white/40 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/50 h-[600px] flex items-center justify-center">
            <p className="text-gray-500 text-lg">Naptár nézet hamarosan...</p>
        </div>
    </div>
);

const ServicesSection = () => (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-dark-blue">Szolgáltatások Kezelése</h2>
            <button className="px-4 py-2 bg-dark-blue text-white rounded-xl font-medium hover:bg-blue-800 transition-colors shadow-md">
                + Új Szolgáltatás
            </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4].map((item) => (
                <div key={item} className="group bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50 hover:border-white/80 transition-all hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-light-blue rounded-lg flex items-center justify-center text-dark-blue">
                             <ServicesIcon />
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1 hover:bg-white/50 rounded text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                            </button>
                            <button className="p-1 hover:bg-white/50 rounded text-red-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </button>
                        </div>
                    </div>
                    <h3 className="font-bold text-lg text-gray-900">Férfi Hajvágás</h3>
                    <p className="text-gray-500 text-sm mt-1">30 perc • 4.500 Ft</p>
                </div>
            ))}
        </div>
    </div>
);

const NavButton = ({ activeTab, tabId, label, icon, onClick, isMobile }) => (
    <button
        onClick={() => onClick(tabId)}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 relative overflow-hidden
            ${activeTab === tabId
                ? 'bg-dark-blue text-white shadow-lg scale-105'
                : 'hover:bg-white/40 text-gray-700 hover:text-dark-blue'
            }
            ${isMobile ? 'flex-col text-[10px] gap-1 p-2 w-full justify-center' : 'w-full'}
        `}
    >
        <div className={`transition-transform duration-300 ${activeTab === tabId && !isMobile ? 'translate-x-1' : ''}`}>
             {icon}
        </div>
        <span className={`${isMobile ? 'font-medium' : 'font-semibold'}`}>{label}</span>
        
        {/* Active Indicator Glow */}
        {activeTab === tabId && (
            <div className="absolute inset-0 bg-white/10 opacity-50 blur-md rounded-xl"></div>
        )}
    </button>
);

const UserDropdown = ({ isOpen, onLogout }) => {
    if (!isOpen) return null;
    
    return (
        <div className="absolute top-14 right-4 w-52 bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl overflow-hidden animate-fade-in z-50">
            <div className="p-4 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-900">Minta Szolgáltató</p>
                <p className="text-xs text-gray-500 truncate">info@mintaszolgaltato.hu</p>
            </div>
            <div className="p-2 space-y-1">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white/50 rounded-lg transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    Profil Szerkesztése
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white/50 rounded-lg transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Beállítások
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button 
                    onClick={onLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    Kijelentkezés
                </button>
            </div>
        </div>
    );
};

export default function ProvDash() {
    const [activeTab, setActiveTab] = useState('overview');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const { setIsAuthenticated } = useAuth();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        setIsAuthenticated(false);
        navigate('/');
    };
    
    const renderContent = () => {
        switch(activeTab) {
            case 'overview': return <OverviewSection />;
            case 'calendar': return <CalendarSection />;
            case 'services': return <ServicesSection />;
            default: return <OverviewSection />;
        }
    };

    return (
        <div className="min-h-screen bg-base-blue flex flex-col font-sans text-gray-900">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/30 backdrop-blur-[12px] border-b border-white/40 shadow-sm flex items-center justify-between px-4 sm:px-6">
                <div className="h-10 flex items-center">
                    <Logo className="h-full w-auto object-contain cursor-pointer" />
                </div>
                
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 focus:outline-none group"
                    >
                        <span className="hidden sm:block text-sm font-medium text-gray-700 group-hover:text-dark-blue transition-colors">
                            Üdv, Szolgáltató!
                        </span>
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-dark-blue to-blue-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm font-bold border-2 border-white/50 cursor-pointer">
                            Sz
                        </div>
                    </button>

                    <UserDropdown 
                        isOpen={isDropdownOpen} 
                        onLogout={handleLogout}
                    />
                </div>
            </header>

            <div className="flex flex-1 pt-16 h-screen overflow-hidden">
                {/* Desktop Sidebar */}
                <aside className="hidden md:flex w-72 flex-col bg-white/30 backdrop-blur-md border-r border-white/40 h-full p-6 gap-3 z-40 transition-all">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">Menü</p>
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="overview" 
                        label="Áttekintés" 
                        icon={<OverviewIcon />} 
                        onClick={setActiveTab} 
                    />
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="calendar" 
                        label="Naptár" 
                        icon={<CalendarIcon />} 
                        onClick={setActiveTab} 
                    />
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="services" 
                        label="Szolgáltatások" 
                        icon={<ServicesIcon />} 
                        onClick={setActiveTab} 
                    />
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 scroll-smooth">
                    <div className="max-w-6xl mx-auto animate-fade-in">
                        {renderContent()}
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/50 p-2 pb-safe z-50 flex justify-around items-center shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="overview" 
                        label="Áttekintés" 
                        icon={<OverviewIcon />} 
                        onClick={setActiveTab} 
                        isMobile={true}
                    />
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="calendar" 
                        label="Naptár" 
                        icon={<CalendarIcon />} 
                        onClick={setActiveTab} 
                        isMobile={true}
                    />
                    <NavButton 
                        activeTab={activeTab} 
                        tabId="services" 
                        label="Szolgáltatások" 
                        icon={<ServicesIcon />} 
                        onClick={setActiveTab} 
                        isMobile={true}
                    />
                </nav>
            </div>
        </div>
    );
}