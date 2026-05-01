import { useState } from 'react';
import{ createPortal} from 'react-dom';
import Logo from '../Logo';
import ContactModal from './ContactModal';
import { useNavigate, useLocation } from 'react-router-dom';
import PhoneIcon from '../../icons/PhoneIcon';
import UserIcon from '../../icons/UserIcon';
import BriefcaseIcon from '../../icons/BriefcaseIcon';

export default function LandingHeader() {
    const navigate = useNavigate();
    const location = useLocation();
    const isProviderPage = location.pathname === '/provider/landing';
    const [showContact, setShowContact] = useState(false);

    return (
        <>
            {/* Desktop/Tablet Header - Top */}
            <nav className="hidden sm:block bg-white/60 backdrop-blur-sm shadow-sm fixed w-full z-30 top-0 border-b border-gray-200/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-18">
                        <div className="flex items-center pl-4 border-l-2 border-dark-blue/40 h-10">
                            <Logo className="h-11 w-auto cursor-pointer" onClick={() => navigate('/')} />
                        </div>
                        <div className="flex items-center gap-5">
                            <button
                                onClick={() => setShowContact(true)}
                                className="relative text-dark-gray font-medium text-sm after:block after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-dark-blue after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200 after:origin-left pb-0.5"
                            >
                                Kapcsolat
                            </button>
                            <button
                                onClick={() => navigate(isProviderPage ? '/' : '/provider/landing')}
                                className="text-dark-gray font-medium text-sm border border-dark-blue/30 rounded-lg px-4 py-2 hover:border-dark-blue/60 hover:text-dark-blue transition-colors duration-200"
                            >
                                {isProviderPage ? 'Ügyfél oldalra' : 'Szolgáltató vagyok'}
                            </button>
                            <button
                                onClick={() => navigate(isProviderPage ? '/provider/login' : '/login')}
                                className="px-5 py-2.5 bg-dark-blue text-white font-semibold text-sm rounded-lg hover:opacity-90 transition-opacity duration-200 shadow-sm"
                            >
                                Bejelentkezés
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Header - Top (Logo only) */}
            <nav className="sm:hidden bg-white/70 backdrop-blur-sm shadow-sm fixed w-full z-30 top-0 border-b border-gray-200/60">
                <div className="px-4 py-3">
                    <div className="flex justify-center items-center">
                        <Logo className="h-10 w-auto cursor-pointer" onClick={() => navigate('/')} />
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Navigation */}
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200/80 p-2 pb-safe z-50 flex justify-around items-center shadow-[0_-2px_12px_-2px_rgba(0,0,0,0.08)]">
                <button
                    onClick={() => setShowContact(true)}
                    className="flex flex-col items-center gap-1 p-2 w-full justify-center rounded-lg transition-colors duration-200 text-gray-600 hover:text-dark-blue hover:bg-gray-50"
                >
                    <PhoneIcon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Kapcsolat</span>
                </button>
                <button
                    onClick={() => navigate(isProviderPage ? '/' : '/provider/landing')}
                    className="flex flex-col items-center gap-1 p-2 w-full justify-center rounded-lg transition-colors duration-200 text-gray-600 hover:text-dark-blue hover:bg-gray-50"
                >
                    {isProviderPage ? (
                        <UserIcon className="w-5 h-5" />
                    ) : (
                        <BriefcaseIcon className="w-5 h-5" />
                    )}
                    <span className="text-[10px] font-medium">{isProviderPage ? 'Ügyfelek' : 'Szolgáltató'}</span>
                </button>
                <button
                    onClick={() => navigate(isProviderPage ? '/provider/login' : '/login')}
                    className="flex flex-col items-center gap-1 p-2 w-full justify-center rounded-lg transition-colors duration-200 bg-dark-blue text-white hover:opacity-90 shadow-md"
                >
                    <UserIcon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Belépés</span>
                </button>
            </nav>
            {showContact && createPortal(<ContactModal onClose={() => setShowContact(false)} />, document.body)}
        </>
    );
}
