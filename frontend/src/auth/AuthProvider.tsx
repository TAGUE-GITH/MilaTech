import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authApi, tokenStore } from '../api/client'
import type { Role, User } from '../api/types'

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => void
  hasRole: (...roles: Role[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  // Vrai tant que le jeton enregistre n'a pas ete verifie aupres du serveur
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()))

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    window.addEventListener('auth:logout', logout)
    if (tokenStore.get()) {
      authApi
        .me()
        .then(setUser)
        .catch(logout)
        .finally(() => setLoading(false))
    }
    return () => window.removeEventListener('auth:logout', logout)
  }, [logout])

  const login = useCallback(async (email: string, password: string) => {
    const session = await authApi.login(email, password)
    tokenStore.set(session.token)
    setUser(session.user)
    return session.user
  }, [])

  const hasRole = useCallback((...roles: Role[]) => Boolean(user && roles.includes(user.role)), [user])

  const value = useMemo(() => ({ user, loading, login, logout, hasRole }), [user, loading, login, logout, hasRole])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return context
}
