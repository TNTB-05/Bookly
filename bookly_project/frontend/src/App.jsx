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
import { AuthContext, getUserFromToken } from './modules/auth/auth'
import Dashboard from './modules/costumer/Dashboard/Dashboard'
import DashboardTest from './modules/costumer/Dashboard/DashboardTest';
import ProtectedRoute from './modules/auth/ProtectedRoute'

function App() {
  const[isAuthenticated,setIsAuthenticated]=useState(!!localStorage.getItem('accessToken'));
  const[user, setUser] = useState(getUserFromToken());

  // Listen for storage changes (works across tabs and when token is removed)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'accessToken') {
        setIsAuthenticated(!!e.newValue);
        setUser(e.newValue ? getUserFromToken() : null);
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
        setUser(null);
      }
    };

    // Override localStorage.setItem to detect same-tab setting
    const originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = (key, value) => {
      originalSetItem(key, value);
      if (key === 'accessToken') {
        setIsAuthenticated(!!value);
        setUser(getUserFromToken());
      }
    };

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      localStorage.removeItem = originalRemoveItem;
      localStorage.setItem = originalSetItem;
    };
  }, []);

  
  return (
<AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, user, setUser }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/provider/register" element={<ProvRegister />} />
        <Route path="/provider/login" element={<ProvLogin />} />
        <Route path='/provider/landing' element={<Provlanding />} />
        
        {/* Protected Customer Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Provider Routes */}
        <Route 
          path="/ProvDash" 
          element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProvDash />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
</AuthContext.Provider>
  )
}

export default App
