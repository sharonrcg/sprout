'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { X, Check, BookOpen } from 'lucide-react'
import { coverUrl, coverUrlByIsbn } from '@/lib/open-library'
import { updateBookStatus, updateReadingProgress } from '@/app/actions'
import type { Book } from '@/lib/types'

const COVER_COLORS = ['#7a6a52', '#5B7A52', '#8B6E3C', '#4A6B5A', '#7A5B4A', '#6B5A7A', '#5A6B7A']
const getCoverColor = (t: string) => {
  return COVER_COLORS[t.charCodeAt(0) % COVER_COLORS.length]
}

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
    <>
      <style>{`
        @keyframes sp-slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .rpm-overlay {
          align-items: center;
          justify-content: center;
        }
        .rpm-inner {
          /* desktop defaults handled by inline style */
        }
        .rpm-handle { display: none; }
        @media (max-width: 699px) {
          .rpm-overlay {
            align-items: flex-end !important;
            padding: 0 !important;
          }
          .rpm-inner {
            max-width: 100% !important;
            border-radius: 24px 24px 0 0 !important;
            padding-bottom: 40px !important;
            max-height: 90vh;
            overflow-y: auto;
            animation: sp-slide-up 0.32s cubic-bezier(0.32, 0.72, 0, 1);
          }
          .rpm-handle { display: block; }
        }
        .sp-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 99px;
          outline: none;
          cursor: pointer;
          background: linear-gradient(
            to right,
            var(--sp-sage) 0%,
            var(--sp-sage) var(--sp-pct),
            var(--sp-bg-2) var(--sp-pct),
            var(--sp-bg-2) 100%
          );
        }
        .sp-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--sp-sage-deep);
          border: 3px solid #fff;
          box-shadow: 0 2px 8px -2px rgba(45,42,32,0.35);
          cursor: pointer;
        }
        .sp-slider::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--sp-sage-deep);
          border: 3px solid #fff;
          box-shadow: 0 2px 8px -2px rgba(45,42,32,0.35);
          cursor: pointer;
        }
      `}</style>

      <div
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        className="rpm-overlay"
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(40,34,22,0.42)', backdropFilter: 'blur(3px)',
          display: 'flex', padding: 18,
        }}
      >
        <div
          className="rpm-inner"
          style={{
            width: '100%', maxWidth: 540,
            background: 'var(--sp-bg)', borderRadius: 24,
            padding: '28px 28px 32px',
            boxShadow: '0 18px 40px -14px rgba(45,42,32,0.45)',
            position: 'relative',
          }}
        >
          {/* drag handle — visible on mobile only via CSS */}
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--sp-line-2)', margin: '0 auto 18px' }} className="rpm-handle" />
          {/* title row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'var(--sp-disp)', fontSize: 'clamp(22px, 5.5vw, 27px)', fontWeight: 400, color: 'var(--sp-ink)', margin: 0 }}>
              Update progress
            </h3>
            <button
              onClick={onClose}
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

          {/* book header */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 28 }}>
            <div
              style={{
                position: 'relative', width: 62, flexShrink: 0,
                aspectRatio: '2/3', borderRadius: 7, overflow: 'hidden',
                background: getCoverColor(book.title),
                boxShadow: '0 6px 16px -6px rgba(45,42,32,0.45)',
              }}
            >
              {src && <Image src={src} alt={book.title} fill sizes="62px" style={{ objectFit: 'cover', zIndex: 1 }} />}
              {!src && (
                <div style={{ position: 'absolute', inset: 0, padding: '10% 8%', color: '#fff' }}>
                  <p style={{ fontFamily: 'var(--sp-disp)', fontSize: 9, lineHeight: 1.1, margin: 0 }}>{book.title}</p>
                </div>
              )}
              <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', background: 'linear-gradient(105deg, rgba(255,255,255,0.16) 0%, transparent 22%)' }} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--sp-disp)', fontSize: 'clamp(17px, 4.8vw, 22px)', fontWeight: 400, lineHeight: 1.1, color: 'var(--sp-ink)', margin: 0 }}>
                {book.title}
              </h3>
              {book.author && (
                <p style={{ fontSize: 14, color: 'var(--sp-muted)', marginTop: 4, marginBottom: 0 }}>{book.author}</p>
              )}
            </div>
          </div>

          {/* percentage + label */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--sp-disp)', fontSize: 'clamp(36px, 10vw, 48px)', lineHeight: 1, color: 'var(--sp-sage-deep)' }}>
              {pct}<small style={{ fontSize: 'clamp(17px, 4.5vw, 22px)', color: 'var(--sp-sage)' }}>%</small>
            </span>
            <span style={{ fontSize: 15, color: 'var(--sp-muted)' }}>
              {pageCount > 0 ? `page ${page} of ${pageCount}` : 'in progress'}
            </span>
          </div>

          {/* slider */}
          <div style={{ marginBottom: 24 }}>
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

          {/* current page input */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--sp-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.9px' }}>
              Current page
            </label>
            <input
              type="number"
              min={0}
              max={pageCount > 0 ? pageCount : undefined}
              value={page === 0 ? '' : page}
              placeholder="0"
              onChange={(e) => {
                const n = parseInt(e.target.value, 10)
                const clamped = isNaN(n) ? 0 : pageCount > 0 ? Math.min(n, pageCount) : n
                setPage(Math.max(0, clamped))
              }}
              style={{
                width: 120, padding: '10px 14px',
                borderRadius: 12, border: '1.5px solid var(--sp-line)',
                background: 'var(--sp-paper)', color: 'var(--sp-ink)',
                fontFamily: 'var(--sp-body)', fontSize: 16, fontWeight: 600,
                outline: 'none',
              }}
            />
          </div>

          {/* actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            {book.status !== 'tbr' && (
              <button
                onClick={handleFinish}
                disabled={isPending}
                style={{
                  flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '14px 20px', borderRadius: 999,
                  background: 'var(--sp-sage)', color: '#fff',
                  fontFamily: 'var(--sp-body)', fontWeight: 600, fontSize: 15,
                  border: 'none', cursor: isPending ? 'default' : 'pointer',
                  boxShadow: '0 8px 18px -8px var(--sp-sage)',
                  opacity: isPending ? 0.7 : 1,
                }}
              >
                <Check size={16} />
                {isPending && activeAction === 'finish' ? 'Moving…' : 'I finished it'}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isPending}
              style={{
                flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '14px 20px', borderRadius: 999,
                background: 'var(--sp-clay)', color: '#fff',
                fontFamily: 'var(--sp-body)', fontWeight: 600, fontSize: 15,
                border: 'none', cursor: isPending ? 'default' : 'pointer',
                boxShadow: '0 8px 18px -8px var(--sp-clay)',
                opacity: isPending ? 0.7 : 1,
              }}
            >
              <BookOpen size={16} />
              {isPending && activeAction === 'save' ? 'Saving…' : 'Save progress'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
