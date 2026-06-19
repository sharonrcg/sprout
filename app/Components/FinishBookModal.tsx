'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { X, Check, Leaf } from 'lucide-react'
import { coverUrl, coverUrlByIsbn } from '@/lib/open-library'
import '@/app/css/FinishBookModal.css'

const COVER_COLORS = ['#7a6a52', '#5B7A52', '#8B6E3C', '#4A6B5A', '#7A5B4A', '#6B5A7A', '#5A6B7A']
const getCoverColor = (t: string) => COVER_COLORS[t.charCodeAt(0) % COVER_COLORS.length]

const LeafRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const [hovered, setHovered] = useState(0)
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i === value ? 0 : i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className="fbm-leaf-btn"
        >
          <Leaf
            size={34}
            style={{
              color: 'var(--sp-sage)',
              opacity: i <= (hovered || value) ? 1 : 0.25,
              fill: i <= (hovered || value) ? 'rgba(110,137,90,0.22)' : 'none',
              transition: 'opacity 0.12s, transform 0.12s',
              transform: hovered && i <= hovered ? 'scale(1.18) rotate(-6deg)' : 'none',
            }}
          />
        </button>
      ))}
    </div>
  )
}

export interface FinishData {
  rating: number | null
  notes: string | null
  finished_at: string | null
}

interface Props {
  book: {
    title: string
    author: string | null
    cover_i: string | null
    isbn: string | null
  }
  onSave: (data: FinishData) => Promise<void>
  onClose: () => void
}

export const FinishBookModal = ({ book, onSave, onClose }: Props) => {
  const [isPending, startTransition] = useTransition()
  const [rating, setRating] = useState(0)
  const [finishedAt, setFinishedAt] = useState(() => new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const src = book.cover_i
    ? coverUrl(book.cover_i)
    : book.isbn
    ? coverUrlByIsbn(book.isbn)
    : null

  const today = new Date().toISOString().split('T')[0]

  const handleFinish = () => {
    startTransition(async () => {
      await onSave({
        rating: rating || null,
        notes: notes.trim() || null,
        finished_at: finishedAt || null,
      })
      onClose()
    })
  }

  return (
    <div
      className="fbm-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="fbm-inner">
        <div className="fbm-title-row">
          <h3 className="fbm-title">Finished!</h3>
          <button className="fbm-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="fbm-book-header">
          <div className="fbm-book-cover" style={{ background: getCoverColor(book.title) }}>
            {src && <Image src={src} alt={book.title} fill sizes="48px" style={{ objectFit: 'cover' }} />}
            <div className="fbm-cover-shine" />
          </div>
          <div>
            <p className="fbm-book-title">{book.title}</p>
            {book.author && <p className="fbm-book-author">{book.author}</p>}
          </div>
        </div>

        <div className="fbm-field-group">
          <label className="fbm-label">How was it?</label>
          <LeafRating value={rating} onChange={setRating} />
        </div>

        <div className="fbm-field-group">
          <label className="fbm-label">
            Date finished <span className="fbm-label-faint">(optional)</span>
          </label>
          <input
            type="date"
            value={finishedAt}
            max={today}
            onChange={e => setFinishedAt(e.target.value)}
            className="fbm-input"
          />
        </div>

        <div className="fbm-field-group">
          <label className="fbm-label">Your thoughts</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="What stayed with you?"
            rows={3}
            className="fbm-textarea"
          />
        </div>

        <button
          className="fbm-finish-btn"
          onClick={handleFinish}
          disabled={isPending}
          style={{ opacity: isPending ? 0.7 : 1 }}
        >
          <Check size={16} />
          {isPending ? 'Saving…' : 'Mark as finished'}
        </button>
      </div>
    </div>
  )
}
