import { Routes, Route, Navigate} from 'react-router-dom'
import Landing from './modules/Landing/Landing'
import Login from './modules/Landing/Login'
import Register from './modules/Landing/Register'
import './App.css'
import { useState,} from 'react'
import { AuthContext } from './modules/auth/auth'
import Dashboard from './modules/Dashboard/Dashboard'

function App() {
  const[isAuthenticated,setIsAuthenticated]=useState(false);

  
  return (
<AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated}}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={isAuthenticated?<Dashboard />:<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
</AuthContext.Provider>
  )
}

export default App
