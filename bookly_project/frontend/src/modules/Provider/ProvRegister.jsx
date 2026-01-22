import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProvRegister() {
    const companyNameRef = useRef(null);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const confirmPasswordRef = useRef(null);
    const phoneRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    function validateInputs(companyName, email, password, confirmPassword, phone) {
        if (!companyName || !email || !password || !confirmPassword || !phone) {
            setError('Minden mező kitöltése kötelező');
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

    async function handleRegister(e) {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const companyName = companyNameRef.current.value.trim();
        const email = emailRef.current.value.trim();
        const password = passwordRef.current.value;
        const confirmPassword = confirmPasswordRef.current.value;
        const phone = phoneRef.current.value.trim();

        if (!validateInputs(companyName, email, password, confirmPassword, phone)) {
            return;
        }

        setLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';
            const response = await fetch(`${apiUrl}/auth/provider/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    companyName,
                    email,
                    password,
                    phone
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Regisztráció sikertelen');
            }

            setSuccess('Sikeres regisztráció! Átirányítás a bejelentkezéshez...');
            companyNameRef.current.value = '';
            emailRef.current.value = '';
            passwordRef.current.value = '';
            confirmPasswordRef.current.value = '';
            phoneRef.current.value = '';
            
            setTimeout(() => {
                navigate('/provider/login');
            }, 2000);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-base-blue flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                {/* Glass Card */}
                <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-xl border-2 border-white/50 p-6 sm:p-8 lg:p-10">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/provider/landing')}
                        className="mb-4 text-gray-700 hover:text-gray-900 flex items-center gap-2 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Vissza
                    </button>
                    
                    <h1 className="text-center mb-6 sm:mb-8 text-gray-900">
                        Szolgáltató Regisztráció
                    </h1>

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

                    <form onSubmit={handleRegister} className="space-y-4 sm:space-y-5">
                        {/* Company Name */}
                        <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-gray-900 mb-1.5">
                                Cégnév
                            </label>
                            <input
                                type="text"
                                id="companyName"
                                ref={companyNameRef}
                                className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-lg 
                                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                         text-gray-900 placeholder-gray-500 transition-all"
                                placeholder="Példa Kft."
                                disabled={loading}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1.5">
                                Email cím
                            </label>
                            <input
                                type="email"
                                id="email"
                                ref={emailRef}
                                className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-lg 
                                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                         text-gray-900 placeholder-gray-500 transition-all"
                                placeholder="pelda@email.com"
                                disabled={loading}
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-1.5">
                                Telefonszám
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                ref={phoneRef}
                                className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-lg 
                                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                         text-gray-900 placeholder-gray-500 transition-all"
                                placeholder="+36 30 123 4567"
                                disabled={loading}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-1.5">
                                Jelszó
                            </label>
                            <input
                                type="password"
                                id="password"
                                ref={passwordRef}
                                className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-lg 
                                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                         text-gray-900 placeholder-gray-500 transition-all"
                                placeholder="Min. 8 karakter"
                                disabled={loading}
                            />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 mb-1.5">
                                Jelszó megerősítése
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                ref={confirmPasswordRef}
                                className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-lg 
                                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                         text-gray-900 placeholder-gray-500 transition-all"
                                placeholder="Jelszó újra"
                                disabled={loading}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-white/40 backdrop-blur-md text-gray-900 font-semibold rounded-lg
                                     border-2 border-white/50 hover:bg-white/50 hover:border-white/70
                                     transition-all shadow-lg hover:shadow-xl
                                     disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                        >
                            {loading ? 'Regisztráció...' : 'Regisztráció'}
                        </button>
                    </form>

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
