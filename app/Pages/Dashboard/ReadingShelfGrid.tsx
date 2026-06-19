'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { BarChart2, BookOpen, Check, Trash2 } from 'lucide-react'
import { coverUrl, coverUrlByIsbn } from '@/lib/open-library'
import { removeBook, finishBook } from '@/app/actions'
import { AddBookModal } from '@/app/Components/AddBookModal'
import { ReadingProgressModal } from '@/app/Components/ReadingProgressModal'
import { FinishBookModal } from '@/app/Components/FinishBookModal'
import type { Book } from '@/lib/types'
import '@/app/css/ReadingShelfGrid.css'

const COVER_COLORS = ['#7a6a52', '#5B7A52', '#8B6E3C', '#4A6B5A', '#7A5B4A', '#6B5A7A', '#5A6B7A']
const getCoverColor = (title: string) => COVER_COLORS[title.charCodeAt(0) % COVER_COLORS.length]

const BookCover = ({ book }: { book: Book }) => {
  const src = book.cover_i
    ? coverUrl(book.cover_i)
    : book.isbn
    ? coverUrlByIsbn(book.isbn)
    : null

  return (
    <div className="rc-book-cover" style={{ background: getCoverColor(book.title) }}>
      {src && <Image src={src} alt={book.title} fill sizes="92px" style={{ objectFit: 'cover' }} />}
      {!src && (
        <div className="rc-cover-fallback">
          <p className="rc-cover-fallback-title">{book.title}</p>
          {book.author && <p className="rc-cover-fallback-author">{book.author}</p>}
        </div>
      )}
      <div className="rc-cover-shine" />
    </div>
  )
}

const ReadingCard = ({ book, onOpen, onFinish, onRemove }: {
  book: Book
  onOpen: (book: Book) => void
  onFinish: (book: Book) => void
  onRemove: (id: string) => void
}) => {
  const pct = book.page_count && book.page_count > 0
    ? Math.min(100, Math.round(((book.current_page ?? 0) / book.page_count) * 100))
    : null

  return (
    <article onClick={() => onOpen(book)} className="rc-card">
      <div className="rc-cover-wrap">
        <BookCover book={book} />
      </div>

      <div className="rc-body">
        <div className="rc-body-top">
          <div>
            <h3 className="rc-book-title">{book.title}</h3>
            {book.author && <p className="rc-book-author">{book.author}</p>}
          </div>
        </div>

        <div className="rc-progress">
          <div className="rc-progress-track">
            <span
              className="rc-progress-fill"
              style={{ width: pct !== null ? `${pct}%` : '0%' }}
            />
          </div>
          <div className="rc-progress-label">
            <span>
              {pct !== null
                ? `${pct}% · page ${book.current_page ?? 0} of ${book.page_count}`
                : 'In progress'}
            </span>
          </div>
        </div>

        {book.notes && <p className="rc-notes">&ldquo;{book.notes}&rdquo;</p>}

        <div className="rc-footer">
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(book) }}
            className="rc-btn rc-btn-update"
          >
            <BarChart2 size={15} />
            Update progress
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onFinish(book) }}
            className="rc-btn rc-btn-finish"
          >
            <Check size={15} />
            Finished
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(book.id) }}
            aria-label="Remove book"
            className="rc-delete-btn"
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
  const [bookToFinish, setBookToFinish] = useState<Book | null>(null)


  const handleRemove = (id: string) => {
    startTransition(async () => {
      await removeBook(id)
      router.refresh()
    })
  }

  return (
    <>
      <div className="rc-header">
        <div className="rc-header-text">
          <p className="rc-label">In progress</p>
          <h1 className="rc-heading">Currently reading</h1>
          <p className="rc-subtitle">
            {books.length} {books.length === 1 ? 'book' : 'books'} on your nightstand
          </p>
        </div>
        <AddBookModal />
      </div>

      {books.length === 0 ? (
        <div className="rc-empty">
          <div className="rc-empty-icon">
            <BookOpen size={40} />
          </div>
          <h3 className="rc-empty-title">Nothing open right now</h3>
          <p className="rc-empty-text">
            When you crack open a new book, start it here and watch your progress grow.
          </p>
        </div>
      ) : (
        <div className="rc-list" style={{ opacity: isPending ? 0.6 : 1 }}>
          {books.map(book => (
            <ReadingCard
              key={book.id}
              book={book}
              onOpen={setActiveBook}
              onFinish={setBookToFinish}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {activeBook && (
        <ReadingProgressModal book={activeBook} onClose={() => setActiveBook(null)} />
      )}
      {bookToFinish && (
        <FinishBookModal
          book={bookToFinish}
          onSave={async (data) => {
            await finishBook(bookToFinish.id, data)
            router.push('/finished')
          }}
          onClose={() => setBookToFinish(null)}
        />
      )}
    </>
  )
}
