import { useNavigate } from 'react-router-dom';
import logo from '../../pics/image_2025-11-05_190715297-removebg-preview.png';
import heroImage from '../../pics/ChatGPT Image Jan 12, 2026 at 04_16_37 PM.png'; 
import Card from '../Landing/Card';
import Slideshow from './Slideshow';

export default function ProvLanding() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-base-blue font-sans text-gray-900 flex flex-col">
            {/* Header */}
            <header className="flex justify-between items-center px-4 py-4 sm:px-6 lg:px-10 bg-inherit">
                <div className="flex items-center">
                    <img 
                        src={logo} 
                        alt="Bookly Logo" 
                        className="h-16 w-auto object-contain cursor-pointer" 
                        onClick={() => navigate('/')}
                    />
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/provider/login')}
                        className="px-4 py-2 text-dark-blue font-bold hover:text-blue-800 transition-colors"
                    >
                        Bejelentkezés
                    </button>
                    <button 
                        onClick={() => navigate('/provider/register')}
                        className="px-5 py-2 bg-white/40 backdrop-blur-md border-2 border-white/60 text-dark-blue font-bold rounded-xl hover:bg-white/60 transition-all shadow-md hover:shadow-lg hover:scale-105"
                    >
                        Regisztráció
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="flex flex-col lg:flex-row items-center justify-between px-6 py-10 sm:px-12 lg:px-16 gap-10 flex-grow">
                <div className="flex flex-col items-start max-w-2xl w-full lg:w-1/2">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-dark-blue leading-tight mb-6">
                        Növelje vállalkozását a Bookly-val
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-700 mb-8 max-w-lg">
                        Professzionális időpontfoglaló rendszer szolgáltatóknak. Kezelje naptárát egy helyen, és szerezzen több ügyfelet erőfeszítés nélkül.
                    </p>
                    <button 
                        onClick={() => navigate('/provider/register')}
                        className="px-8 py-4 bg-dark-blue text-white font-bold rounded-2xl hover:bg-blue-800 transition-colors shadow-xl text-lg hover:scale-105 active:scale-95 duration-200"
                    >
                        Kezdje el ma!
                    </button>
                </div>
                <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
                    <img 
                        src={heroImage} 
                        alt="Szolgáltatói felület" 
                        className="w-full max-w-lg rounded-3xl shadow-2xl transform rotate-2 hover:rotate-0 transition-all duration-500"
                    />
                </div>
            </section>

            {/* Slideshow Section */}
            <Slideshow />

            {/* Services Section */}
            <section className="px-6 py-20 sm:px-12 lg:px-16 bg-light-blue backdrop-blur-sm rounded-t-[3rem] mt-8 shadow-inner border-t border-white/50">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl font-bold text-center text-dark-blue mb-4">
                        Szolgáltatásaink Partnereknek
                    </h2>
                    <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
                        Minden eszköz, amire szüksége lehet vállalkozása digitális menedzseléséhez.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                        <Card 
                            title="Digitális Naptár" 
                            description="24/7 online foglalási lehetőség ügyfelei számára, automatikus szinkronizációval."
                            imageUrl={heroImage} 
                        />
                        <Card 
                            title="Marketing Eszközök" 
                            description="Érjen el új célközönséget, és promótálja szolgáltatásait kiemelt felületeinken."
                            imageUrl={heroImage} 
                        />
                        <Card 
                            title="Üzleti Elemzések" 
                            description="Részletes kimutatások a forgalomról és a népszerű szolgáltatásokról."
                            imageUrl={heroImage} 
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-dark-blue text-white/90 py-10 px-6 mt-auto">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col items-center md:items-start">
                        <span className="text-2xl font-bold mb-2">Bookly</span>
                        <p className="text-sm opacity-80">&copy; {new Date().getFullYear()} Minden jog fenntartva.</p>
                    </div>
                    
                    <div className="flex gap-8 font-medium">
                        <a href="#" className="hover:text-accent-blue transition-colors">Rólunk</a>
                        <a href="#" className="hover:text-accent-blue transition-colors">Kapcsolat</a>
                        <a href="#" className="hover:text-accent-blue transition-colors">Adatvédelem</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}