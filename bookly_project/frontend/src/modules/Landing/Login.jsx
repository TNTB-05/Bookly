import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth';

export default function Login() {
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();
    const { setIsAuthenticated } = useAuth();

    function validateInputs(email, password) {
        if (!email || !password) {
            setError('Minden mező kitöltése kötelező');
            return false;
        }
        if (password.length < 6) {
            setError('A jelszónak legalább 6 karakter hosszúnak kell lennie');
            return false;
        }
        return true;
    }

    async function handleLogin(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const email = emailRef.current.value;
        const password = passwordRef.current.value;

        if (!validateInputs(email, password)) {
            setLoading(false);
            return;
        }

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // Send cookies with request
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.message || 'Sikeres bejelentkezés!');
                console.log('Login successful:', data);

                emailRef.current.value = '';
                passwordRef.current.value = '';

                localStorage.setItem('accessToken', data.accessToken);
                setIsAuthenticated(true);

                setTimeout(() => navigate('/dashboard'), 2000);
            } else {
                setError(data.message || 'Bejelentkezés sikertelen');
                console.error('Login failed:', data);
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
                    <button onClick={() => navigate('/')} className="mb-4 text-gray-700 hover:text-gray-900 flex items-center gap-2 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Vissza
                    </button>

                    <h1 className="text-center mb-6 sm:mb-8 text-gray-900">Bejelentkezés</h1>

                    {error && <div className="mb-4 p-3 bg-red-100/80 backdrop-blur-sm border border-red-400 text-red-700 rounded-lg text-sm">{error}</div>}

                    {success && (
                        <div className="mb-4 p-3 bg-green-100/80 backdrop-blur-sm border border-green-400 text-green-700 rounded-lg text-sm">{success}</div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
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
                                className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-lg 
                                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                         text-gray-900 placeholder-gray-500 transition-all"
                                placeholder="pelda@email.com"
                                disabled={loading}
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
                                className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-lg 
                                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                         text-gray-900 placeholder-gray-500 transition-all"
                                placeholder="Jelszó"
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
                            {loading ? 'Bejelentkezés...' : 'Bejelentkezés'}
                        </button>
                    </form>

                    {/* Register Link */}
                    <p className="text-center mt-6 text-sm text-gray-700">
                        Még nincs fiókod?{' '}
                        <a href="/register" className="font-semibold text-blue-600 hover:text-blue-700 underline">
                            Regisztráció
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
