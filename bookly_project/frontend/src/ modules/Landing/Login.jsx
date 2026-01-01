import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"


export default function Login(){
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    function validateInputs(email, password) {
        if (!email || !password) {
            setError('Please fill in all fields');
            return false;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        return true;
    }

    async function handleLogin(e){
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
            const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';
            const response = await fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setSuccess(data.message || 'Login successful!');
                console.log('Login successful:', data);
                
                emailRef.current.value = '';
                passwordRef.current.value = '';
                
                // TODO: Save token and redirect
                // if (data.token) {
                //     localStorage.setItem('token', data.token);
                //     window.location.href = '/dashboard';
                // }
            } else {
                setError(data.message || 'Login failed');
                console.error('Login failed:', data);
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
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Login</h1>
                
                <form onSubmit={handleLogin} className="space-y-5">
                    {/* Email Field */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input 
                            type="email" 
                            id="email" 
                            ref={emailRef}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                            placeholder="Enter your password"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                            {success}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 transform hover:scale-105 active:scale-95"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <p className="text-center text-gray-600 text-sm mt-6">
                    Don't have an account? <button onClick={() => navigate('/register')} className="text-indigo-600 hover:text-indigo-700 font-semibold bg-none border-none cursor-pointer">Register</button>
                </p>
                
                <button 
                    onClick={() => navigate('/')}
                    className="w-full mt-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                >
                    ← Back to Home
                </button>
            </div>
        </div>
    )
}
