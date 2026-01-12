import { useState } from 'react';
import{ createPortal} from 'react-dom';
import Logo from '../Logo';
import ContactModal from './ContactModal';
import { useNavigate } from 'react-router-dom';

export default function LandingHeader() {
    const navigate = useNavigate();
    const [showContact, setShowContact] = useState(false);

    return (
        <>
            <div className="landing-header bg-inherit flex justify-between py-2 px-4 font-bold ">
                <span className="flex items-center gap-2">
                    <Logo className=" left-10 relative p-0 w-32 object-contain" />
                </span>
                <span className="items-center gap-4 flex">
                    <button onClick={() => setShowContact(true)}>Kapcsolat</button>
                    <button onClick={() => navigate('/provider-dashboard')}>Szolgáltató vagyok</button>
                    <button className="bg-white/40 backdrop-blur-md border-2 border-white/50 hover:bg-white/50 text-gray-900 rounded-xl px-4 py-1.5 transition-all duration-300 shadow-lg hover:shadow-xl hover:border-white/70">
                        Bejelentkezés
                    </button>
                </span>
            </div>
            {showContact && createPortal(<ContactModal onClose={() => setShowContact(false)} />, document.body)}
        </>
    );
}
