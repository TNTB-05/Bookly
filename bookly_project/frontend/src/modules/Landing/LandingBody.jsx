import { useNavigate } from 'react-router-dom';

import Card from './Card';

//képek importálása
import appointment from '../../pics/appointment.png';
import services from '../../pics/services.png';
import allinone from '../../pics/allinone.png';
import calendar from '../../pics/calendar.png';
import connectionservices from '../../pics/connectionservice.png';
import collision from '../../pics/collision.png';
import landinghero from '../../pics/landinghero.png';

export default function LandingBody() {
    const navigate = useNavigate();

    return (
        <div className="pt-16 sm:pt-20 pb-20 sm:pb-0">
            {/* Hero Section */}
            <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                    <div className="flex flex-col items-start max-w-xl w-full lg:w-1/2">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-dark-blue leading-tight mb-6">Foglalj egyszerűen és gyorsan</h1>
                        <p className="text-lg sm:text-xl text-gray-700 mb-8">
                            Tedd egyszerűbbé a foglalást a Bookly-val. Találd meg a legjobb szolgáltatókat a közeledben.
                        </p>
                        <button
                            className="px-8 py-4 bg-dark-blue text-white font-bold rounded-2xl hover:bg-blue-800 transition-all shadow-xl text-lg hover:scale-105 active:scale-95 duration-200"
                            onClick={() => navigate('/login')}
                        >
                            Foglalás most
                        </button>
                    </div>
                    <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
                        <img
                            src={landinghero}
                            alt="Bookly Hero"
                            className="w-full max-w-lg rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-500"
                        />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="bg-light-blue/50 backdrop-blur-sm rounded-[3rem] mx-4 sm:mx-6 lg:mx-8 shadow-inner border border-white/50">
                <div className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
                    <h2 className="text-3xl sm:text-4xl font-bold text-center text-dark-blue mb-4">Miért használd a Bookly-t?</h2>
                    <p className="text-center text-gray-600 mb-12">Fedezd fel, miért választanak minket több ezren</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        <Card title="Időpont foglalás" description="Egyszerű és gyors időpontfoglalás a kedvenc szolgáltatóidhoz." imageUrl={appointment} />
                        <Card title="Széles Választék" description="Partnereink széles választékából tudsz böngészni kedvedre." imageUrl={services} />
                        <Card title="Minden egy helyen" description="Nálunk minden szolgáltatás elérhető egy helyen." imageUrl={allinone} />
                    </div>
                </div>
            </section>

            {/* Provider CTA Section */}
            <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                <div className="bg-white/40 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 p-8 sm:p-12 text-center mx-4 sm:mx-6 lg:mx-8">
                    <h2 className="text-3xl sm:text-4xl font-bold text-dark-blue mb-4">Vállalkozó vagy?</h2>
                    <p className="text-lg text-gray-700 mb-8">
                        Szeretnél egy egyszerű és átlátható rendszert a foglalások kezelésére? Csatlakozz partnereinkhez!
                    </p>
                    <button
                        onClick={() => navigate('/provider/landing')}
                        className="px-8 py-4 bg-dark-blue text-white font-bold rounded-2xl hover:bg-blue-800 transition-all shadow-xl text-lg hover:scale-105 active:scale-95 duration-200"
                    >
                        Csatlakozz!
                    </button>
                </div>
            </section>

            {/* Provider Features */}
            <section className="px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    <Card
                        title="Átlátható időpontok"
                        description="A Bookly-val egyszerűen és átláthatóan tudod kezelni ügyfeleid időpontjait."
                        imageUrl={calendar}
                    />
                    <Card
                        title="Kapcsolatbiztosítás"
                        description="Felmerülő probléma esetén gyorsan el tudod érni az ügyfeleket."
                        imageUrl={connectionservices}
                    />
                    <Card title="Időpont-egyeztetés támogatás" description="Segít az átfedések és ütközések elkerülésében." imageUrl={collision} />
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-dark-blue text-white/90 py-10 px-6 mt-auto">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col items-center md:items-start">
                        <span className="text-2xl font-bold mb-2">Bookly</span>
                        <p className="text-sm opacity-80">&copy; {new Date().getFullYear()} Minden jog fenntartva.</p>
                    </div>
                    <div className="flex gap-8 font-medium">
                        <a href="#" className="hover:text-accent-blue transition-colors">
                            Rólunk
                        </a>
                        <a href="#" className="hover:text-accent-blue transition-colors">
                            Kapcsolat
                        </a>
                        <a href="#" className="hover:text-accent-blue transition-colors">
                            Adatvédelem
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
