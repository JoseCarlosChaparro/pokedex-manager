import { useState } from 'react'
import AuthForm from './components/AuthForm'
import { getToken } from './api'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getToken()))

  if (!isAuthenticated) return <AuthForm onAuthenticated={() => setIsAuthenticated(true)} />
  return <p className="p-4">Sesión iniciada</p>
}