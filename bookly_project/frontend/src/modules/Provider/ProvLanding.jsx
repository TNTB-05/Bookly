import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../pics/logo.png';
import calendar from '../../pics/calendar.png';
import connectionservices from '../../pics/connectionservice.png';
import collision from '../../pics/collision.png';
import landinghero from '../../pics/slider1.png';
import Card from '../Landing/Card';
import Slideshow from './Slideshow';

export default function ProvLanding() {
    const navigate = useNavigate();
    const [billingPeriod, setBillingPeriod] = useState('monthly');

    const isAnnual = billingPeriod === 'annual';

    const prices = {
        alap: isAnnual ? '7 490' : '8 990',
        pro: isAnnual ? '13 325' : '15 990',
        premium: isAnnual ? '24 990' : '29 990',
    };

    const perDay = {
        alap: isAnnual ? '250' : '300',
        pro: isAnnual ? '444' : '533',
        premium: isAnnual ? '833' : '1 000',
    };

    const priceUnit = isAnnual ? 'Ft/hó*' : 'Ft/hó';

    return (
        <div className="min-h-screen bg-base-blue font-sans text-gray-900 flex flex-col pt-16 sm:pt-20 pb-20 sm:pb-0">
            {/* Hero Section */}
            <section className="relative overflow-hidden py-24 sm:py-32 px-6 sm:px-12 lg:px-16 animate-fade-in">
                {/* Decorative blob */}
                <div
                    className="pointer-events-none absolute -top-20 -left-20 w-[400px] h-[400px] bg-accent-blue/20 rounded-full blur-3xl"
                    aria-hidden="true"
                />
                <div className="relative max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
                    {/* Left: text content */}
                    <div className="flex flex-col items-start w-full lg:w-[55%]">
                        <span className="inline-block mb-5 px-4 py-1.5 bg-dark-blue/10 text-dark-blue text-sm font-semibold rounded-full tracking-wide">
                            Szolgáltatóknak
                        </span>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-dark-gray leading-tight mb-6">
                            Tele{' '}
                            <span className="text-dark-blue">naptár</span>
                            ,<br />
                            kevesebb adminisztráció.
                        </h1>
                        <p className="text-lg sm:text-xl text-gray-600 mb-4 max-w-lg leading-relaxed">
                            Automatizálja a foglalásokat, és koncentráljon arra, amiben a legjobb. Kezdje 14 napig ingyen Pro csomaggal.
                        </p>
                        <p className="text-sm text-gray-500 mb-8">
                            500+ partner szalon már regisztrált — csatlakozzon Ön is.
                        </p>
                        <button
                            onClick={() => navigate('/provider/register')}
                            className="bg-dark-blue text-white rounded-lg px-8 py-4 font-bold text-lg hover:opacity-90 shadow-lg transition-opacity"
                        >
                            Kezdje 14 napos Pro próbával
                        </button>
                        <p className="mt-4 text-sm text-gray-500">✓ 14 nap Pro ingyen · ✓ Azonnali indulás · ✓ Szerződés nélkül</p>
                    </div>
                    {/* Right: hero image */}
                    <div className="w-full lg:w-[45%] flex justify-center lg:justify-end">
                        <img
                            src={landinghero}
                            alt="Bookly szolgáltatói felület"
                            className="w-full max-w-md rounded-2xl shadow-2xl"
                        />
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="bg-dark-blue py-8 animate-fade-in [animation-delay:200ms]">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/20">
                        <div className="flex flex-col items-center px-6 py-2 gap-1">
                            <span className="text-3xl font-black tabular-nums text-white">500+</span>
                            <span className="text-sm text-white/70 text-center">Partner szalon</span>
                        </div>
                        <div className="flex flex-col items-center px-6 py-2 gap-1">
                            <span className="text-3xl font-black tabular-nums text-white">12 000+</span>
                            <span className="text-sm text-white/70 text-center">Elvégzett foglalás</span>
                        </div>
                        <div className="flex flex-col items-center px-6 py-2 gap-1">
                            <span className="text-3xl font-black tabular-nums text-white">~3 óra/hét</span>
                            <span className="text-sm text-white/70 text-center">Megtakarított adminisztráció</span>
                        </div>
                        <div className="flex flex-col items-center px-6 py-2 gap-1">
                            <span className="text-3xl font-black tabular-nums text-white">4.8★</span>
                            <span className="text-sm text-white/70 text-center">Partnereink értékelése</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Slideshow */}
            <Slideshow />

            {/* How it works */}
            <section className="bg-light-blue/30 py-20 px-6 sm:px-12 lg:px-16 animate-fade-in [animation-delay:200ms]">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl font-bold text-center text-dark-gray mb-4">Három lépés az induláshoz</h2>
                    <p className="text-center text-gray-500 mb-16 max-w-xl mx-auto">Percek alatt elindulhat — bonyolult integráció vagy IT-tudás nélkül.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {/* Step 1 */}
                        <div className="relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                            <span className="absolute top-4 right-6 text-7xl font-black text-dark-blue/10 select-none leading-none">01</span>
                            <div className="relative z-10">
                                <div className="bg-dark-blue rounded-lg w-12 h-12 flex items-center justify-center mb-5 shadow-md">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-dark-gray mb-2">Regisztráljon percek alatt</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Hozza létre profilját, és vegye fel szalonja adatait egyszerűen.</p>
                            </div>
                        </div>
                        {/* Step 2 */}
                        <div className="relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                            <span className="absolute top-4 right-6 text-7xl font-black text-dark-blue/10 select-none leading-none">02</span>
                            <div className="relative z-10">
                                <div className="bg-dark-blue rounded-lg w-12 h-12 flex items-center justify-center mb-5 shadow-md">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                        />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-dark-gray mb-2">Adja hozzá szolgáltatásait</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Állítsa be naptárát, árait és elérhetőségét egyszerűen, percek alatt.</p>
                            </div>
                        </div>
                        {/* Step 3 */}
                        <div className="relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                            <span className="absolute top-4 right-6 text-7xl font-black text-dark-blue/10 select-none leading-none">03</span>
                            <div className="relative z-10">
                                <div className="bg-dark-blue rounded-lg w-12 h-12 flex items-center justify-center mb-5 shadow-md">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-dark-gray mb-2">Fogadjon ügyfeleket</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Az ügyfelek megtalálják és foglalnak Önnél — Ön csak dolgozik.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Cards */}
            <section className="py-20 px-6 sm:px-12 lg:px-16 animate-fade-in [animation-delay:400ms]">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl font-bold text-center text-dark-gray mb-4">Mindent megkap, ami a sikerhez kell</h2>
                    <p className="text-center text-gray-500 mb-16 max-w-xl mx-auto">Egy platform — minden eszköz.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                        <Card
                            title="Digitális naptár"
                            description="24/7 online foglalási lehetőség ügyfelei számára, automatikus szinkronizációval."
                            imageUrl={calendar}
                        />
                        <Card
                            title="Ügyfélkapcsolat"
                            description="Értesítse ügyfeleit egyszerűen, és csökkentse az elmaradó időpontokat."
                            imageUrl={connectionservices}
                        />
                        <Card
                            title="Átfedésmentes naptár"
                            description="Rendszere automatikusan kezeli az ütközéseket és a szabad időpontokat."
                            imageUrl={collision}
                        />
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="bg-light-blue/30 py-20 px-6 sm:px-12 lg:px-16 animate-fade-in [animation-delay:400ms]">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl sm:text-4xl font-bold text-dark-gray mb-3">Átlátható árak, meglepetések nélkül</h2>
                        <p className="text-gray-500 max-w-xl mx-auto">Válassza ki a vállalkozásához illő csomagot. Bármikor válthat.</p>
                    </div>

                    {/* Billing toggle */}
                    <div className="flex justify-center mb-10">
                        <div className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-full p-1 shadow-sm">
                            <button
                                onClick={() => setBillingPeriod('monthly')}
                                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${billingPeriod === 'monthly' ? 'bg-dark-blue text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Havi
                            </button>
                            <button
                                onClick={() => setBillingPeriod('annual')}
                                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${billingPeriod === 'annual' ? 'bg-dark-blue text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Éves
                                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">2 hónap ingyen</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                        {/* Alap */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-8 flex flex-col shadow-sm">
                            <div className="mb-4">
                                <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">Alap</span>
                                <div className="mt-3 flex items-end gap-1">
                                    <span className="text-4xl font-black text-dark-gray">{prices.alap}</span>
                                    <span className="text-gray-400 mb-1">{priceUnit}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">kevesebb mint {perDay.alap} Ft/nap</p>
                                <p className="text-sm text-gray-500 mt-2">Kisebb szalonoknak, akik most indulnak.</p>
                            </div>
                            {/* Social proof */}
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                </svg>
                                89 szalon ebben a csomagban
                            </div>
                            {/* Value framing callout */}
                            <div className="bg-blue-50 border-l-2 border-dark-blue rounded px-3 py-2 text-xs text-gray-600 italic mb-4">
                                Egyetlen elmulasztott foglalás többe kerül, mint egy havi előfizetés.
                            </div>
                            <ul className="space-y-3 text-sm text-gray-600 mb-0">
                                <li className="flex items-center gap-2">
                                    <span className="text-dark-blue">✓</span> Online foglalási naptár
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-dark-blue">✓</span> Legfeljebb 3 szolgáltatás
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-dark-blue">✓</span> 1 profilfotó
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-dark-blue">✓</span> E-mail értesítők
                                </li>
                                <li className="flex items-center gap-2 text-gray-300">
                                    <span>✗</span> Kiemelés a keresőben (Pro szalonok előbb jelennek meg)
                                </li>
                                <li className="flex items-center gap-2 text-gray-300">
                                    <span>✗</span> Részletes statisztikák
                                </li>
                            </ul>
                            <div className="mt-auto pt-6">
                                <button
                                    onClick={() => navigate('/provider/register')}
                                    className="w-full py-3 rounded-lg border-2 border-dark-blue text-dark-blue font-semibold hover:bg-dark-blue hover:text-white transition-all duration-200"
                                >
                                    Kipróbálom
                                </button>
                                <p className="text-center text-xs text-gray-400 mt-2">14 napos Pro próba · utána Alap díjszabás</p>
                            </div>
                        </div>

                        {/* Pro — Decoy effect: most visible, recommended */}
                        <div className="relative bg-dark-blue rounded-2xl p-8 flex flex-col shadow-xl ring-2 ring-accent-blue/50 shadow-2xl">
                            {/* Top badge strip */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <span className="bg-accent-blue text-dark-blue text-xs font-black px-4 py-1 rounded-full shadow-md whitespace-nowrap">
                                    ⭐ Legtöbb partner ezt választja
                                </span>
                            </div>
                            <div className="mb-4 pt-2">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold tracking-widest uppercase text-white/50">Pro</span>
                                    <span className="text-xs font-semibold text-dark-blue bg-accent-blue px-2.5 py-1 rounded-md">Ajánlott</span>
                                </div>
                                <div className="mt-3 flex items-end gap-1">
                                    <span className="text-4xl font-black text-white">{prices.pro}</span>
                                    <span className="text-white/50 mb-1">{priceUnit}</span>
                                </div>
                                <p className="text-xs text-white/50 mt-1">kevesebb mint {perDay.pro} Ft/nap</p>
                                <p className="text-sm text-white/70 mt-2">Növekvő szalonoknak, akik több ügyfelet szeretnének.</p>
                            </div>
                            {/* Social proof */}
                            <div className="flex items-center gap-1.5 text-xs text-accent-blue mb-4">
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                </svg>
                                247 szalon ebben a csomagban
                            </div>
                            <ul className="space-y-3 text-sm text-white/80 mb-0">
                                <li className="flex items-center gap-2">
                                    <span className="text-accent-blue">✓</span> Online foglalási naptár
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-accent-blue">✓</span> Korlátlan szolgáltatás
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-accent-blue">✓</span> E-mail + SMS értesítők
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-accent-blue">✓</span> Elsőbbség a keresőben (Alap előtt jelenik meg)
                                </li>
                                <li className="flex items-center gap-2 text-white/30">
                                    <span>✗</span> Részletes statisztikák
                                </li>
                            </ul>
                            <div className="mt-auto pt-6">
                                <button
                                    onClick={() => navigate('/provider/register')}
                                    className="w-full py-3 rounded-lg bg-white text-dark-blue font-bold hover:bg-base-blue transition-colors duration-200 shadow-md"
                                >
                                    Kezdje 14 napig ingyen
                                </button>
                                <p className="text-center text-xs text-white/40 mt-2">
                                    14 nap után {isAnnual ? '13 325 Ft/hó' : '15 990 Ft/hó'}
                                </p>
                            </div>
                        </div>

                        {/* Prémium */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-8 flex flex-col shadow-sm">
                            <div className="mb-4">
                                <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">Prémium</span>
                                <div className="mt-3 flex items-end gap-1">
                                    <span className="text-4xl font-black text-dark-gray">{prices.premium}</span>
                                    <span className="text-gray-400 mb-1">{priceUnit}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">kevesebb mint {perDay.premium} Ft/nap</p>
                                <p className="text-sm text-gray-500 mt-2">Több telephelyes vagy nagy forgalmú szalonoknak.</p>
                            </div>
                            {/* Social proof */}
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                </svg>
                                41 szalon ebben a csomagban
                            </div>
                            <ul className="space-y-3 text-sm text-gray-600 mb-0">
                                <li className="flex items-center gap-2">
                                    <span className="text-dark-blue">✓</span> Online foglalási naptár
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-dark-blue">✓</span> Korlátlan szolgáltatás
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-dark-blue">✓</span> E-mail + SMS értesítők
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-dark-blue">✓</span> Kiemelés a keresőben
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-dark-blue">✓</span> Részletes statisztikák
                                </li>
                            </ul>
                            <div className="mt-auto pt-6">
                                <button
                                    onClick={() => navigate('/provider/register')}
                                    className="w-full py-3 rounded-lg border-2 border-dark-blue text-dark-blue font-semibold hover:bg-dark-blue hover:text-white transition-all duration-200"
                                >
                                    Kipróbálom
                                </button>
                                <p className="text-center text-xs text-gray-400 mt-2 invisible select-none" aria-hidden="true">&nbsp;</p>
                            </div>
                        </div>
                    </div>

                    {isAnnual && <p className="text-center text-xs text-gray-400 mt-4">*Éves fizetéssel, egyszeri számlázással.</p>}
                    <p className="text-center text-sm text-gray-400 mt-3">Minden csomag havi számlázással, szerződéskötési kötelezettség nélkül.</p>
                </div>
            </section>

            {/* Conversion CTA — Trial Framing */}
            <section className="py-20 px-6 sm:px-12 animate-fade-in [animation-delay:400ms]">
                <div className="max-w-4xl mx-auto">
                    <div className="relative bg-dark-blue rounded-3xl px-10 py-16 sm:px-16 sm:py-20 text-center overflow-hidden">
                        {/* Decorative accent blob inside card */}
                        <div className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 bg-accent-blue/20 rounded-full blur-3xl" aria-hidden="true" />
                        <div className="pointer-events-none absolute -bottom-16 -left-16 w-72 h-72 bg-accent-blue/10 rounded-full blur-3xl" aria-hidden="true" />
                        <div className="relative z-10">
                            <span className="inline-block mb-5 text-xs font-semibold tracking-widest uppercase text-white/50 bg-white/10 px-3 py-1 rounded-full">
                                Csatlakozzon ma
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 leading-tight">
                                Próbálja 14 napig ingyen —<br className="hidden sm:block" /> Pro csomaggal.
                            </h2>
                            <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
                                Ha nem tetszik, visszalép Alap csomagra. Ha tetszik — naptára már tele lesz.
                            </p>
                            <button
                                onClick={() => navigate('/provider/register')}
                                className="bg-white text-dark-blue rounded-lg px-10 py-4 font-bold text-lg hover:bg-base-blue transition-colors shadow-lg"
                            >
                                Kezdje 14 napos Pro próbával
                            </button>
                            <p className="mt-5 text-sm text-white/40">✓ 14 nap Pro ingyen · ✓ Azonnali indulás · ✓ Szerződés nélkül</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-dark-blue text-white/90 py-10 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col items-center md:items-start gap-1">
                        <img src={logo} alt="Bookly" className="h-10 w-auto object-contain brightness-0 invert mb-1" />
                        <p className="text-sm text-white/60 italic">Partnereivel együtt növekszik.</p>
                        <p className="text-xs text-white/40 mt-1">&copy; {new Date().getFullYear()} Minden jog fenntartva.</p>
                        <p className="text-xs text-white/40 italic mt-2 max-w-sm">
                            Nem vagyunk a legolcsóbb szoftver a piacon — de az egyetlen, ahol az ügyfelek aktívan keresik az Ön szalonját.
                        </p>
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
