import { Suspense, type ReactNode } from 'react'
import { SidebarNav } from './SidebarNav'
import { LoadingSpinner } from './LoadingSpinner'
import { getUser } from '@/lib/supabase/getUser'
import '@/app/css/Dashboard.css'

interface Props {
  children: ReactNode
}

export const Dashboard = async ({ children }: Props) => {
  const user = await getUser()
  const userName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null
  const userEmail = user?.email ?? null

  return (
    <div className="dash-layout">
      <SidebarNav userName={userName} userEmail={userEmail} />

      <main className="sp-main">
        <Suspense fallback={<LoadingSpinner />}>
          {children}
        </Suspense>
        <footer className="dash-footer">
          <p>
            sprout - made by{' '}
            <a
              href="https://github.com/sharonrcg"
              target="_blank"
              rel="noopener noreferrer"
            >
              @sharonrcg
            </a>
          </p>
        </footer>
      </main>
    </div>
  )
}
