'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { X, Leaf, BookOpen, Check, Pencil, Trash2 } from 'lucide-react'
import { coverUrl, coverUrlByIsbn } from '@/lib/open-library'
import { updateBook, removeBook } from '@/app/actions'
import type { Book } from '@/lib/types'

const COVER_COLORS = ['#7a6a52', '#5B7A52', '#8B6E3C', '#4A6B5A', '#7A5B4A', '#6B5A7A', '#5A6B7A']

const getCoverColor = (title: string) => {
  return COVER_COLORS[title.charCodeAt(0) % COVER_COLORS.length]
}

const prettyDate = (d: string | null) => {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

const LeafRating = ({ value, onChange, size = 24 }: {
  value: number
  onChange?: (v: number) => void
  size?: number
}) => {
  const [hovered, setHovered] = useState(0)
  const interactive = !!onChange
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: interactive ? 4 : 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i === value ? 0 : i)}
          onMouseEnter={() => { if (interactive) setHovered(i) }}
          onMouseLeave={() => { if (interactive) setHovered(0) }}
          disabled={!interactive}
          style={{ display: 'flex', padding: interactive ? 3 : 0, background: 'none', border: 'none', cursor: interactive ? 'pointer' : 'default' }}
        >
          <Leaf
            size={size}
            style={{
              color: 'var(--sp-sage)',
              opacity: i <= (hovered || value) ? 1 : 0.25,
              fill: i <= (hovered || value) ? 'rgba(110,137,90,0.22)' : 'none',
              transition: 'opacity 0.12s, transform 0.12s',
              transform: interactive && hovered && i <= hovered ? 'scale(1.18) rotate(-6deg)' : 'none',
            }}
          />
        </button>
      ))}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '13px 15px', borderRadius: 14,
  border: '1px solid var(--sp-line-2)', background: 'var(--sp-paper)',
  fontSize: 15, color: 'var(--sp-ink)', fontFamily: 'var(--sp-body)',
  outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: 'var(--sp-ink-soft)',
  display: 'block', marginBottom: 9,
}

interface Props {
  book: Book
  onClose: () => void
}

