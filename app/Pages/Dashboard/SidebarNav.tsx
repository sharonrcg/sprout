'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Leaf, BookOpen, CheckCheck, Bookmark } from 'lucide-react'

const NAV = [
  { href: '/reading', label: 'Reading', Icon: BookOpen },
  { href: '/finished', label: 'Finished', Icon: CheckCheck },
  { href: '/tbr', label: 'Want to read', Icon: Bookmark },
]

export const SidebarNav = () => {
  const pathname = usePathname()

  return (
    <aside
      style={{
        width: 232,
        flexShrink: 0,
        minHeight: '100vh',
        padding: '28px 12px',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--sp-paper)',
        borderRight: '1px solid var(--sp-line)',
        fontFamily: 'var(--sp-body)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '4px 10px',
          marginBottom: 32,
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 9,
            background: 'var(--sp-sage)',
            color: '#fff',
          }}
        >
          <Leaf size={16} />
        </span>
        <span style={{ fontFamily: 'var(--sp-disp)', fontSize: 22, color: 'var(--sp-ink)' }}>
          sprout
        </span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '9px 10px',
                borderRadius: 10,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                background: active ? 'var(--sp-sage-soft)' : 'transparent',
                color: active ? 'var(--sp-sage-deep)' : 'var(--sp-muted)',
                transition: 'background 0.12s, color 0.12s',
              }}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
