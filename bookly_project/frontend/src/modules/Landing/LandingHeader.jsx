import { useState } from 'react';
import{ createPortal} from 'react-dom';
import Logo from '../Logo';
import ContactModal from './ContactModal';
import { useNavigate, useLocation } from 'react-router-dom';

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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                        />
                    </svg>
                    <span className="text-[10px] font-medium">Kapcsolat</span>
                </button>
                <button
                    onClick={() => navigate(isProviderPage ? '/' : '/provider/landing')}
                    className="flex flex-col items-center gap-1 p-2 w-full justify-center rounded-lg transition-colors duration-200 text-gray-600 hover:text-dark-blue hover:bg-gray-50"
                >
                    {isProviderPage ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                            />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                        </svg>
                    )}
                    <span className="text-[10px] font-medium">{isProviderPage ? 'Ügyfelek' : 'Szolgáltató'}</span>
                </button>
                <button
                    onClick={() => navigate(isProviderPage ? '/provider/login' : '/login')}
                    className="flex flex-col items-center gap-1 p-2 w-full justify-center rounded-lg transition-colors duration-200 bg-dark-blue text-white hover:opacity-90 shadow-md"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                        />
                    </svg>
                    <span className="text-[10px] font-medium">Belépés</span>
                </button>
            </nav>
            {showContact && createPortal(<ContactModal onClose={() => setShowContact(false)} />, document.body)}
        </>
    );
}
