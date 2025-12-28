import{ useState, useRef } from "react"


export default function Register(){
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const confirmPasswordRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    function validateInputs(email, password, confirmPassword) {
        if (!email || !password || !confirmPassword) {
            setError('Please fill in all fields');
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

        const email = emailRef.current.value;
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
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.message || 'Registration successful!');
                console.log('Registration successful:', data);

                emailRef.current.value = '';
                passwordRef.current.value = '';
                confirmPasswordRef.current.value = '';

                // TODO: Redirect to login page
                // window.location.href = '/login';
            } else {
                setError(data.message || 'Registration failed');
                console.error('Registration failed:', data);
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
        <form onSubmit={handleRegister}>
           <div>
                <div><label htmlFor="email">Email:</label><input type="email" id="email" ref={emailRef} /></div>
                <div><label htmlFor="password">Password:</label><input type="password" id="password" ref={passwordRef} /></div>
                <div><label htmlFor="confirmPassword">Confirm Password:</label><input type="password" id="confirmPassword" ref={confirmPasswordRef} /></div>
                <div><button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button></div>
                {error && <div className="text-red-500">{error}</div>}
                {success && <div className="text-green-500">{success}</div>}
                

           </div>
        </form>
        </>
    )
}