import { Suspense, type ReactNode } from 'react'
import { SidebarNav } from './SidebarNav'
import { ShelfSkeleton } from './ShelfSkeleton'
import { AddBookForm } from '@/app/Components/AddBookForm'

interface Props {
  children: ReactNode
}

export const Dashboard = ({ children }: Props) => (
  <div
    style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--sp-bg)',
      fontFamily: 'var(--sp-body)',
    }}
  >
    <SidebarNav />

    <main
      style={{
        flex: 1,
        padding: '40px 48px',
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: 680 }}>
        <AddBookForm />
        <Suspense fallback={<ShelfSkeleton />}>
          <div style={{ marginTop: 48 }}>{children}</div>
        </Suspense>
      </div>
    </main>
  </div>
)
