'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Search, X, Leaf, ChevronDown } from 'lucide-react'
import { coverUrl, coverUrlByIsbn } from '@/lib/open-library'
import { AddBookModal } from '@/app/Components/AddBookModal'
import { BookDetailModal } from '@/app/Components/BookDetailModal'
import type { Book } from '@/lib/types'
import '@/app/css/FinishedShelfGrid.css'
import '@/app/globals.css'

const SORT_OPTIONS = {
  recent: {
    label: 'Recent',
    fn: (a: Book, b: Book) =>
      (b.finished_at ?? b.created_at).localeCompare(a.finished_at ?? a.created_at),
  },
  rating: {
    label: 'Rating',
    fn: (a: Book, b: Book) =>
      (b.rating ?? 0) - (a.rating ?? 0) ||
      (b.finished_at ?? '').localeCompare(a.finished_at ?? ''),
  },
  title: {
    label: 'A–Z',
    fn: (a: Book, b: Book) => a.title.localeCompare(b.title),
  },
} as const

type SortKey = keyof typeof SORT_OPTIONS

const COVER_COLORS = ['#7a6a52', '#5B7A52', '#8B6E3C', '#4A6B5A', '#7A5B4A', '#6B5A7A', '#5A6B7A']
const getCoverColor = (title: string) => COVER_COLORS[title.charCodeAt(0) % COVER_COLORS.length]

const LeafRating = ({ value }: { value: number | null }) => {
  const v = value ?? 0
  return (
    <div className="fg-leaf-rating">
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
    <div className="fg-book-cover" style={{ background: getCoverColor(book.title) }}>
      {src && (
        <Image src={src} alt={book.title} fill sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 200px" style={{ objectFit: 'cover' }} />
      )}
      {!src && (
        <div className="fg-cover-fallback">
          <p className="fg-cover-fallback-title">{book.title}</p>
          {book.author && <p className="fg-cover-fallback-author">{book.author}</p>}
        </div>
      )}
      <div className="fg-cover-shine" />
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
      <div className="header-logo">
        <div className="sp-mobile-top">
          <span className="sb-logo-icon">
            <Leaf size={40} />
          </span>
        </div>
        <div className="fg-header">
          <div className="fg-header-text">
            <p className="fg-label">Your library</p>
            <h1 className="fg-heading">Recently finished</h1>
            <p className="fg-subtitle">
              {books.length} {books.length === 1 ? 'book' : 'books'} on the shelf
            </p>
          </div>
          <AddBookModal />
        </div>
      </div>

      <div className="fg-controls">
        <div className="fg-search">
          <Search size={18} style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search your shelf — title, author…"
            value={q}
            onChange={e => setQ(e.target.value)}
            className="fg-search-input"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              aria-label="Clear search"
              className="fg-search-clear"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="fg-sort">
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="fg-sort-select"
          >
            {(Object.entries(SORT_OPTIONS) as [SortKey, (typeof SORT_OPTIONS)[SortKey]][]).map(
              ([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              )
            )}
          </select>
          <ChevronDown size={15} className="fg-sort-chevron" />
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="fg-empty">
          <div className="fg-empty-icon">
            <Search size={40} />
          </div>
          <h3 className="fg-empty-title">
            {q ? 'Nothing matched' : "Nothing here yet"}
          </h3>
          <p className="fg-empty-text">
            {q
              ? 'No books match that search. Try a different title or author.'
              : "Add a book you've finished and it'll appear here."}
          </p>
          {q && (
            <button onClick={() => setQ('')} className="fg-clear-btn">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="fg-grid">
          {shown.map(book => (
            <button
              key={book.id}
              onClick={() => setSelectedBook(book)}
              className="fg-book-btn"
            >
              <div className="fg-cover-wrap">
                <BookCoverImage book={book} />
              </div>
              <div className="fg-book-info">
                <span className="fg-book-title">{book.title}</span>
                {book.author && (
                  <span className="fg-book-author">{book.author}</span>
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
