import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Login from "./Login";
import Register from "./Register";


export default function LandingHeader(){
    const [showForm, setShowForm] = useState(null);
    const navigate = useNavigate();

    function handleLoginClick(){
        navigate('/login');
    }

    function handleRegisterClick(){
        navigate('/register');
    }

    return(
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">Welcome to Bookly</h1>
            <p className="text-lg text-gray-600 mb-8">Your personal book management companion</p>
            <div className="flex gap-4">
                <button 
                    onClick={handleLoginClick}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
                >
                    Login
                </button>
                <button 
                    onClick={handleRegisterClick}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
                >
                    Register
                </button>
            </div>
        </div>
    )
}

