import { useState } from 'react';
import { createPortal } from 'react-dom';
import Logo from '../Logo';
import ContactModal from './ContactModal';
import { useNavigate } from 'react-router-dom';

export default function LandingHeader() {
    const navigate = useNavigate();
    const [showContact, setShowContact] = useState(false);

    return (
        <>
            {/* Desktop/Tablet Header - Top */}
            <nav className="hidden sm:block bg-white/30 backdrop-blur-md shadow-sm fixed w-full z-30 top-0 border-b border-white/40">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center">
                            <Logo className="h-12 w-auto cursor-pointer" onClick={() => navigate('/')} />
                        </div>
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setShowContact(true)}
                                className="text-gray-700 font-medium hover:text-dark-blue transition-colors hover:scale-105"
                            >
                                Kapcsolat
                            </button>
                            <button
                                onClick={() => navigate('/provider/landing')}
                                className="text-gray-700 font-medium hover:text-dark-blue transition-colors hover:scale-105"
                            >
                                Szolgáltató vagyok
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-6 py-3 bg-dark-blue text-white font-semibold rounded-xl hover:bg-blue-800 transition-all shadow-md hover:shadow-lg hover:scale-105"
                            >
                                Bejelentkezés
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Header - Top (Logo only) */}
            <nav className="sm:hidden bg-white/30 backdrop-blur-md shadow-sm fixed w-full z-30 top-0 border-b border-white/40">
                <div className="px-4 py-3">
                    <div className="flex justify-center items-center">
                        <Logo className="h-10 w-auto cursor-pointer" onClick={() => navigate('/')} />
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Navigation */}
            <nav className="sm:hidden bg-white/30 backdrop-blur-md shadow-lg fixed w-full z-30 bottom-0 border-t border-white/40">
                <div className="px-4 py-3">
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => setShowContact(true)}
                            className="px-3 py-2 text-xs font-medium text-gray-700 bg-white/50 rounded-lg hover:bg-white/70 transition-all active:scale-95"
                        >
                            Kapcsolat
                        </button>
                        <button
                            onClick={() => navigate('/provider/landing')}
                            className="px-3 py-2 text-xs font-medium text-gray-700 bg-white/50 rounded-lg hover:bg-white/70 transition-all active:scale-95"
                        >
                            Szolgáltató
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-3 py-2 text-xs font-semibold bg-dark-blue text-white rounded-lg hover:bg-blue-800 transition-all active:scale-95"
                        >
                            Belépés
                        </button>
                    </div>
                </div>
            </nav>
            {showContact && createPortal(<ContactModal onClose={() => setShowContact(false)} />, document.body)}
        </>
    );
}
