'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Leaf, CheckCheck, BookOpen, ListOrdered, Plus, X, User } from 'lucide-react'
import { AddBookForm, type Mode } from '@/app/Components/AddBookForm'
import '@/app/css/SidebarNav.css'

const NAV = [
  { href: '/finished', label: 'Finished', Icon: CheckCheck },
  { href: '/reading', label: 'Reading', Icon: BookOpen },
  { href: '/tbr', label: 'Want to read', Icon: ListOrdered },
  { href: '/you', label: 'You', Icon: User },
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

  const openAddBook = () => {
    window.dispatchEvent(new CustomEvent('sprout:close-modals'))
    setModalOpen(true)
  }

  const initial = (userName || userEmail || '?')[0].toUpperCase()

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="sp-sidebar">
        <div className="sb-logo">
          <span className="sb-logo-icon">
            <Leaf size={18} />
          </span>
          <span className="sb-logo-name">sprout</span>
        </div>

        <button className="sb-add-btn" onClick={openAddBook}>
          <Plus size={17} />
          Add a book
        </button>

        <nav className="sb-nav">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`sp-nav-link${active ? ' sp-active' : ''}`}
              >
                <Icon size={17} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="sb-spacer" />

        <div className="sb-user-section">
          <div className="sb-user-row">
            <div className="sb-avatar">{initial}</div>
            <div className="sb-user-info">
              {userName && <p className="sb-user-name">{userName}</p>}
              {userEmail && <p className="sb-user-email">{userEmail}</p>}
            </div>
          </div>
        </div>
      </aside>
      
      {/* ── Mobile FAB ── */}
      <button className="sp-fab" onClick={openAddBook} aria-label="Add a book">
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
          className="sb-modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div className="sb-modal-inner">
            <div className="sb-modal-header">
              <h2 className="sb-modal-title">Add a book</h2>
              <button
                onClick={() => setModalOpen(false)}
                aria-label="Close"
                className="sb-modal-close"
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
