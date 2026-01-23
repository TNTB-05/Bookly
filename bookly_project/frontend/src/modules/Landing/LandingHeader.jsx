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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/50 p-2 pb-safe z-50 flex justify-around items-center shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
                <button
                    onClick={() => setShowContact(true)}
                    className="flex flex-col items-center gap-1 p-2 w-full justify-center rounded-xl transition-all duration-300 text-gray-700 hover:text-dark-blue hover:bg-white/40"
                >
                    <span className="text-lg">📞</span>
                    <span className="text-[10px] font-medium">Kapcsolat</span>
                </button>
                <button
                    onClick={() => navigate('/provider/landing')}
                    className="flex flex-col items-center gap-1 p-2 w-full justify-center rounded-xl transition-all duration-300 text-gray-700 hover:text-dark-blue hover:bg-white/40"
                >
                    <span className="text-lg">💼</span>
                    <span className="text-[10px] font-medium">Szolgáltató</span>
                </button>
                <button
                    onClick={() => navigate('/login')}
                    className="flex flex-col items-center gap-1 p-2 w-full justify-center rounded-xl transition-all duration-300 bg-dark-blue text-white shadow-lg scale-105 hover:bg-blue-800"
                >
                    <span className="text-lg">🔐</span>
                    <span className="text-[10px] font-medium">Belépés</span>
                </button>
            </nav>
            {showContact && createPortal(<ContactModal onClose={() => setShowContact(false)} />, document.body)}
        </>
    );
}
