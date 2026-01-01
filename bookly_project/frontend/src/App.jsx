import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './ modules/Landing/Landing'
import Login from './ modules/Landing/Login'
import Register from './ modules/Landing/Register'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
