import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AppShell } from '@/components/AppShell'
import { AuthProvider, useAuth } from '@/auth/AuthContext'
import { LoginPage } from '@/auth/LoginPage'
import { CategoriesPage } from '@/features/categories/CategoriesPage'
import { CandidatesPage } from '@/features/questions/CandidatesPage'
import { QuestionEditor } from '@/features/questions/QuestionEditor'
import { QuestionsPage } from '@/features/questions/QuestionsPage'

function RequireAdmin({ children }: { children: ReactNode }) {
  const { session, isAdmin, loading } = useAuth()

  if (loading) {
    return <p className="p-6 text-sm text-muted-foreground">확인 중...</p>
  }

  if (!session || !isAdmin) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAdmin>
            <AppShell />
          </RequireAdmin>
        }
      >
        <Route index element={<Navigate to="/categories" replace />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/questions" element={<QuestionsPage />} />
        <Route path="/questions/new" element={<QuestionEditor mode="new" />} />
        <Route path="/questions/:id" element={<QuestionEditor mode="edit" />} />
        <Route path="/candidates" element={<CandidatesPage />} />
        <Route path="/candidates/:id" element={<QuestionEditor mode="candidate" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster />
    </AuthProvider>
  )
}

export default App
