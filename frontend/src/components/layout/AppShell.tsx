import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ClickSpark, FadeContent } from '@/components/react-bits'
import { useAuth } from '@/features/auth/AuthContext'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  if (!user) return <Navigate to="/login" replace />

  return (
    <ClickSpark className="min-h-screen" sparkColor="#2563eb" sparkCount={6}>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        <div
          className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-200 ${
            collapsed ? 'ml-[62px]' : 'ml-[256px]'
          }`}
        >
          <Topbar />
          <main className="flex-1 px-[18px] py-3.5">
            <FadeContent key={pathname} blur>
              <Outlet />
            </FadeContent>
          </main>
        </div>
      </div>
    </ClickSpark>
  )
}
