import { useState, useEffect } from 'react'
import type { User } from '../types'
import { getMe } from '../api/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem('token')
  const isLoggedIn = !!token

  useEffect(() => {
    if (!token) { setLoading(false); return }
    getMe()
      .then(setUser)
      .catch(() => { localStorage.removeItem('token'); setUser(null) })
      .finally(() => setLoading(false))
  }, [token])

  return { user, isLoggedIn, loading }
}