export const BookDetailModal = ({ book, onClose }: Props) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const [rating, setRating] = useState(book.rating ?? 0)
  const [finishedAt, setFinishedAt] = useState(book.finished_at ?? '')
  const [notes, setNotes] = useState(book.notes ?? '')

  const resetEdit = () => {
    setRating(book.rating ?? 0)
    setFinishedAt(book.finished_at ?? '')
    setNotes(book.notes ?? '')
    setEditing(false)
  }

  const src = book.cover_i
    ? coverUrl(book.cover_i)
    : book.isbn
    ? coverUrlByIsbn(book.isbn)
    : null

  const handleSave = () => {
    startTransition(async () => {
      await updateBook(book.id, {
        rating: rating || null,
        notes: notes.trim() || null,
        finished_at: finishedAt || null,
      })
      router.refresh()
      onClose()
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      await removeBook(book.id)
      router.refresh()
      onClose()
    })
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(40,34,22,0.42)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 18,
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 780, maxHeight: '90vh', overflowY: 'auto',
          background: 'var(--sp-bg)', borderRadius: 24,
          padding: '28px 32px 36px',
          boxShadow: '0 18px 40px -14px rgba(45,42,32,0.45)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 20, right: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: '50%',
            border: '1px solid var(--sp-line)', background: 'var(--sp-paper)',
            color: 'var(--sp-muted)', cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {/* ── delete confirm ── */}
        {confirming ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 8 }}>
            <h3 style={{ fontFamily: 'var(--sp-disp)', fontSize: 27, fontWeight: 400, margin: 0, color: 'var(--sp-ink)' }}>
              Remove this book?
            </h3>
            <p style={{ color: 'var(--sp-ink-soft)', lineHeight: 1.55, fontSize: 15, margin: 0 }}>
              &ldquo;{book.title}&rdquo; will be taken off your shelf. This can&apos;t be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setConfirming(false)}
                style={{
                  padding: '12px 20px', borderRadius: 999,
                  background: 'var(--sp-paper)', border: '1px solid var(--sp-line-2)',
                  color: 'var(--sp-ink)', fontFamily: 'var(--sp-body)', fontWeight: 600, fontSize: 15, cursor: 'pointer',
                }}
              >
                Keep it
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 20px', borderRadius: 999,
                  background: 'none', border: '1px solid rgba(150,60,40,.4)',
                  color: '#9a3d28', fontFamily: 'var(--sp-body)', fontWeight: 600, fontSize: 15,
                  cursor: 'pointer', opacity: isPending ? 0.6 : 1,
                }}
              >
                <Trash2 size={15} /> Remove
              </button>
            </div>
          </div>
        ) : (
          /* ── main layout ── */
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 40, alignItems: 'start' }}>

            {/* left: cover + action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  position: 'relative', width: '100%', aspectRatio: '2/3',
                  borderRadius: 12, overflow: 'hidden',
                  background: getCoverColor(book.title),
                  boxShadow: '0 10px 28px -12px rgba(45,42,32,0.4)',
                }}
              >
                {src && <Image src={src} alt={book.title} fill sizes="200px" style={{ objectFit: 'cover', zIndex: 1 }} />}
                {!src && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '11% 9%', color: '#fff' }}>
                    <p style={{ fontFamily: 'var(--sp-disp)', fontSize: 14, lineHeight: 1.05, margin: 0 }}>{book.title}</p>
                    {book.author && <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.6px', opacity: 0.82, margin: 0 }}>{book.author}</p>}
                  </div>
                )}
                <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', background: 'linear-gradient(105deg, rgba(255,255,255,0.16) 0%, transparent 22%, transparent 78%, rgba(0,0,0,0.12) 100%)' }} />
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 7, zIndex: 2, pointerEvents: 'none', background: 'linear-gradient(90deg, rgba(0,0,0,0.22), rgba(0,0,0,0))' }} />
              </div>

              {!editing && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setEditing(true)}
                    style={{
                      flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      padding: '10px 16px', borderRadius: 999,
                      background: 'var(--sp-sage)', color: '#fff',
                      fontFamily: 'var(--sp-body)', fontWeight: 600, fontSize: 14,
                      border: 'none', cursor: 'pointer', boxShadow: '0 8px 18px -8px var(--sp-sage)',
                    }}
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    onClick={() => setConfirming(true)}
                    aria-label="Remove book"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 40, height: 40, borderRadius: 999, flexShrink: 0,
                      background: 'none', border: '1px solid rgba(150,60,40,0.3)',
                      color: '#9a3d28', cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* right: body */}
            <div style={{ paddingTop: 4, paddingRight: 40 }}>
              <h1
                style={{
                  fontFamily: 'var(--sp-disp)', fontWeight: 400,
                  fontSize: 'clamp(26px, 3.5vw, 46px)', lineHeight: 1.02,
                  color: 'var(--sp-ink)', margin: 0,
                }}
              >
                {book.title}
              </h1>
              {book.author && (
                <p style={{ fontSize: 18, color: 'var(--sp-muted)', marginTop: 6, marginBottom: 0 }}>
                  {book.author}
                </p>
              )}

              {/* view mode */}
              {!editing && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '22px 0 18px', flexWrap: 'wrap' }}>
                    <LeafRating value={book.rating ?? 0} size={22} />
                  </div>
                  {book.finished_at && (
                    <div style={{ display: 'flex', gap: 22, color: 'var(--sp-ink-soft)', fontSize: 14.5, fontWeight: 600, marginBottom: 16 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <Check size={16} style={{ color: 'var(--sp-sage)' }} />
                        Finished {prettyDate(book.finished_at)}
                        <BookOpen size={16} style={{ color: 'var(--sp-sage)', marginLeft: '12px' }} />
                        {book.page_count ? `${book.page_count} pages` : 'Page count unknown'}
                      </span>

                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: 11, letterSpacing: '1.6px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--sp-muted)', margin: '0 0 10px' }}>
                      Your thoughts
                    </p>
                    {book.notes ? (
                      <p style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--sp-ink-soft)', margin: 0 }}>
                        {book.notes}
                      </p>
                    ) : (
                      <p style={{ fontSize: 15, color: 'var(--sp-faint)', fontStyle: 'italic', margin: 0 }}>
                        No notes yet — tap edit to add some.
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* edit mode */}
              {editing && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 22 }}>
                  <div>
                    <label style={labelStyle}>Rating</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <LeafRating value={rating} onChange={setRating} size={28} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Date finished</label>
                    <input
                      type="date"
                      value={finishedAt}
                      onChange={e => setFinishedAt(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Your thoughts</label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="What stayed with you?"
                      rows={4}
                      style={{ ...inputStyle, resize: 'vertical', minHeight: 96, lineHeight: 1.5 }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                      type="button"
                      onClick={resetEdit}
                      style={{
                        padding: '12px 20px', borderRadius: 999,
                        background: 'var(--sp-paper)', border: '1px solid var(--sp-line-2)',
                        color: 'var(--sp-ink)', fontFamily: 'var(--sp-body)', fontWeight: 600, fontSize: 15, cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isPending}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '12px 22px', borderRadius: 999,
                        background: 'var(--sp-clay)', color: '#fff',
                        fontFamily: 'var(--sp-body)', fontWeight: 600, fontSize: 15,
                        border: 'none', cursor: 'pointer', boxShadow: '0 8px 18px -8px var(--sp-clay)',
                        opacity: isPending ? 0.7 : 1,
                      }}
                    >
                      <Check size={16} />
                      {isPending ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
