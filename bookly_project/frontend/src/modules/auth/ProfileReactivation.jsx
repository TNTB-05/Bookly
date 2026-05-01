import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import { useNotification } from '../../components/NotificationContext';
import BackArrowIcon from '../../icons/BackArrowIcon';
import UserPlusIcon from '../../icons/UserPlusIcon';
import { API_URL } from '../../config';

export default function ProfileReactivation() {
    const navigate = useNavigate();
    const { setIsAuthenticated } = useAuth();
    const { showToast } = useNotification();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Verify reactivation token exists on mount
    useEffect(() => {
        const token = sessionStorage.getItem('reactivationToken');
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError('A név megadása kötelező');
            return;
        }

        if (!phone.trim()) {
            setError('A telefonszám megadása kötelező');
            return;
        }

        setLoading(true);

        try {
            const reactivationToken = sessionStorage.getItem('reactivationToken');
            if (!reactivationToken) {
                setError('Az újraaktiválási token lejárt. Kérjük, jelentkezz be újra.');
                setTimeout(() => navigate('/login'), 2000);
                return;
            }

            const apiUrl = API_URL;
            const response = await fetch(`${apiUrl}/auth/reactivate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    reactivationToken,
                    name: name.trim(),
                    phone: phone.trim() || null,
                    address: address.trim() || null
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                sessionStorage.removeItem('reactivationToken');
                localStorage.setItem('accessToken', data.accessToken);
                setIsAuthenticated(true);
                showToast('Fiók sikeresen újraaktiválva! Üdvözlünk újra!', 'success', 5000);
                setTimeout(() => navigate('/dashboard'), 1000);
            } else {
                setError(data.message || 'Hiba történt az újraaktiválás során');
                if (response.status === 401) {
                    // Token expired
                    sessionStorage.removeItem('reactivationToken');
                    setTimeout(() => navigate('/login'), 3000);
                }
            }
        } catch (err) {
            setError('Hálózati hiba. Kérjük ellenőrizze, hogy a szerver fut-e.');
            console.error('Reactivation error:', err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-base-blue flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-xl border-2 border-white/50 p-6 sm:p-8 lg:p-10">
                    {/* Back Button */}
                    <button
                        onClick={() => {
                            sessionStorage.removeItem('reactivationToken');
                            navigate('/login');
                        }}
                        className="mb-4 text-gray-700 hover:text-gray-900 flex items-center gap-2 transition-colors"
                    >
                        <BackArrowIcon className="w-5 h-5" />
                        Vissza a bejelentkezéshez
                    </button>

                    {/* Header */}
                    <div className="text-center mb-6 sm:mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 border border-blue-200 mb-4">
                            <UserPlusIcon className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Fiók újraaktiválása</h1>
                        <p className="text-gray-600 text-sm mt-2">
                            A fiókod korábban törlésre került. Kérjük, add meg újra az adataidat a folytatáshoz.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100/80 backdrop-blur-sm border border-red-400 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                        {/* Name field (required) */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-1.5">
                                Név <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-lg 
                                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                         text-gray-900 placeholder-gray-500 transition-all"
                                placeholder="Teljes neved"
                                disabled={loading}
                            />
                        </div>

                        {/* Phone field (required) */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-1.5">
                                Telefonszám <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-lg 
                                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                         text-gray-900 placeholder-gray-500 transition-all"
                                placeholder="+36 30 123 4567"
                                disabled={loading}
                            />
                        </div>

                        {/* Address field (optional) */}
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-900 mb-1.5">
                                Cím <span className="text-gray-400 font-normal italic text-xs ml-1">(opcionális)</span>
                            </label>
                            <input
                                type="text"
                                id="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-lg 
                                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                         text-gray-900 placeholder-gray-500 transition-all"
                                placeholder="Budapest, Példa utca 1."
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
                            {loading ? 'Újraaktiválás...' : 'Fiók újraaktiválása'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
