'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { X, Check, BookOpen } from 'lucide-react'
import { coverUrl, coverUrlByIsbn } from '@/lib/open-library'
import { updateBookStatus, updateReadingProgress } from '@/app/actions'
import type { Book } from '@/lib/types'
import '@/app/css/ReadingProgressModal.css'

const COVER_COLORS = ['#7a6a52', '#5B7A52', '#8B6E3C', '#4A6B5A', '#7A5B4A', '#6B5A7A', '#5A6B7A']
const getCoverColor = (t: string) => COVER_COLORS[t.charCodeAt(0) % COVER_COLORS.length]

interface Props {
  book: Book
  onClose: () => void
}

export const ReadingProgressModal = ({ book, onClose }: Props) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeAction, setActiveAction] = useState<'save' | 'finish' | null>(null)

  const pageCount = book.page_count ?? 0
  const [page, setPage] = useState(book.current_page ?? 0)

  const sliderMax = pageCount > 0 ? pageCount : 100
  const pct = Math.min(100, Math.round((page / sliderMax) * 100))

  const src = book.cover_i
    ? coverUrl(book.cover_i)
    : book.isbn
    ? coverUrlByIsbn(book.isbn)
    : null

  const handleFinish = () => {
    setActiveAction('finish')
    startTransition(async () => {
      await updateReadingProgress(book.id, page, pageCount || undefined)
      await updateBookStatus(book.id, 'finished')
      onClose()
      router.push('/finished')
    })
  }

  const handleSave = () => {
    setActiveAction('save')
    startTransition(async () => {
      await updateReadingProgress(book.id, page, pageCount || undefined)
      if (book.status === 'tbr') await updateBookStatus(book.id, 'reading')
      router.refresh()
      onClose()
    })
  }

  return (
    <div
      className="rpm-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="rpm-inner">
        <div className="rpm-handle" />

        <div className="rpm-title-row">
          <h3 className="rpm-title">Update progress</h3>
          <button className="rpm-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="rpm-book-header">
          <div className="rpm-book-cover" style={{ background: getCoverColor(book.title) }}>
            {src && <Image src={src} alt={book.title} fill sizes="62px" style={{ objectFit: 'cover' }} />}
            {!src && (
              <div className="rpm-cover-fallback">
                <p>{book.title}</p>
              </div>
            )}
            <div className="rpm-cover-shine" />
          </div>
          <div>
            <h3 className="rpm-book-title">{book.title}</h3>
            {book.author && <p className="rpm-book-author">{book.author}</p>}
          </div>
        </div>

        <div className="rpm-pct-row">
          <span className="rpm-pct-number">
            {pct}<small className="rpm-pct-sign">%</small>
          </span>
          <span className="rpm-pct-label">
            {pageCount > 0 ? `page ${page} of ${pageCount}` : 'in progress'}
          </span>
        </div>

        <div className="rpm-slider-wrap">
          <input
            type="range"
            className="sp-slider"
            min={0}
            max={sliderMax}
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            style={{ '--sp-pct': `${pct}%` } as React.CSSProperties}
          />
        </div>

        <div className="rpm-page-wrap">
          <label className="rpm-page-label">Current page</label>
          <input
            type="number"
            className="rpm-page-input"
            min={0}
            max={pageCount > 0 ? pageCount : undefined}
            value={page === 0 ? '' : page}
            placeholder="0"
            onChange={(e) => {
              const n = parseInt(e.target.value, 10)
              const clamped = isNaN(n) ? 0 : pageCount > 0 ? Math.min(n, pageCount) : n
              setPage(Math.max(0, clamped))
            }}
          />
        </div>

        <div className="rpm-actions">
          {book.status !== 'tbr' && (
            <button
              className="rpm-finish-btn"
              onClick={handleFinish}
              disabled={isPending}
              style={{ opacity: isPending ? 0.7 : 1 }}
            >
              <Check size={16} />
              {isPending && activeAction === 'finish' ? 'Moving…' : 'I finished it'}
            </button>
          )}
          <button
            className="rpm-save-btn"
            onClick={handleSave}
            disabled={isPending}
            style={{ opacity: isPending ? 0.7 : 1 }}
          >
            <BookOpen size={16} />
            {isPending && activeAction === 'save' ? 'Saving…' : 'Save progress'}
          </button>
        </div>
      </div>
    </div>
  )
}
