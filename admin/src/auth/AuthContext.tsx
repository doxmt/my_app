import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  session: Session | null
  isAdmin: boolean
  loading: boolean
  login: (password: string) => Promise<string | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (error || !data) return false
  return data.is_admin === true
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function init() {
      const { data } = await supabase.auth.getSession()
      const currentSession = data.session

      if (currentSession) {
        const admin = await checkIsAdmin(currentSession.user.id)
        if (cancelled) return
        if (!admin) {
          await supabase.auth.signOut()
          setSession(null)
          setIsAdmin(false)
        } else {
          setSession(currentSession)
          setIsAdmin(true)
        }
      }

      if (!cancelled) setLoading(false)
    }

    init()

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!newSession) {
        setSession(null)
        setIsAdmin(false)
      }
    })

    return () => {
      cancelled = true
      subscription.subscription.unsubscribe()
    }
  }, [])

  async function login(password: string): Promise<string | null> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: import.meta.env.VITE_ADMIN_EMAIL,
      password,
    })

    if (error || !data.session) {
      return error?.message ?? '로그인에 실패했습니다.'
    }

    const admin = await checkIsAdmin(data.session.user.id)
    if (!admin) {
      await supabase.auth.signOut()
      return '관리자 권한이 없는 계정입니다.'
    }

    setSession(data.session)
    setIsAdmin(true)
    return null
  }

  async function logout() {
    await supabase.auth.signOut()
    setSession(null)
    setIsAdmin(false)
  }

  return (
    <AuthContext.Provider value={{ session, isAdmin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
