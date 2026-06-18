'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { BarChart2, BookOpen, Check, Trash2 } from 'lucide-react'
import { coverUrl, coverUrlByIsbn } from '@/lib/open-library'
import { updateBookStatus, removeBook } from '@/app/actions'
import { AddBookModal } from '@/app/Components/AddBookModal'
import { ReadingProgressModal } from '@/app/Components/ReadingProgressModal'
import type { Book } from '@/lib/types'

const COVER_COLORS = ['#7a6a52', '#5B7A52', '#8B6E3C', '#4A6B5A', '#7A5B4A', '#6B5A7A', '#5A6B7A']
const getCoverColor = (title: string) => COVER_COLORS[title.charCodeAt(0) % COVER_COLORS.length]

const BookCover = ({ book }: { book: Book }) => {
  const src = book.cover_i
    ? coverUrl(book.cover_i)
    : book.isbn
    ? coverUrlByIsbn(book.isbn)
    : null

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '2 / 3',
        borderRadius: 7,
        overflow: 'hidden',
        background: getCoverColor(book.title),
        boxShadow: '0 10px 22px -10px rgba(45,42,32,0.5)',
      }}
    >
      {src && <Image src={src} alt={book.title} fill sizes="92px" style={{ objectFit: 'cover', zIndex: 1 }} />}
      {!src && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '11% 9%',
            color: '#fff',
          }}
        >
          <p style={{ fontFamily: 'var(--sp-disp)', fontSize: 12, lineHeight: 1.05, margin: 0 }}>
            {book.title}
          </p>
          {book.author && (
            <p style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.6px', opacity: 0.82, margin: 0 }}>
              {book.author}
            </p>
          )}
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          pointerEvents: 'none',
          background: 'linear-gradient(105deg, rgba(255,255,255,0.16) 0%, transparent 22%, transparent 78%, rgba(0,0,0,0.12) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 7,
          zIndex: 2,
          pointerEvents: 'none',
          background: 'linear-gradient(90deg, rgba(0,0,0,0.22), rgba(0,0,0,0))',
        }}
      />
    </div>
  )
}

const ReadingCard = ({ book, onOpen, onFinish, onRemove }: {
  book: Book
  onOpen: (book: Book) => void
  onFinish: (id: string) => void
  onRemove: (id: string) => void
}) => {
  return (
    <article
      onClick={() => onOpen(book)}
      className="rc-card"
      style={{
        display: 'flex',
        background: 'var(--sp-paper)',
        border: '1px solid var(--sp-line)',
        borderRadius: 20,
        boxShadow: '0 2px 8px -3px rgba(45,42,32,0.22)',
        cursor: 'pointer',
        transition: 'box-shadow 0.18s',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 10px 28px -12px rgba(45,42,32,0.4)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 8px -3px rgba(45,42,32,0.22)')}
    >
      <div
        className="rc-cover-wrap"
        style={{ transition: 'transform 0.22s cubic-bezier(.2,.8,.3,1)', flexShrink: 0, alignSelf: 'stretch' }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-6px) rotate(-.6deg)')}
        onMouseLeave={e => (e.currentTarget.style.transform = '')}
      >
        <BookCover book={book} />
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
          <div>
            <h3
              style={{
                fontFamily: 'var(--sp-disp)',
                fontWeight: 400,
                fontSize: 'clamp(18px, 4.8vw, 23px)',
                lineHeight: 1.16,
                color: 'var(--sp-ink)',
                margin: 0,
              }}
            >
              {book.title}
            </h3>
            {book.author && (
              <p style={{ fontSize: 14, color: 'var(--sp-muted)', marginTop: 3, marginBottom: 0 }}>
                {book.author}
              </p>
            )}
          </div>
        </div>

        {/* progress bar */}
        <div style={{ marginTop: 14 }}>
          {(() => {
            const pct = book.page_count && book.page_count > 0
              ? Math.min(100, Math.round(((book.current_page ?? 0) / book.page_count) * 100))
              : null
            return (
              <>
                <div style={{ height: 10, borderRadius: 99, background: 'var(--sp-bg-2)', overflow: 'hidden' }}>
                  <span
                    style={{
                      display: 'block', height: '100%',
                      width: pct !== null ? `${pct}%` : '0%',
                      background: 'linear-gradient(90deg, var(--sp-sage), var(--sp-sage-deep))',
                      borderRadius: 99, transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13, color: 'var(--sp-ink-soft)', fontWeight: 600 }}>
                  <span>
                    {pct !== null
                      ? `${pct}% · page ${book.current_page ?? 0} of ${book.page_count}`
                      : 'In progress'}
                  </span>
                </div>
              </>
            )
          })()}
        </div>

        {book.notes && (
          <p
            style={{
              fontSize: 14,
              color: 'var(--sp-ink-soft)',
              fontStyle: 'italic',
              marginTop: 12,
              lineHeight: 1.5,
              marginBottom: 0,
            }}
          >
            &ldquo;{book.notes}&rdquo;
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto', paddingTop: 16, flexWrap: 'wrap' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(book) }}
            className="rc-btn rc-btn-update"
          >
            <BarChart2 size={15} />
            Update progress
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onFinish(book.id) }}
            className="rc-btn rc-btn-finish"
          >
            <Check size={15} />
            Finished
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(book.id) }}
            aria-label="Remove book"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: 9,
              border: '1px solid var(--sp-line)',
              background: 'var(--sp-paper)',
              color: 'var(--sp-muted)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </article>
  )
}

