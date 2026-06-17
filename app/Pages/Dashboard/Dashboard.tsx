import { Suspense, type ReactNode } from 'react'
import { SidebarNav } from './SidebarNav'
import { ShelfSkeleton } from './ShelfSkeleton'
import { getUser } from '@/lib/supabase/getUser'

interface Props {
  children: ReactNode
}

export const Dashboard = async ({ children }: Props) => {
  const user = await getUser()
  const userName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null
  const userEmail = user?.email ?? null

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--sp-bg)',
        fontFamily: 'var(--sp-body)',
      }}
    >
      <SidebarNav userName={userName} userEmail={userEmail} />

      <main
        className="sp-main"
        style={{
          flex: 1,
          padding: '36px 48px 32px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Suspense fallback={<ShelfSkeleton />}>
          {children}
        </Suspense>
        <footer style={{ marginTop: 'auto', paddingTop: 48, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--sp-muted)', margin: 0, opacity: 0.7 }}>
            made by{' '}
            <a
              href="https://github.com/sharonrcg"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              @sharonrcg
            </a>
          </p>
        </footer>
      </main>
    </div>
  )
}
