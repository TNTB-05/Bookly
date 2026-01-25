import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
    const nameRef = useRef(null);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const confirmPasswordRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function validateInputs(name, email, password, confirmPassword) {
        if (!name || !email || !password || !confirmPassword) {
            setError('Minden mező kitöltése kötelező');
            return false;
        }
        if (name.length < 2) {
            setError('A név legalább 2 karakter hosszú legyen');
            return false;
        }
        if (!validateEmail(email)) {
            setError('Kérjük, adjon meg egy érvényes email címet');
            return false;
        }
        if (password.length < 6) {
            setError('A jelszónak legalább 6 karakter hosszúnak kell lennie');
            return false;
        }
        if (password !== confirmPassword) {
            setError('A jelszavak nem egyeznek');
            return false;
        }
        return true;
    }

    async function handleRegister(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const name = nameRef.current.value.trim();
        const email = emailRef.current.value.trim();
        const password = passwordRef.current.value;
        const confirmPassword = confirmPasswordRef.current.value;

        if (!validateInputs(name, email, password, confirmPassword)) {
            setLoading(false);
            return;
        }

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';
            const response = await fetch(`${apiUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // Send cookies with request
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.message || 'Sikeres regisztráció!');
                nameRef.current.value = '';
                emailRef.current.value = '';
                passwordRef.current.value = '';
                confirmPasswordRef.current.value = '';

                // Redirect after 2 seconds
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(data.message || 'Regisztráció sikertelen');
            }
        } catch (error) {
            setError('Hálózati hiba. Kérjük ellenőrizze, hogy a szerver fut-e.');
            console.error('Error:', error);
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
                        onClick={() => navigate('/')}
                        disabled={loading}
                        className="mb-4 text-gray-700 hover:text-gray-900 flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Vissza
                    </button>

                    <h1 className="text-center mb-2 text-gray-900">Regisztráció</h1>
                    <p className="text-center text-gray-700 text-sm mb-6 sm:mb-8">Hozd létre fiókodat a kezdéshez</p>

                    {error && <div className="mb-4 p-3 bg-red-100/80 backdrop-blur-sm border border-red-400 text-red-700 rounded-lg text-sm">{error}</div>}

                    {success && (
                        <div className="mb-4 p-3 bg-green-100/80 backdrop-blur-sm border border-green-400 text-green-700 rounded-lg text-sm">{success}</div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4 sm:space-y-5">
                        {/* Name Field */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-1.5">
                                Név
                            </label>
                            <input
                                type="text"
                                id="name"
                                ref={nameRef}
                                required
                                disabled={loading}
                                className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-lg 
                                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                         text-gray-900 placeholder-gray-500 transition-all disabled:opacity-50"
                                placeholder="Teljes név"
                            />
                        </div>

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1.5">
                                Email cím
                            </label>
                            <input
                                type="email"
                                id="email"
                                ref={emailRef}
                                required
                                disabled={loading}
                                className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-lg 
                                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                         text-gray-900 placeholder-gray-500 transition-all disabled:opacity-50"
                                placeholder="pelda@email.com"
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-1.5">
                                Jelszó
                            </label>
                            <input
                                type="password"
                                id="password"
                                ref={passwordRef}
                                required
                                disabled={loading}
                                className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-lg 
                                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                         text-gray-900 placeholder-gray-500 transition-all disabled:opacity-50"
                                placeholder="Minimum 6 karakter"
                            />
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 mb-1.5">
                                Jelszó megerősítése
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                ref={confirmPasswordRef}
                                required
                                disabled={loading}
                                className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-lg 
                                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                         text-gray-900 placeholder-gray-500 transition-all disabled:opacity-50"
                                placeholder="Jelszó újra"
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
                        <a href="/login" className="font-semibold text-blue-600 hover:text-blue-700 underline">
                            Bejelentkezés
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
