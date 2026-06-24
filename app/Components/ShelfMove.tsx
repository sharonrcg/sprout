'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowLeftRight, ChevronDown, ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import '@/app/css/ShelfMove.css'

export interface MoveTarget {
  id: string
  label: string
  swatchClass?: string
  Icon: LucideIcon
  onClick: () => void
}

interface Props {
  targets: MoveTarget[]
  label?: string
  sectioned?: boolean
  eyebrow?: string
}

export const ShelfMove = ({ targets, label, sectioned = false, eyebrow = 'Move to a shelf' }: Props) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!targets || !targets.length) return null

  return (
    <div className={`sm-wrap${sectioned ? ' sm-block' : ''}`} ref={ref}>
      {sectioned && <div className="sm-eyebrow">{eyebrow}</div>}
      <div className="sm-anchor">
        <button
          className="sm-trigger"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
        >
          <ArrowLeftRight size={17} />
          <span>{label || 'Move to…'}</span>
          <ChevronDown size={15} className={`sm-caret${open ? ' sm-caret-open' : ''}`} />
        </button>
        {open && (
          <>
            <div className="sm-backdrop" onMouseDown={() => setOpen(false)} />
            <div className="sm-menu" role="menu">
              <div className="sm-menu-grip" />
              <div className="sm-menu-head">Move this book</div>
              {targets.map(t => (
                <button
                  key={t.id}
                  className="sm-opt"
                  role="menuitem"
                  onClick={() => { setOpen(false); t.onClick() }}
                >
                  <span className={`sm-opt-ic${t.swatchClass ? ' ' + t.swatchClass : ''}`}>
                    <t.Icon size={16} />
                  </span>
                  <span className="sm-opt-text">
                    <b>{t.label}</b>
                  </span>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
