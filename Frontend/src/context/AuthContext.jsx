import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../lib/api'
import { AuthContext } from './auth-context'
const TOKEN_KEY = 'terrasmart_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)))

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return

    api.get('/users/me')
      .then(({ data }) => setUser(data))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const authenticate = useCallback(async (path, payload) => {
    const { data } = await api.post(path, payload)
    if (!data.token || !data.role) throw new Error('Respons autentikasi tidak valid.')
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data)
    return data
  }, [])

  const value = useMemo(() => ({ user, loading, authenticate, logout }), [user, loading, authenticate, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
