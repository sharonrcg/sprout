'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { AddBookForm, type Mode } from './AddBookForm'

const pathnameToMode = (pathname: string): Mode => {
  if (pathname === '/reading') return 'reading'
  if (pathname === '/tbr') return 'tbr'
  return 'finished'
}

export const AddBookModal = () => {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const defaultMode = pathnameToMode(pathname)

  return (
    <>

      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(40,34,22,0.42)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 680,
              maxHeight: '92vh',
              overflowY: 'auto',
              background: 'var(--sp-bg)',
              borderRadius: 24,
              padding: '24px 24px 36px',
              boxShadow: '0 18px 40px -14px rgba(45,42,32,0.45)',
              margin: '0 18px',
            }}
          >
            <div style={{ display: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--sp-disp)', fontSize: 27, fontWeight: 400, color: 'var(--sp-ink)', margin: 0 }}>
                Add a book
              </h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '1px solid var(--sp-line)',
                  background: 'var(--sp-paper)',
                  color: 'var(--sp-muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>
            <AddBookForm defaultMode={defaultMode} onSuccess={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
