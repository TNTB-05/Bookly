import { useNavigate } from "react-router-dom"

import Card from "./Card";
import appointment from "../../pics/appointment.png";
import services from "../../pics/services.png";
import allinone from "../../pics/allinone.png";
import calendar from "../../pics/calendar.png";
import connectionservices from "../../pics/connectionservice.png";
import collision from "../../pics/collision.png";
import landinghero from "../../pics/slider1.png";

import landinghero from "../../pics/slider1.png";


export default function LandingBody(){
    const navigate = useNavigate();

    return (
        <div className="pt-16 sm:pt-20 pb-20 sm:pb-0 overflow-x-hidden">
            {/* Hero Section */}
            <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-28">
                {/* Decorative background blob */}
                <div className="absolute -top-10 -left-20 w-[480px] h-[480px] bg-accent-blue/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative flex flex-col lg:flex-row items-center justify-between gap-12">
                    {/* Text — 55% */}
                    <div className="flex flex-col items-start w-full lg:w-[55%] animate-fade-in">
                        <span className="inline-block mb-4 text-xs font-semibold tracking-widest uppercase text-dark-blue bg-accent-blue/30 px-3 py-1 rounded-full">
                            Magyar szalonkereső
                        </span>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-dark-gray leading-tight mb-6">
                            Az időd értékes.{' '}
                            <span className="text-dark-blue">Mi megtaláljuk a legjobb szalont helyetted.</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-lg">
                            Több mint 500 szalon, azonnali foglalás — ingyenesen.
                        </p>
                        <button
                            className="px-8 py-4 bg-dark-blue text-white font-bold rounded-lg hover:bg-blue-800 transition-all duration-300 shadow-lg text-lg hover:scale-105 active:scale-95"
                            onClick={() => navigate('/login')}
                        >
                            Foglalás most
                        </button>
                        <p className="mt-4 text-sm text-gray-500 space-x-2">
                            <span>✓ Ingyenes regisztráció</span>
                            <span>·</span>
                            <span>✓ Azonnali hozzáférés</span>
                            <span>·</span>
                            <span>✓ Nincs rejtett díj</span>
                        </p>
                    </div>

                    {/* Image — right, slightly overlapping */}
                    <div className="w-full lg:w-[50%] flex justify-center lg:justify-end lg:-mr-8 animate-fade-in [animation-delay:200ms]">
                        <img
                            src={landinghero}
                            alt="Bookly Hero"
                            className="w-full max-w-lg rounded-2xl shadow-2xl hover:scale-[1.02] transition-all duration-500"
                        />
                    </div>
                </div>
            </section>

            {/* Social Proof Stats Bar */}
            <section className="bg-dark-blue text-white py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-around gap-6 sm:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-white/20">
                        <div className="flex flex-col items-center px-8 py-2 animate-fade-in">
                            <span className="text-3xl font-black tabular-nums text-white">500+</span>
                            <span className="text-xs tracking-wider uppercase opacity-75 mt-1">Partner szalon</span>
                        </div>
                        <div className="flex flex-col items-center px-8 py-2 animate-fade-in [animation-delay:100ms]">
                            <span className="text-3xl font-black tabular-nums text-white">12&nbsp;000+</span>
                            <span className="text-xs tracking-wider uppercase opacity-75 mt-1">Elvégzett foglalás</span>
                        </div>
                        <div className="flex flex-col items-center px-8 py-2 animate-fade-in [animation-delay:200ms]">
                            <span className="text-3xl font-black tabular-nums text-white">4.8★</span>
                            <span className="text-xs tracking-wider uppercase opacity-75 mt-1">Átlagos értékelés</span>
                        </div>
                        <div className="flex flex-col items-center px-8 py-2 animate-fade-in [animation-delay:300ms]">
                            <span className="text-3xl font-black tabular-nums text-white">23</span>
                            <span className="text-xs tracking-wider uppercase opacity-75 mt-1">Város</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="bg-light-blue/30 py-20 sm:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 animate-fade-in">
                        <h2 className="text-3xl sm:text-4xl font-bold text-dark-gray mb-3">Hogyan működik?</h2>
                        <p className="text-gray-500 max-w-xl mx-auto">Három lépés, és már foglaltál is.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                        {/* Step 1 */}
                        <div className="relative flex flex-col items-start p-8 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 hover:shadow-md transition-all duration-300 animate-fade-in">
                            <span className="absolute top-4 right-6 text-6xl font-black text-dark-blue/10 leading-none select-none">01</span>
                            <div className="w-12 h-12 bg-dark-blue rounded-lg flex items-center justify-center mb-5 shrink-0">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-dark-gray mb-2">Keress szalont</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Böngészd a közeledben lévő szalonokat, szűrj szolgáltatás, értékelés vagy ár alapján.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="relative flex flex-col items-start p-8 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 hover:shadow-md transition-all duration-300 animate-fade-in [animation-delay:200ms]">
                            <span className="absolute top-4 right-6 text-6xl font-black text-dark-blue/10 leading-none select-none">02</span>
                            <div className="w-12 h-12 bg-dark-blue rounded-lg flex items-center justify-center mb-5 shrink-0">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-dark-gray mb-2">Válassz időpontot</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Nézd meg az elérhető időpontokat valós időben, és foglalj egy kattintással.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="relative flex flex-col items-start p-8 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 hover:shadow-md transition-all duration-300 animate-fade-in [animation-delay:400ms]">
                            <span className="absolute top-4 right-6 text-6xl font-black text-dark-blue/10 leading-none select-none">03</span>
                            <div className="w-12 h-12 bg-dark-blue rounded-lg flex items-center justify-center mb-5 shrink-0">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-dark-gray mb-2">Megjelensz, mi a többit intézzük</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Kapj emlékeztetőt, és egyszerűen jelenj meg — minden más automatikus.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Customer Features Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
                <div className="text-center mb-12 animate-fade-in">
                    <h2 className="text-3xl sm:text-4xl font-bold text-dark-gray mb-3">Ne pazarold az idődet</h2>
                    <p className="text-gray-500 max-w-2xl mx-auto">Minden amit keresel, egy helyen — várakozás és telefonálgatás nélkül.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    <div className="animate-fade-in">
                        <Card title="Időpont foglalás" description="Egyszerű és gyors időpontfoglalás a kedvenc szolgáltatóidhoz — telefonálás nélkül." imageUrl={appointment} />
                    </div>
                    <div className="animate-fade-in [animation-delay:200ms]">
                        <Card title="Széles választék" description="Partnereink széles választékából böngészd a legjobb szalonokat a közeledben." imageUrl={services} />
                    </div>
                    <div className="animate-fade-in [animation-delay:400ms]">
                        <Card title="Minden egy helyen" description="Foglalás, visszaigazolás, emlékeztető — nálunk minden szolgáltatás elérhető egy helyen." imageUrl={allinone} />
                    </div>
                </div>
            </section>

            {/* Provider CTA Section */}
            <section className="bg-dark-blue py-20 sm:py-28">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in">
                    <span className="inline-block mb-5 text-xs font-semibold tracking-widest uppercase text-white/60 bg-white/10 px-3 py-1 rounded-full">
                        Szolgáltatóknak
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
                        Vállalkozó vagy?<br />Töltsd meg a naptáradat.
                    </h2>
                    <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto">
                        Csatlakozz a 500+ partnerünkhöz, akik már automatizálták a foglalásaikat.
                    </p>
                    <button
                        onClick={() => navigate('/provider/landing')}
                        className="px-10 py-4 bg-white text-dark-blue font-bold rounded-lg hover:bg-base-blue transition-all duration-300 shadow-xl text-lg hover:scale-105 active:scale-95"
                    >
                        Regisztrálj ingyen
                    </button>
                </div>
            </section>

            {/* Provider Features Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
                <div className="text-center mb-12 animate-fade-in">
                    <h2 className="text-3xl sm:text-4xl font-bold text-dark-gray mb-3">Minden eszköz, amire szükséged van</h2>
                    <p className="text-gray-500 max-w-xl mx-auto">Egyszerű kezelőfelület, profi eredmény.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    <div className="animate-fade-in">
                        <Card title="Átlátható időpontok" description="A Bookly-val egyszerűen és átláthatóan kezeld ügyfeleid időpontjait — minden egy helyen." imageUrl={calendar} />
                    </div>
                    <div className="animate-fade-in [animation-delay:200ms]">
                        <Card title="Kapcsolattartás" description="Felmerülő probléma esetén gyorsan eléred az ügyfeleket, és ők is téged." imageUrl={connectionservices} />
                    </div>
                    <div className="animate-fade-in [animation-delay:400ms]">
                        <Card title="Ütközésmentes naptár" description="Segít az átfedések és ütközések elkerülésében — automatikusan." imageUrl={collision} />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-dark-blue text-white/90 py-10 px-6 mt-auto">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col items-center md:items-start">
                        <span className="text-2xl font-bold mb-1">Bookly</span>
                        <span className="text-sm text-white/50 italic mb-2">Foglalj okosan.</span>
                        <p className="text-sm opacity-60">&copy; {new Date().getFullYear()} Minden jog fenntartva.</p>
                    </div>
                    <div className="flex gap-8 font-medium">
                        <a href="#" className="hover:text-accent-blue transition-colors duration-300">Rólunk</a>
                        <a href="#" className="hover:text-accent-blue transition-colors duration-300">Kapcsolat</a>
                        <a href="#" className="hover:text-accent-blue transition-colors duration-300">Adatvédelem</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}

    