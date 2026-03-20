import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Landing from './modules/Landing/Landing'
import Login from './modules/Landing/Login'
import Register from './modules/Landing/Register'
import ProvRegister from './modules/Provider/ProvRegister'
import ProvLogin from './modules/Provider/ProvLogin'
import ProvDash from './modules/Provider/provDash'
import Provlanding from './modules/Provider/ProvLanding'
import './App.css' 
import { useState, useEffect } from 'react'
import { AuthContext, getUserFromToken, startAuthHeartbeat, stopAuthHeartbeat, registerNotifier, registerNavigator } from './modules/auth/auth'
import Dashboard from './modules/customer/Dashboard/Dashboard'
import SalonModal from './modules/customer/Dashboard/SalonModal';
import ProtectedRoute from './modules/auth/ProtectedRoute'
import AdminLogin from './modules/Admin/AdminLogin'
import AdminDashboard from './modules/Admin/AdminDashboard'
import ProfileReactivation from './modules/auth/ProfileReactivation'
import NotificationProvider, { useNotification } from './components/NotificationContext'

// Bridge component to connect auth.js notifier with React notification context
function NotifierBridge() {
  const { showToast } = useNotification();
  useEffect(() => {
    registerNotifier(showToast);
    return () => registerNotifier(null);
  }, [showToast]);
  return null;
}

// Bridge component to connect auth.js navigator with React Router
function NavigatorBridge() {
  const navigate = useNavigate();
  useEffect(() => {
    registerNavigator(navigate);
    return () => registerNavigator(null);
  }, [navigate]);
  return null;
}

// Read pending toast from route state (passed via navigate) or localStorage fallback
function PendingToastReader() {
  const location = useLocation();
  const { showToast } = useNotification();
  useEffect(() => {
    // Check route state first (from safeNavigate)
    const pending = location.state?.pendingToast;
    if (pending) {
      showToast(pending.message, pending.type, pending.duration || 10000);
      // Clear state so toast doesn't re-fire on re-render
      window.history.replaceState({}, '');
    } else {
      // Fallback: check localStorage (from hard redirect / fallback path)
      const stored = localStorage.getItem('pendingToast');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          showToast(parsed.message, parsed.type, parsed.duration || 10000);
        } catch (e) { /* ignore */ }
        localStorage.removeItem('pendingToast');
      }
    }
  }, [location.pathname, location.state]);
  return null;
}

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

  // Auth heartbeat — periodic token validation
  useEffect(() => {
    if (isAuthenticated) {
      startAuthHeartbeat();
    } else {
      stopAuthHeartbeat();
    }
    return () => stopAuthHeartbeat();
  }, [isAuthenticated]);

  
  return (
<AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, user, setUser }}>
  <NotificationProvider>
      <NotifierBridge />
      <NavigatorBridge />
      <PendingToastReader />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reactivate" element={<ProfileReactivation />} />
        <Route path="/provider/register" element={<ProvRegister />} />
        <Route path="/provider/login" element={<ProvLogin />} />
        <Route path='/provider/landing' element={<Provlanding />} />
        <Route path='/admin/login' element={<AdminLogin />} />
        
        {/* Protected Customer Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/salon/:salonId" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <SalonModal />
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
        
        {/* Protected Admin Routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
  </NotificationProvider>
</AuthContext.Provider>
  )
}

export default App
