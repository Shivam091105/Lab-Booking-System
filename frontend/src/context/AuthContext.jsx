import { createContext, useContext, useState, useCallback } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  const login = useCallback(async (credentials) => {
    const res = await authAPI.login(credentials)
    const { token: jwt, ...userData } = res.data.data
    localStorage.setItem('token', jwt)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(jwt)
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  const hasRole = useCallback((role) => {
    return user?.roles?.includes(role)
  }, [user])

  const hasAnyRole = useCallback((...roles) => {
    return roles.some(r => user?.roles?.includes(r))
  }, [user])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasRole, hasAnyRole, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
