import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth';

export default function AdminLogin() {
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
        return true;
    }

    async function handleLogin(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const email = emailRef.current.value.trim();
        const password = passwordRef.current.value;

        if (!validateInputs(email, password)) {
            setLoading(false);
            return;
        }

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/auth/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.message || 'Sikeres bejelentkezés!');
                localStorage.setItem('accessToken', data.accessToken);
                setIsAuthenticated(true);
                setTimeout(() => navigate('/admin/dashboard'), 1000);
            } else {
                setError(data.message || 'Bejelentkezés sikertelen');
            }
        } catch (error) {
            setError('Hálózati hiba. Kérjük ellenőrizze, hogy a szerver fut-e.');
            console.error('Admin login error:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8 lg:p-10">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/')}
                        className="mb-4 text-gray-300 hover:text-white flex items-center gap-2 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Vissza
                    </button>

                    {/* Header */}
                    <div className="text-center mb-6 sm:mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-amber-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                        <p className="text-gray-400 text-sm mt-1">Bookly adminisztrációs felület</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-300 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-green-500/20 backdrop-blur-sm border border-green-500/30 text-green-300 rounded-lg text-sm">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                                Email cím
                            </label>
                            <input
                                type="email"
                                id="email"
                                ref={emailRef}
                                required
                                className="w-full px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg
                                         focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50
                                         text-white placeholder-gray-500 transition-all"
                                placeholder="admin@bookly.com"
                                disabled={loading}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                                Jelszó
                            </label>
                            <input
                                type="password"
                                id="password"
                                ref={passwordRef}
                                required
                                className="w-full px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg
                                         focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50
                                         text-white placeholder-gray-500 transition-all"
                                placeholder="Jelszó"
                                disabled={loading}
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg
                                     transition-all shadow-lg hover:shadow-xl
                                     disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                        >
                            {loading ? 'Bejelentkezés...' : 'Bejelentkezés'}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-4 text-xs text-gray-500">
                    Bookly Admin &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
