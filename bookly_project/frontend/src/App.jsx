import { Routes, Route, Navigate} from 'react-router-dom'
import Landing from './modules/Landing/Landing'
import Login from './modules/Landing/Login'
import Register from './modules/Landing/Register'
import ProvRegister from './modules/Provider/provRegister'
import ProvLogin from './modules/Provider/provLogin'
import ProvDash from './modules/Provider/provDash'
import Provlanding from './modules/Provider/ProvLanding'
import './App.css' 
import { useState, useEffect } from 'react'
import { AuthContext } from './modules/auth/auth'
import Dashboard from './modules/costumer/Dashboard/Dashboard'

function App() {
  const[isAuthenticated,setIsAuthenticated]=useState(!!localStorage.getItem('accessToken'));

  // Listen for storage changes (works across tabs and when token is removed)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'accessToken') {
        setIsAuthenticated(!!e.newValue);
      }
    };

    // Listen for storage events from other tabs
    window.addEventListener('storage', handleStorageChange);

    // Override localStorage.removeItem to detect same-tab removal
    const originalRemoveItem = localStorage.removeItem.bind(localStorage);
    localStorage.removeItem = (key) => {
      originalRemoveItem(key);
      if (key === 'accessToken') {
        setIsAuthenticated(false);
      }
    };

    // Override localStorage.setItem to detect same-tab setting
    const originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = (key, value) => {
      originalSetItem(key, value);
      if (key === 'accessToken') {
        setIsAuthenticated(!!value);
      }
    };

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      localStorage.removeItem = originalRemoveItem;
      localStorage.setItem = originalSetItem;
    };
  }, []);

  
  return (
<AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated}}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/provider/register" element={<ProvRegister />} />
        <Route path="/provider/login" element={<ProvLogin />} />
        <Route path='/provider/landing' element={<Provlanding />} />
        <Route path="/dashboard" element={isAuthenticated?<Dashboard />:<Navigate to="/login" />} />
        <Route path="/ProvDash" element={isAuthenticated?<ProvDash />:<Navigate to="/provider/login" />} />
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
</AuthContext.Provider>
  )
}

export default App