interface Props {
  books: Book[]
}

export const ReadingShelfGrid = ({ books }: Props) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeBook, setActiveBook] = useState<Book | null>(null)

  const handleFinish = (id: string) => {
    startTransition(async () => {
      await updateBookStatus(id, 'finished')
      router.refresh()
    })
  }

  const handleRemove = (id: string) => {
    startTransition(async () => {
      await removeBook(id)
      router.refresh()
    })
  }

  return (
    <>
      <style>{`
        .rc-card {
          gap: 20px;
          padding: 20px;
        }
        .rc-cover-wrap {
          width: clamp(48px, 12vw, 92px);
          display: flex;
          align-items: center;
          padding-right: 14px;
          border-right: 1px solid var(--sp-line);
        }
        .rc-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 16px;
          border-radius: 999px;
          font-family: var(--sp-body);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        }
        .rc-btn-update {
          background: var(--sp-paper);
          color: var(--sp-ink);
          border: 1.5px solid var(--sp-line-2);
        }
        .rc-btn-finish {
          background: var(--sp-sage);
          color: #fff;
          border: none;
          box-shadow: 0 8px 18px -8px var(--sp-sage);
        }

        @media (max-width: 899px) {
          .rc-card {
            gap: 12px;
            padding: 14px;
          }
          .rc-btn {
            padding: 7px 11px;
            font-size: 13px;
            gap: 5px;
          }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '18px 24px',
          marginBottom: 22,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: '1 1 360px', minWidth: 0 }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: '1.6px',
              textTransform: 'uppercase',
              fontWeight: 700,
              color: 'var(--sp-muted)',
              margin: '0 0 6px',
            }}
          >
            In progress
          </p>
          <h1
            style={{
              fontFamily: 'var(--sp-disp)',
              fontWeight: 400,
              fontSize: 'clamp(32px, 4.4vw, 48px)',
              lineHeight: 1.06,
              color: 'var(--sp-ink)',
              margin: 0,
            }}
          >
            Currently reading
          </h1>
          <p style={{ color: 'var(--sp-muted)', fontSize: 15, marginTop: 8, marginBottom: 0 }}>
            {books.length} {books.length === 1 ? 'book' : 'books'} on your nightstand
          </p>
        </div>
        <AddBookModal />
      </div>

      {books.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 10,
            padding: '70px 24px',
            color: 'var(--sp-ink-soft)',
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 26,
              background: 'var(--sp-sage-soft)',
              color: 'var(--sp-sage)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 6,
            }}
          >
            <BookOpen size={40} />
          </div>
          <h3
            style={{
              fontFamily: 'var(--sp-disp)',
              fontSize: 'clamp(22px, 5.5vw, 27px)',
              fontWeight: 400,
              color: 'var(--sp-ink)',
              margin: 0,
            }}
          >
            Nothing open right now
          </h3>
          <p style={{ maxWidth: 320, color: 'var(--sp-muted)', lineHeight: 1.5, margin: 0 }}>
            When you crack open a new book, start it here and watch your progress grow.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            opacity: isPending ? 0.6 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {books.map(book => (
            <ReadingCard
              key={book.id}
              book={book}
              onOpen={setActiveBook}
              onFinish={handleFinish}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {activeBook && (
        <ReadingProgressModal book={activeBook} onClose={() => setActiveBook(null)} />
      )}
    </>
  )
}
