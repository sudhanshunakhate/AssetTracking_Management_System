import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ClickSpark, FadeContent } from '@/components/react-bits'
import { useAuth } from '@/features/auth/AuthContext'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { LoginNotificationPopup, NotificationToasts, WindowsPushPrompt } from '@/features/notifications/NotificationBell'

export function AppShell() {
  const { user, sessionReady } = useAuth()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-current',
      collapsed ? '62px' : '256px',
    )
  }, [collapsed])

  if (!sessionReady) return null
  if (!user) return <Navigate to="/login" replace />

  return (
    <ClickSpark className="min-h-screen" sparkColor="#0ea5e9" sparkCount={6}>
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
        <LoginNotificationPopup />
        <WindowsPushPrompt />
      <NotificationToasts />
    </ClickSpark>
  )
}
