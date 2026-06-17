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
        minHeight: '100vh',
        background: 'var(--sp-bg)',
        fontFamily: 'var(--sp-body)',
      }}
    >
      <SidebarNav userName={userName} userEmail={userEmail} />

      <main
        style={{
          flex: 1,
          padding: '36px 48px 80px',
          overflowY: 'auto',
        }}
      >
        <Suspense fallback={<ShelfSkeleton />}>
          {children}
        </Suspense>
      </main>
    </div>
  )
}
