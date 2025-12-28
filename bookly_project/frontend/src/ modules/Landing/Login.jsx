import { useState, useRef } from "react"


export default function Login(){
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

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
        <>
        <div>
            <form onSubmit={handleLogin}>
                <div>
                    <div><label htmlFor="email">Email:</label><input type="email" id="email" ref={emailRef} /></div>
                    <div><label htmlFor="password">Password:</label><input type="password" id="password" ref={passwordRef} /></div>
                </div>
                {error && <div className="text-red-500">{error}</div>}
                {success && <div className="text-green-500">{success}</div>}
                <button type="submit" className="LoginButton" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
        </>
    )
}