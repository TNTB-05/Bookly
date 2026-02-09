import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddressInput from './AddressInput';

// Steps: 'choice' -> 'joinSalon' or 'createSalon' -> 'userRegistration'
const STEPS = {
    CHOICE: 'choice',
    JOIN_SALON: 'joinSalon',
    CREATE_SALON: 'createSalon',
    USER_REGISTRATION: 'userRegistration'
};

const SALON_TYPES = [
    { value: 'hair', label: 'Fodrászat' },
    { value: 'beauty', label: 'Szépségszalon' },
    { value: 'nail', label: 'Körmös' },
    { value: 'massage', label: 'Masszázs' },
    { value: 'barber', label: 'Borbély' },
    { value: 'spa', label: 'Spa & Wellness' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'other', label: 'Egyéb' }
];

export default function ProvRegister() {
    const navigate = useNavigate();
    
    // Step management
    const [currentStep, setCurrentStep] = useState(STEPS.CHOICE);
    const [registrationType, setRegistrationType] = useState(null); // 'join' or 'create'
    
    // Salon join data
    const [salonCode, setSalonCode] = useState('');
    const [validatedSalonId, setValidatedSalonId] = useState(null);
    const [salonName, setSalonName] = useState('');
    
    // Salon creation data
    const [salonData, setSalonData] = useState({
        companyName: '',
        address: '',
        latitude: null,
        longitude: null,
        description: '',
        salonType: ''
    });
    
    // User registration data
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    
    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Validation functions
    function validateSalonCode() {
        if (!salonCode.trim()) {
            setError('Kérjük adja meg a szalon kódot');
            return false;
        }
        if (salonCode.trim().length < 6) {
            setError('A szalon kód legalább 6 karakter hosszú');
            return false;
        }
        return true;
    }

    function validateSalonData() {
        const { companyName, address, description, salonType, latitude, longitude } = salonData;
        if (!companyName.trim() || !address.trim() || !description.trim() || !salonType) {
            setError('Minden mező kitöltése kötelező');
            return false;
        }
        if (companyName.trim().length < 2) {
            setError('A cégnév legalább 2 karakter hosszú kell legyen');
            return false;
        }
        if (!latitude || !longitude) {
            setError('Kérjük, válassz egy érvényes címet a listából a pontos helymeghatározáshoz');
            return false;
        }
        if (description.trim().length < 10) {
            setError('A leírás legalább 10 karakter hosszú kell legyen');
            return false;
        }
        return true;
    }

    function validateUserData() {
        const { name, email, password, confirmPassword, phone } = userData;
        
        if (!name.trim() || !email.trim() || !password || !confirmPassword || !phone.trim()) {
            setError('Minden mező kitöltése kötelező');
            return false;
        }

        if (name.trim().length < 2) {
            setError('A név legalább 2 karakter hosszú kell legyen');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Érvénytelen email cím');
            return false;
        }

        if (password.length < 8) {
            setError('A jelszónak legalább 8 karakter hosszúnak kell lennie');
            return false;
        }

        if (password !== confirmPassword) {
            setError('A jelszavak nem egyeznek');
            return false;
        }

        const phoneRegex = /^[\d\s+()-]+$/;
        if (!phoneRegex.test(phone)) {
            setError('Érvénytelen telefonszám');
            return false;
        }

        return true;
    }

    // Handlers
    function handleChoiceSelect(choice) {
        setError(null);
        setRegistrationType(choice);
        setCurrentStep(choice === 'join' ? STEPS.JOIN_SALON : STEPS.CREATE_SALON);
    }

    async function handleValidateSalonCode(e) {
        e.preventDefault();
        setError(null);

        if (!validateSalonCode()) return;

        setLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/auth/provider/validate-salon-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: salonCode.trim() })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Érvénytelen szalon kód');
            }

            setValidatedSalonId(data.salonId);
            setSalonName(data.salonName || 'Szalon');
            setCurrentStep(STEPS.USER_REGISTRATION);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function handleSalonDataSubmit(e) {
        e.preventDefault();
        setError(null);

        if (!validateSalonData()) return;

        setCurrentStep(STEPS.USER_REGISTRATION);
    }

    async function handleFinalRegister(e) {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!validateUserData()) return;

        setLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            
            const requestBody = {
                name: userData.name.trim(),
                email: userData.email.trim(),
                phone: userData.phone.trim(),
                password: userData.password,
                registrationType
            };

            if (registrationType === 'join') {
                requestBody.salonId = validatedSalonId;
            } else {
                requestBody.salon = {
                    companyName: salonData.companyName.trim(),
                    address: salonData.address.trim(),
                    description: salonData.description.trim(),
                    salonType: salonData.salonType,
                    latitude: salonData.latitude,
                    longitude: salonData.longitude
                };
            }

            const response = await fetch(`${apiUrl}/auth/provider/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Regisztráció sikertelen');
            }

            setSuccess('Sikeres regisztráció! Átirányítás a bejelentkezéshez...');
            
            setTimeout(() => {
                navigate('/provider/login');
            }, 2000);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function handleBack() {
        setError(null);
        if (currentStep === STEPS.USER_REGISTRATION) {
            setCurrentStep(registrationType === 'join' ? STEPS.JOIN_SALON : STEPS.CREATE_SALON);
        } else if (currentStep === STEPS.JOIN_SALON || currentStep === STEPS.CREATE_SALON) {
            setCurrentStep(STEPS.CHOICE);
            setRegistrationType(null);
            setSalonCode('');
            setValidatedSalonId(null);
            setSalonName('');
            setSalonData({ companyName: '', address: '', description: '', salonType: '' });
        } else {
            navigate('/provider/landing');
        }
    }

    // Step indicator
    function getStepNumber() {
        if (currentStep === STEPS.CHOICE) return 1;
        if (currentStep === STEPS.JOIN_SALON || currentStep === STEPS.CREATE_SALON) return 2;
        return 3;
    }

    const totalSteps = 3;

    // Render functions
    function renderStepIndicator() {
        const stepNum = getStepNumber();
        return (
            <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                        <div 
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                                ${step <= stepNum 
                                    ? 'bg-dark-blue text-white' 
                                    : 'bg-white/40 text-gray-500 border-2 border-white/50'}`}
                        >
                            {step}
                        </div>
                        {step < totalSteps && (
                            <div className={`w-8 sm:w-12 h-1 mx-1 rounded transition-all
                                ${step < stepNum ? 'bg-dark-blue' : 'bg-white/40'}`} 
                            />
                        )}
                    </div>
                ))}
            </div>
        );
    }

    function renderChoiceStep() {
        return (
            <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-semibold text-center text-gray-900 mb-4 sm:mb-6">
                    Hogyan szeretne csatlakozni?
                </h2>
                
                <button
                    onClick={() => handleChoiceSelect('create')}
                    className="w-full p-4 sm:p-6 bg-white/50 backdrop-blur-sm border-2 border-white/60 rounded-xl
                             hover:bg-white/70 hover:border-dark-blue/30 hover:shadow-lg
                             transition-all group text-left"
                >
                    <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-dark-blue/10 rounded-xl flex items-center justify-center flex-shrink-0
                                      group-hover:bg-dark-blue/20 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-dark-blue">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-base sm:text-lg">Új szalon létrehozása</h3>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                Hozzon létre egy új szalont és legyen annak tulajdonosa
                            </p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => handleChoiceSelect('join')}
                    className="w-full p-4 sm:p-6 bg-white/50 backdrop-blur-sm border-2 border-white/60 rounded-xl
                             hover:bg-white/70 hover:border-dark-blue/30 hover:shadow-lg
                             transition-all group text-left"
                >
                    <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-dark-blue/10 rounded-xl flex items-center justify-center flex-shrink-0
                                      group-hover:bg-dark-blue/20 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-dark-blue">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-base sm:text-lg">Csatlakozás meglévő szalonhoz</h3>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                Csatlakozzon egy már létező szalonhoz meghívókóddal
                            </p>
                        </div>
                    </div>
                </button>
            </div>
        );
    }

    function renderJoinSalonStep() {
        return (
            <form onSubmit={handleValidateSalonCode} className="space-y-4 sm:space-y-5">
                <h2 className="text-lg sm:text-xl font-semibold text-center text-gray-900 mb-2">
                    Csatlakozás szalonhoz
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 text-center mb-4 sm:mb-6">
                    Adja meg a szalon tulajdonosától kapott meghívókódot
                </p>

                <div>
                    <label htmlFor="salonCode" className="block text-sm font-medium text-gray-900 mb-1.5">
                        Szalon kód
                    </label>
                    <input
                        type="text"
                        id="salonCode"
                        value={salonCode}
                        onChange={(e) => setSalonCode(e.target.value.toUpperCase())}
                        className="w-full px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                 text-gray-900 placeholder-gray-500 transition-all text-center text-lg sm:text-xl font-mono tracking-wider"
                        placeholder="ABC123"
                        disabled={loading}
                        maxLength={10}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 sm:py-3 bg-dark-blue text-white font-semibold rounded-lg
                             hover:bg-blue-800 transition-all shadow-lg hover:shadow-xl
                             disabled:opacity-50 disabled:cursor-not-allowed mt-4 sm:mt-6"
                >
                    {loading ? 'Ellenőrzés...' : 'Kód ellenőrzése'}
                </button>
            </form>
        );
    }

    function renderCreateSalonStep() {
        return (
            <form onSubmit={handleSalonDataSubmit} className="space-y-4 sm:space-y-5">
                <h2 className="text-lg sm:text-xl font-semibold text-center text-gray-900 mb-4 sm:mb-6">
                    Szalon adatai
                </h2>

                <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-900 mb-1.5">
                        Cégnév / Szalon neve
                    </label>
                    <input
                        type="text"
                        id="companyName"
                        value={salonData.companyName}
                        onChange={(e) => setSalonData({...salonData, companyName: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                 text-gray-900 placeholder-gray-500 transition-all"
                        placeholder="Példa Szépségszalon"
                        disabled={loading}
                    />
                </div>

                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-900 mb-1.5">
                        Cím
                    </label>
                    <AddressInput
                        initialAddress={salonData.address}
                        initialLat={salonData.latitude}
                        initialLng={salonData.longitude}
                        onChange={(addr, lat, lng) => setSalonData({...salonData, address: addr, latitude: lat, longitude: lng})}
                        disabled={loading}
                        required={true}
                    />
                </div>

                <div>
                    <label htmlFor="salonType" className="block text-sm font-medium text-gray-900 mb-1.5">
                        Szalon típusa
                    </label>
                    <select
                        id="salonType"
                        value={salonData.salonType}
                        onChange={(e) => setSalonData({...salonData, salonType: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                 text-gray-900 transition-all appearance-none cursor-pointer"
                        disabled={loading}
                    >
                        <option value="">Válasszon típust...</option>
                        {SALON_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-1.5">
                        Leírás
                    </label>
                    <textarea
                        id="description"
                        value={salonData.description}
                        onChange={(e) => setSalonData({...salonData, description: e.target.value})}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                 text-gray-900 placeholder-gray-500 transition-all resize-none"
                        placeholder="Rövid leírás a szalonról és szolgáltatásairól..."
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 sm:py-3 bg-dark-blue text-white font-semibold rounded-lg
                             hover:bg-blue-800 transition-all shadow-lg hover:shadow-xl
                             disabled:opacity-50 disabled:cursor-not-allowed mt-4 sm:mt-6"
                >
                    Tovább
                </button>
            </form>
        );
    }

    function renderUserRegistrationStep() {
        return (
            <form onSubmit={handleFinalRegister} className="space-y-4 sm:space-y-5">
                <h2 className="text-lg sm:text-xl font-semibold text-center text-gray-900 mb-2">
                    Személyes adatok
                </h2>
                {registrationType === 'join' && salonName && (
                    <p className="text-xs sm:text-sm text-gray-600 text-center mb-4 sm:mb-6">
                        Csatlakozás: <span className="font-semibold text-dark-blue">{salonName}</span>
                    </p>
                )}

                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-1.5">
                        Teljes név
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={userData.name}
                        onChange={(e) => setUserData({...userData, name: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                 text-gray-900 placeholder-gray-500 transition-all"
                        placeholder="Kovács Anna"
                        disabled={loading}
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1.5">
                        Email cím
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={userData.email}
                        onChange={(e) => setUserData({...userData, email: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                 text-gray-900 placeholder-gray-500 transition-all"
                        placeholder="pelda@email.com"
                        disabled={loading}
                    />
                </div>

                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-1.5">
                        Telefonszám
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        value={userData.phone}
                        onChange={(e) => setUserData({...userData, phone: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                 text-gray-900 placeholder-gray-500 transition-all"
                        placeholder="+36 30 123 4567"
                        disabled={loading}
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-1.5">
                        Jelszó
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={userData.password}
                        onChange={(e) => setUserData({...userData, password: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                 text-gray-900 placeholder-gray-500 transition-all"
                        placeholder="Min. 8 karakter"
                        disabled={loading}
                    />
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 mb-1.5">
                        Jelszó megerősítése
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={userData.confirmPassword}
                        onChange={(e) => setUserData({...userData, confirmPassword: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                 text-gray-900 placeholder-gray-500 transition-all"
                        placeholder="Jelszó újra"
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 sm:py-3 bg-dark-blue text-white font-semibold rounded-lg
                             hover:bg-blue-800 transition-all shadow-lg hover:shadow-xl
                             disabled:opacity-50 disabled:cursor-not-allowed mt-4 sm:mt-6"
                >
                    {loading ? 'Regisztráció...' : 'Regisztráció befejezése'}
                </button>
            </form>
        );
    }

    function renderCurrentStep() {
        switch (currentStep) {
            case STEPS.CHOICE:
                return renderChoiceStep();
            case STEPS.JOIN_SALON:
                return renderJoinSalonStep();
            case STEPS.CREATE_SALON:
                return renderCreateSalonStep();
            case STEPS.USER_REGISTRATION:
                return renderUserRegistrationStep();
            default:
                return renderChoiceStep();
        }
    }

    return (
        <div className="min-h-screen bg-base-blue flex items-center justify-center px-4 py-6 sm:py-8">
            <div className="w-full max-w-md">
                {/* Glass Card */}
                <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-xl border-2 border-white/50 p-5 sm:p-6 lg:p-8">
                    {/* Back Button */}
                    <button
                        onClick={handleBack}
                        className="mb-4 text-gray-700 hover:text-gray-900 flex items-center gap-2 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Vissza
                    </button>
                    
                    <h1 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6 text-gray-900">
                        Szolgáltató Regisztráció
                    </h1>

                    {/* Step Indicator */}
                    {renderStepIndicator()}

                    {error && (
                        <div className="mb-4 p-3 bg-red-100/80 backdrop-blur-sm border border-red-400 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-green-100/80 backdrop-blur-sm border border-green-400 text-green-700 rounded-lg text-sm">
                            {success}
                        </div>
                    )}

                    {/* Current Step Content */}
                    {renderCurrentStep()}

                    {/* Login Link */}
                    <p className="text-center mt-6 text-sm text-gray-700">
                        Már van fiókod?{' '}
                        <a href="/provider/login" className="font-semibold text-blue-600 hover:text-blue-700 underline">
                            Bejelentkezés
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
