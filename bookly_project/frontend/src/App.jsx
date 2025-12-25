import { useState } from 'react'
import Landing from './ modules/Landing/Landing'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  return (
    <>
    {!isLoggedIn && <Landing status={isLoggedIn} />}
    </>
  )
}

export default App
