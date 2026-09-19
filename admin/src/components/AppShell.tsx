import { NavLink, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/auth/AuthContext'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/categories', label: '카테고리' },
  { to: '/questions', label: '문제' },
  { to: '/candidates', label: '후보 승인' },
]

export function AppShell() {
  const { logout } = useAuth()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <nav className="flex gap-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn('text-sm font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Button variant="outline" size="sm" onClick={() => logout()}>
          로그아웃
        </Button>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
