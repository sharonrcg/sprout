'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Search, X, Leaf, ChevronDown } from 'lucide-react'
import { coverUrl, coverUrlByIsbn } from '@/lib/open-library'
import { AddBookModal } from '@/app/Components/AddBookModal'
import { BookDetailModal } from '@/app/Components/BookDetailModal'
import type { Book } from '@/lib/types'

const SORT_OPTIONS = {
  recent: {
    label: 'Recently finished',
    fn: (a: Book, b: Book) =>
      (b.finished_at ?? b.created_at).localeCompare(a.finished_at ?? a.created_at),
  },
  rating: {
    label: 'Highest rated',
    fn: (a: Book, b: Book) =>
      (b.rating ?? 0) - (a.rating ?? 0) ||
      (b.finished_at ?? '').localeCompare(a.finished_at ?? ''),
  },
  title: {
    label: 'Title A–Z',
    fn: (a: Book, b: Book) => a.title.localeCompare(b.title),
  },
} as const

type SortKey = keyof typeof SORT_OPTIONS

const COVER_COLORS = ['#7a6a52', '#5B7A52', '#8B6E3C', '#4A6B5A', '#7A5B4A', '#6B5A7A', '#5A6B7A']

const getCoverColor = (title: string) => {
  return COVER_COLORS[title.charCodeAt(0) % COVER_COLORS.length]
}

const LeafRating = ({ value }: { value: number | null }) => {
  const v = value ?? 0
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginTop: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Leaf
          key={i}
          size={13}
          style={{
            color: 'var(--sp-sage)',
            opacity: i <= v ? 1 : 0.25,
            fill: i <= v ? 'rgba(110,137,90,0.2)' : 'none',
          }}
        />
      ))}
    </div>
  )
}

const BookCoverImage = ({ book }: { book: Book }) => {
  const src = book.cover_i
    ? coverUrl(book.cover_i)
    : book.isbn
    ? coverUrlByIsbn(book.isbn)
    : null

  return (
    <div
      style={{
        position: 'relative',
        aspectRatio: '2 / 3',
        borderRadius: 9,
        overflow: 'hidden',
        background: getCoverColor(book.title),
        boxShadow: '0 10px 22px -10px rgba(45,42,32,0.5)',
      }}
    >
      {src && (
        <Image src={src} alt={book.title} fill sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 200px" style={{ objectFit: 'cover', zIndex: 1 }} />
      )}
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
          <p style={{ fontFamily: 'var(--sp-disp)', fontSize: 14, lineHeight: 1.05, margin: 0 }}>
            {book.title}
          </p>
          {book.author && (
            <p
              style={{
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                opacity: 0.82,
                margin: 0,
              }}
            >
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
          background:
            'linear-gradient(105deg, rgba(255,255,255,0.16) 0%, transparent 22%, transparent 78%, rgba(0,0,0,0.12) 100%)',
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

interface Props {
  books: Book[]
}

export const FinishedShelfGrid = ({ books }: Props) => {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortKey>('recent')
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  const year = new Date().getFullYear()
  const thisYear = books.filter(b =>
    (b.finished_at ?? b.created_at).startsWith(String(year))
  ).length

  const shown = useMemo(() => {
    const lower = q.toLowerCase()
    const filtered = q
      ? books.filter(b =>
          (b.title + ' ' + (b.author ?? '')).toLowerCase().includes(lower)
        )
      : books
    return [...filtered].sort(SORT_OPTIONS[sort].fn)
  }, [books, q, sort])

  return (
    <>
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
              marginBottom: 6,
              margin: '0 0 6px',
            }}
          >
            Your library
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
            Recently finished
          </h1>
          <p style={{ color: 'var(--sp-muted)', fontSize: 15, marginTop: 8, marginBottom: 0 }}>
            {books.length} {books.length === 1 ? 'book' : 'books'} on the shelf &middot; {thisYear} read in {year}
          </p>
        </div>
        <AddBookModal />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 26, flexWrap: 'wrap' }}>
        <div
          style={{
            flex: 1,
            minWidth: 220,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 20,
            background: 'var(--sp-paper)',
            border: '1px solid var(--sp-line-2)',
            color: 'var(--sp-muted)',
          }}
        >
          <Search size={18} style={{ flexShrink: 0 }} />
          <input
            type="search"
            placeholder="Search your shelf — title, author…"
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              background: 'none',
              outline: 'none',
              fontSize: 15,
              color: 'var(--sp-ink)',
              fontFamily: 'var(--sp-body)',
            }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              aria-label="Clear search"
              style={{ display: 'flex', padding: 0, color: 'var(--sp-muted)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            padding: '0 14px',
            borderRadius: 20,
            background: 'var(--sp-paper)',
            border: '1px solid var(--sp-line-2)',
          }}
        >
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            style={{
              appearance: 'none',
              border: 'none',
              background: 'none',
              outline: 'none',
              fontSize: 14.5,
              fontWeight: 600,
              color: 'var(--sp-ink)',
              padding: '13px 28px 13px 0',
              cursor: 'pointer',
              fontFamily: 'var(--sp-body)',
            }}
          >
            {(Object.entries(SORT_OPTIONS) as [SortKey, (typeof SORT_OPTIONS)[SortKey]][]).map(
              ([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              )
            )}
          </select>
          <ChevronDown
            size={15}
            style={{
              position: 'absolute',
              right: 12,
              pointerEvents: 'none',
              color: 'var(--sp-muted)',
            }}
          />
        </div>
      </div>

      {shown.length === 0 ? (
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
            <Search size={40} />
          </div>
          <h3
            style={{
              fontFamily: 'var(--sp-disp)',
              fontSize: 27,
              fontWeight: 400,
              color: 'var(--sp-ink)',
              margin: 0,
            }}
          >
            {q ? 'Nothing matched' : "You'll get there"}
          </h3>
          <p style={{ maxWidth: 320, color: 'var(--sp-muted)', lineHeight: 1.5, margin: 0 }}>
            {q
              ? 'No books match that search. Try a different title or author.'
              : "Add the first book you've finished and it'll bloom here."}
          </p>
          {q && (
            <button
              onClick={() => setQ('')}
              style={{
                marginTop: 8,
                padding: '10px 20px',
                borderRadius: 999,
                background: 'var(--sp-sage)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                border: 'none',
              }}
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: '30px 22px',
          }}
        >
          {shown.map(book => (
            <button
              key={book.id}
              onClick={() => setSelectedBook(book)}
              style={{
                display: 'flex', flexDirection: 'column', gap: 11,
                background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', padding: 0,
              }}
            >
              <div style={{ transition: 'transform 0.22s cubic-bezier(.2,.8,.3,1)' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-6px) rotate(-.6deg)')}
                onMouseLeave={e => (e.currentTarget.style.transform = '')}
              >
                <BookCoverImage book={book} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontFamily: 'var(--sp-disp)', fontSize: 18, lineHeight: 1.08, color: 'var(--sp-ink)' }}>
                  {book.title}
                </span>
                {book.author && (
                  <span style={{ fontSize: 12.5, color: 'var(--sp-muted)' }}>{book.author}</span>
                )}
                <LeafRating value={book.rating} />
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedBook && (
        <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </>
  )
}
