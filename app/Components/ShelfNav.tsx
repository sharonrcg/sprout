'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/reading', label: 'Reading' },
  { href: '/finished', label: 'Finished' },
  { href: '/tbr', label: 'Want to read' },
]

export const ShelfNav = () => {
  const pathname = usePathname()

  return (
    <nav style={{ display: 'flex', gap: 6 }}>
      {TABS.map(({ href, label }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            style={{
              padding: '7px 18px',
              borderRadius: 999,
              fontWeight: active ? 600 : 400,
              background: active ? 'var(--sp-sage)' : 'transparent',
              color: active ? '#fff' : 'var(--sp-muted)',
              textDecoration: 'none',
              fontSize: 14,
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
