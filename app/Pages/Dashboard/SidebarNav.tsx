'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Leaf, CheckCheck, BookOpen, ListOrdered, Plus, X } from 'lucide-react'
import { AddBookForm, type Mode } from '@/app/Components/AddBookForm'

const NAV = [
  { href: '/finished', label: 'Finished', Icon: CheckCheck },
  { href: '/reading', label: 'Reading', Icon: BookOpen },
  { href: '/tbr', label: 'TBR', Icon: ListOrdered },
]

const pathnameToMode = (pathname: string): Mode => {
  if (pathname === '/reading') return 'reading'
  if (pathname === '/tbr') return 'tbr'
  return 'finished'
}

interface Props {
  userName: string | null
  userEmail: string | null
}

export const SidebarNav = ({ userName, userEmail }: Props) => {
  const pathname = usePathname()
  const [modalOpen, setModalOpen] = useState(false)
  const defaultMode = pathnameToMode(pathname)

  const initial = (userName || userEmail || '?')[0].toUpperCase()

  return (
    <>
      <style>{`
        .sp-sidebar {
          width: 240px;
          flex-shrink: 0;
          height: 100vh;
          overflow-y: auto;
          padding: 24px 14px;
          display: flex;
          flex-direction: column;
          background: var(--sp-bg-2);
          border-right: 1px solid var(--sp-line);
          font-family: var(--sp-body);
        }
        .sp-mobile-top, .sp-fab, .sp-bottomnav { display: none; }

        @media (max-width: 899px) {
          .sp-sidebar { display: none; }
          .sp-main {
            padding: 14px 16px 108px !important;
          }

          .sp-mobile-top {
            display: flex;
            align-items: center;
            justify-content: center;
            position: sticky;
            top: 0;
            z-index: 20;
            padding: 14px 16px 10px;
            background: linear-gradient(var(--sp-bg) 72%, transparent);
            backdrop-filter: blur(2px);
          }

          .sp-fab {
            display: flex;
            align-items: center;
            justify-content: center;
            position: fixed;
            right: 18px;
            bottom: 86px;
            z-index: 40;
            width: 58px;
            height: 58px;
            border-radius: 20px;
            background: var(--sp-clay);
            color: #fff;
            border: none;
            cursor: pointer;
            box-shadow: 0 14px 30px -8px var(--sp-clay);
            transition: transform 0.1s;
          }
          .sp-fab:active { transform: scale(0.94); }

          .sp-bottomnav {
            display: flex;
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 35;
            height: 74px;
            padding: 8px 6px 16px;
            background: var(--sp-paper);
            border-top: 1px solid var(--sp-line);
            justify-content: space-around;
          }
          .sp-bn-link {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            flex: 1;
            text-decoration: none;
            color: var(--sp-muted);
            font-size: 11px;
            font-weight: 600;
            font-family: var(--sp-body);
          }
          .sp-bn-icon { display: flex; color: inherit; }
          .sp-bn-link.sp-active { color: var(--sp-ink); }
          .sp-bn-link.sp-active .sp-bn-icon { color: var(--sp-sage); }
        }
      `}</style>

      {/* ── Desktop sidebar ── */}
      <aside className="sp-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', marginBottom: 28 }}>
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--sp-sage)', color: '#fff', flexShrink: 0,
          }}>
            <Leaf size={18} />
          </span>
          <span style={{ fontFamily: 'var(--sp-disp)', fontSize: 22, color: 'var(--sp-ink)' }}>
            sprout
          </span>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '12px 16px', marginBottom: 20,
            borderRadius: 999, border: 'none',
            background: 'var(--sp-clay)', color: '#fff',
            fontFamily: 'var(--sp-body)', fontWeight: 600, fontSize: 15,
            cursor: 'pointer',
            boxShadow: '0 4px 14px -6px var(--sp-clay)',
          }}
        >
          <Plus size={17} />
          Add a book
        </button>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 12,
                textDecoration: 'none', fontSize: 15,
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--sp-ink)' : 'var(--sp-muted)',
                background: active ? 'var(--sp-paper)' : 'transparent',
                boxShadow: active ? '0 1px 4px -2px rgba(45,42,32,0.1)' : 'none',
                transition: 'background 0.12s, color 0.12s',
              }}>
                <Icon size={17} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div style={{ flex: 1 }} />

        <div style={{ borderTop: '1px solid var(--sp-line)', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 4px' }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: 'var(--sp-clay)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 15,
            }}>
              {initial}
            </div>
            <div style={{ minWidth: 0 }}>
              {userName && (
                <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--sp-ink)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userName}
                </p>
              )}
              {userEmail && (
                <p style={{ fontSize: 12, color: 'var(--sp-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userEmail}
                </p>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile FAB ── */}
      <button className="sp-fab" onClick={() => setModalOpen(true)} aria-label="Add a book">
        <Plus size={26} />
      </button>

      {/* ── Mobile bottom nav ── */}
      <nav className="sp-bottomnav">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`sp-bn-link${active ? ' sp-active' : ''}`}
            >
              <span className="sp-bn-icon"><Icon size={22} /></span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* ── Add book modal ── */}
      {modalOpen && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(40,34,22,0.42)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 18,
          }}
        >
          <div style={{
            width: '100%', maxWidth: 520,
            background: 'var(--sp-bg)', borderRadius: 24,
            padding: '28px 28px 32px',
            boxShadow: '0 18px 40px -14px rgba(45,42,32,0.45)',
            maxHeight: '90vh', overflowY: 'auto',
            position: 'relative',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--sp-disp)', fontSize: 27, fontWeight: 400, color: 'var(--sp-ink)', margin: 0 }}>
                Add a book
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                aria-label="Close"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: '50%',
                  border: '1px solid var(--sp-line)', background: 'var(--sp-paper)',
                  color: 'var(--sp-muted)', cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>
            <AddBookForm defaultMode={defaultMode} onSuccess={() => setModalOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
