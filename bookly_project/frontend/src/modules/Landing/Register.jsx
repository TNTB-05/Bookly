import{ useState, useRef } from "react"
import { useNavigate } from "react-router-dom"


export default function Register(){
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

    function validateInputs(email, password, confirmPassword) {
        if (!email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return false;
        }
        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return false;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        return true;
    }

    async function handleRegister(e){
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const email = emailRef.current.value.trim();
        const password = passwordRef.current.value;
        const confirmPassword = confirmPasswordRef.current.value;

        if (!validateInputs(email, password, confirmPassword)) {
            setLoading(false);
            return;
        }

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';
            const response = await fetch(`${apiUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Send cookies with request
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.message || 'Registration successful!');
                emailRef.current.value = '';
                passwordRef.current.value = '';
                confirmPasswordRef.current.value = '';
                
                // Redirect after 2 seconds
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (error) {
            setError('Network error. Please check if the server is running.');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }

    return(
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Register</h1>
                <p className="text-center text-gray-600 text-sm mb-8">Create your account to get started</p>
                
                <form onSubmit={handleRegister} className="space-y-5">
                    {/* Email Field */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input 
                            type="email" 
                            id="email" 
                            ref={emailRef}
                            required
                            disabled={loading}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition disabled:bg-gray-100"
                            placeholder="Enter your email"
                        />
                    </div>

                    {/* Password Field */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input 
                            type="password" 
                            id="password" 
                            ref={passwordRef}
                            required
                            disabled={loading}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition disabled:bg-gray-100"
                            placeholder="Enter your password (min 6 characters)"
                        />
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm Password
                        </label>
                        <input 
                            type="password" 
                            id="confirmPassword" 
                            ref={confirmPasswordRef}
                            required
                            disabled={loading}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition disabled:bg-gray-100"
                            placeholder="Confirm your password"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate-pulse">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                            ✓ {success}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 transform hover:scale-105 active:scale-95"
                    >
                        {loading ? '⏳ Registering...' : 'Register'}
                    </button>
                </form>

                <p className="text-center text-gray-600 text-sm mt-6">
                    Already have an account? <button onClick={() => navigate('/login')} className="text-indigo-600 hover:text-indigo-700 font-semibold bg-none border-none cursor-pointer">Login here</button>
                </p>

                <button 
                    onClick={() => navigate('/')}
                    disabled={loading}
                    className="w-full mt-4 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                >
                    ← Back to Home
                </button>
            </div>
        </div>
    )
}