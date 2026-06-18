'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Bookmark, ChevronUp, ChevronDown, Trash2, Check, BookOpen } from 'lucide-react'
import { coverUrl, coverUrlByIsbn } from '@/lib/open-library'
import { removeBook, updateTbrOrder, updateBookStatus } from '@/app/actions'
import { AddBookModal } from '@/app/Components/AddBookModal'
import { ReadingProgressModal } from '@/app/Components/ReadingProgressModal'
import type { Book } from '@/lib/types'
import '@/app/css/TbrShelfGrid.css'

const COVER_COLORS = ['#7a6a52', '#5B7A52', '#8B6E3C', '#4A6B5A', '#7A5B4A', '#6B5A7A', '#5A6B7A']
const getCoverColor = (title: string) => COVER_COLORS[title.charCodeAt(0) % COVER_COLORS.length]

const BookCover = ({ book }: { book: Book }) => {
  const src = book.cover_i
    ? coverUrl(book.cover_i)
    : book.isbn
    ? coverUrlByIsbn(book.isbn)
    : null

  return (
    <div className="tbr-cover" style={{ background: getCoverColor(book.title) }}>
      {src && <Image src={src} alt={book.title} fill sizes="54px" style={{ objectFit: 'cover' }} />}
      {!src && (
        <div className="tbr-cover-fallback">
          <p>{book.title}</p>
        </div>
      )}
    </div>
  )
}

interface Props {
  books: Book[]
}

export const TbrShelfGrid = ({ books }: Props) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [items, setItems] = useState<Book[]>(
    [...books].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  )

  useEffect(() => {
    setItems([...books].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)))
  }, [books])

  const move = (index: number, dir: -1 | 1) => {
    const next = [...items]
    const swapIdx = index + dir
    ;[next[index], next[swapIdx]] = [next[swapIdx], next[index]]
    setItems(next)
    startTransition(async () => {
      await updateTbrOrder(next.map(b => b.id))
    })
  }

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(b => b.id !== id))
    startTransition(async () => {
      await removeBook(id)
      router.refresh()
    })
  }

  const handleFinished = (id: string) => {
    startTransition(async () => {
      await updateBookStatus(id, 'finished')
      router.push('/finished')
    })
  }

  const [progressBook, setProgressBook] = useState<Book | null>(null)

  return (
    <>
      <div className="tbr-header">
        <div className="tbr-header-text">
          <p className="tbr-label">The pile</p>
          <h1 className="tbr-heading">Want to read</h1>
          <p className="tbr-subtitle">
            {items.length} {items.length === 1 ? 'book' : 'books'} on your list
          </p>
        </div>
        <AddBookModal />
      </div>

      {items.length === 0 ? (
        <div className="tbr-empty">
          <div className="tbr-empty-icon">
            <Bookmark size={40} />
          </div>
          <h3 className="tbr-empty-title">Your list is empty</h3>
          <p className="tbr-empty-text">
            Add books you want to read and they&apos;ll queue up here.
          </p>
        </div>
      ) : (
        <ul className="tbr-list" style={{ opacity: isPending ? 0.7 : 1 }}>
          {items.map((book, i) => (
            <li key={book.id} className="tbr-card">
              <div className="tbr-left">
                <div className="tbr-arrows">
                  <button
                    className="tbr-arrow-btn"
                    onClick={() => move(i, -1)}
                    disabled={i === 0 || isPending}
                    aria-label="Move up"
                    style={{ opacity: i === 0 ? 0.3 : 1 }}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    className="tbr-arrow-btn"
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1 || isPending}
                    aria-label="Move down"
                    style={{ opacity: i === items.length - 1 ? 0.3 : 1 }}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <span className="tbr-rank">{i + 1}</span>
                <BookCover book={book} />
              </div>

              <div className="tbr-right">
                <div className="tbr-info">
                  <p className="tbr-book-title">{book.title}</p>
                  {book.author && (
                    <p className="tbr-book-author">{book.author}</p>
                  )}
                </div>
                <div className="tbr-actions">
                  <div className="tbr-btn-group">
                    <button onClick={() => handleFinished(book.id)} disabled={isPending} className="tbr-btn tbr-btn-finished">
                      <Check size={14} /> Finished
                    </button>
                    <button onClick={() => setProgressBook(book)} disabled={isPending} className="tbr-btn tbr-btn-reading">
                      <BookOpen size={14} /> Reading
                    </button>
                  </div>
                  <button
                    className="tbr-delete-btn"
                    onClick={() => handleDelete(book.id)}
                    aria-label="Remove"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {progressBook && (
        <ReadingProgressModal book={progressBook} onClose={() => setProgressBook(null)} />
      )}
    </>
  )
}
