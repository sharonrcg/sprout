'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Leaf, BookOpen, Check, Pencil, Trash2, Layers } from 'lucide-react'
import { coverUrl, coverUrlByIsbn } from '@/lib/open-library'
import { updateBook, removeBook, updateBookCover } from '@/app/actions'
import { EditionPickerModal } from './EditionPickerModal'
import type { Book, EditionCover } from '@/lib/types'
import '@/app/css/BookDetailModal.css'

const COVER_COLORS = ['#7a6a52', '#5B7A52', '#8B6E3C', '#4A6B5A', '#7A5B4A', '#6B5A7A', '#5A6B7A']
const getCoverColor = (title: string) => COVER_COLORS[title.charCodeAt(0) % COVER_COLORS.length]

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
          className={interactive ? 'bdm-leaf-btn' : 'bdm-leaf-btn-view'}
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

interface Props {
  book: Book
  onClose: () => void
}

export const BookDetailModal = ({ book, onClose }: Props) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [coverOverride, setCoverOverride] = useState<EditionCover | null>(null)
  const [editionPickerOpen, setEditionPickerOpen] = useState(false)

  useEffect(() => {
    window.addEventListener('sprout:close-modals', onClose)
    return () => window.removeEventListener('sprout:close-modals', onClose)
  }, [onClose])

  const [rating, setRating] = useState(book.rating ?? 0)
  const [finishedAt, setFinishedAt] = useState(book.finished_at ?? '')
  const [notes, setNotes] = useState(book.notes ?? '')

  const resetEdit = () => {
    setRating(book.rating ?? 0)
    setFinishedAt(book.finished_at ?? '')
    setNotes(book.notes ?? '')
    setEditing(false)
  }

  const activeCoverId = coverOverride?.cover_i ?? book.cover_i
  const activeIsbn = coverOverride?.isbn ?? book.isbn

  const src = activeCoverId
    ? coverUrl(activeCoverId)
    : activeIsbn
    ? coverUrlByIsbn(activeIsbn)
    : null

  const handleEditionSelect = (cover: EditionCover) => {
    setCoverOverride(cover)
    setEditionPickerOpen(false)
    startTransition(async () => {
      await updateBookCover(book.id, cover.cover_i, cover.isbn)
      router.refresh()
    })
  }

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
    <>
      {editionPickerOpen && (
        <EditionPickerModal
          title={book.title}
          isbn={book.isbn}
          currentCoverId={activeCoverId}
          onSelect={handleEditionSelect}
          onClose={() => setEditionPickerOpen(false)}
        />
      )}
      <div className="bdm-overlay">
        <div className="bdm-content">
          <button className="bdm-back-btn" onClick={onClose}>
            ← Back to shelf
          </button>

            <div className="bdm-grid">
              {/* left: cover + actions */}
              <div className="bdm-left">
                <div
                  className="bdm-cover-wrap"
                  style={{ background: getCoverColor(book.title) }}
                >
                  {src && <Image src={src} alt={book.title} fill sizes="280px" style={{ objectFit: 'cover' }} />}
                  {!src && (
                    <div className="bdm-cover-fallback">
                      <p className="bdm-cover-fallback-title">{book.title}</p>
                      {book.author && <p className="bdm-cover-fallback-author">{book.author}</p>}
                    </div>
                  )}
                  <div className="bdm-cover-shine" />
                </div>

                <div className="bdm-left-actions">
                  {!editing && (
                    <>
                      <button className="bdm-edit-btn" onClick={() => setEditing(true)}>
                        <Pencil size={14} /> <span className="bdm-edit-label">Edit</span>
                      </button>
                      <div className="bdm-edit-delete-row">
                        <button type="button" className="bdm-editions-btn" onClick={() => setEditionPickerOpen(true)}>
                          <Layers size={14} /> <span className="bdm-editions-label">Change edition</span>
                        </button>
                        <button
                          className="bdm-delete-btn"
                          onClick={handleDelete}
                          aria-label="Remove book"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* right: body */}
              <div className="bdm-body">
                <h1 className="bdm-book-title">{book.title}</h1>
                {book.author && (
                  <p className="bdm-book-author">{book.author}</p>
                )}

                {!editing && (
                  <>
                    <div className="bdm-view-rating">
                      <LeafRating value={book.rating ?? 0} size={22} />
                    </div>
                    <div className="bdm-view-meta">
                      <span className="bdm-view-meta-item">
                        <Check size={16} style={{ color: 'var(--sp-sage)' }} />
                        {book.finished_at ? `Finished ${prettyDate(book.finished_at)}` : 'Finished date unknown'}
                        <BookOpen size={16} style={{ color: 'var(--sp-sage)', marginLeft: 12 }} />
                        {book.page_count ? `${book.page_count} pages` : 'Page count unknown'}
                      </span>
                    </div>
                    <div>
                      <p className="bdm-notes-label">Your thoughts</p>
                      {book.notes ? (
                        <p className="bdm-notes-text">{book.notes}</p>
                      ) : (
                        <p className="bdm-notes-empty">No notes yet — tap edit to add some.</p>
                      )}
                    </div>
                  </>
                )}

                {editing && (
                  <div className="bdm-edit-form">
                    <div className="bdm-field-group">
                      <label className="bdm-field-label">Rating</label>
                      <div className="bdm-field-rating">
                        <LeafRating value={rating} onChange={setRating} size={28} />
                      </div>
                    </div>
                    <div className="bdm-field-group">
                      <label className="bdm-field-label">Date finished <span style={{ fontWeight: 400, color: 'var(--sp-faint)' }}>(optional)</span></label>
                      <input
                        type="date"
                        value={finishedAt}
                        onChange={e => setFinishedAt(e.target.value)}
                        className="bdm-field-input"
                      />
                    </div>
                    <div className="bdm-field-group">
                      <label className="bdm-field-label">Your thoughts</label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="What stayed with you?"
                        rows={4}
                        className="bdm-field-textarea"
                      />
                    </div>
                    <div className="bdm-edit-actions">
                      <button type="button" className="bdm-cancel-btn" onClick={resetEdit}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="bdm-save-btn"
                        onClick={handleSave}
                        disabled={isPending}
                        style={{ opacity: isPending ? 0.7 : 1 }}
                      >
                        <Check size={16} />
                        {isPending ? 'Saving…' : 'Save changes'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </>
  )
}
