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

const COVER_COLORS = ['#7a6a52', '#5B7A52', '#8B6E3C', '#4A6B5A', '#7A5B4A', '#6B5A7A', '#5A6B7A']
const getCoverColor = (title: string) => {
  return COVER_COLORS[title.charCodeAt(0) % COVER_COLORS.length]
}

const BookCover = ({ book }: { book: Book }) => {
  const src = book.cover_i
    ? coverUrl(book.cover_i)
    : book.isbn
    ? coverUrlByIsbn(book.isbn)
    : null

  return (
    <div
      style={{
        position: 'relative', width: 54, flexShrink: 0,
        aspectRatio: '2/3', borderRadius: 5, overflow: 'hidden',
        background: getCoverColor(book.title),
        boxShadow: '0 4px 12px -4px rgba(45,42,32,0.4)',
      }}
    >
      {src && <Image src={src} alt={book.title} fill sizes="54px" style={{ objectFit: 'cover', zIndex: 1 }} />}
      {!src && (
        <div style={{ position: 'absolute', inset: 0, padding: '10% 8%', color: '#fff' }}>
          <p style={{ fontFamily: 'var(--sp-disp)', fontSize: 9, lineHeight: 1.05, margin: 0 }}>{book.title}</p>
        </div>
      )}
    </div>
  )
}

const arrowBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 26, height: 26, borderRadius: 7,
  border: '1px solid var(--sp-line)', background: 'var(--sp-paper)',
  color: 'var(--sp-muted)', cursor: 'pointer',
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
      <div
        style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          gap: '18px 24px', marginBottom: 22, flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: '1 1 360px', minWidth: 0 }}>
          <p style={{ fontSize: 11, letterSpacing: '1.6px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--sp-muted)', margin: '0 0 6px' }}>
            The pile
          </p>
          <h1 style={{ fontFamily: 'var(--sp-disp)', fontWeight: 400, fontSize: 'clamp(32px, 4.4vw, 48px)', lineHeight: 1.06, color: 'var(--sp-ink)', margin: 0 }}>
            Want to read
          </h1>
          <p style={{ color: 'var(--sp-muted)', fontSize: 15, marginTop: 8, marginBottom: 0 }}>
            {items.length} {items.length === 1 ? 'book' : 'books'} on your list
          </p>
        </div>
        <AddBookModal />
      </div>

      {items.length === 0 ? (
        <div
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textAlign: 'center', gap: 10, padding: '70px 24px', color: 'var(--sp-ink-soft)',
          }}
        >
          <div style={{ width: 88, height: 88, borderRadius: 26, background: 'var(--sp-sage-soft)', color: 'var(--sp-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
            <Bookmark size={40} />
          </div>
          <h3 style={{ fontFamily: 'var(--sp-disp)', fontSize: 27, fontWeight: 400, color: 'var(--sp-ink)', margin: 0 }}>
            Your list is empty
          </h3>
          <p style={{ maxWidth: 320, color: 'var(--sp-muted)', lineHeight: 1.5, margin: 0 }}>
            Add books you want to read and they&apos;ll queue up here.
          </p>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12, opacity: isPending ? 0.7 : 1, transition: 'opacity 0.15s' }}>
          {items.map((book, i) => (
            <li
              key={book.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px',
                background: 'var(--sp-paper)', border: '1px solid var(--sp-line)',
                borderRadius: 20, boxShadow: '0 2px 8px -3px rgba(45,42,32,0.22)',
              }}
            >
              {/* rank */}
              <span style={{ fontFamily: 'var(--sp-disp)', fontSize: 26, color: 'var(--sp-clay)', width: 28, textAlign: 'center', flexShrink: 0 }}>
                {i + 1}
              </span>

              <BookCover book={book} />

              {/* info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--sp-disp)', fontSize: 21, lineHeight: 1.14, color: 'var(--sp-ink)', margin: 0 }}>
                  {book.title}
                </p>
                {book.author && (
                  <p style={{ fontSize: 13, color: 'var(--sp-muted)', marginTop: 3, marginBottom: 0 }}>
                    {book.author}
                  </p>
                )}
              </div>

              {/* actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {/* up/down */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0 || isPending}
                    aria-label="Move up"
                    style={{ ...arrowBtn, opacity: i === 0 ? 0.3 : 1 }}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1 || isPending}
                    aria-label="Move down"
                    style={{ ...arrowBtn, opacity: i === items.length - 1 ? 0.3 : 1 }}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                {/* finished + reading */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button
                    onClick={() => handleFinished(book.id)}
                    disabled={isPending}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: '4px 16px', borderRadius: 999,
                      background: 'var(--sp-sage)', color: '#fff',
                      fontFamily: 'var(--sp-body)', fontWeight: 600, fontSize: 14,
                      border: 'none', cursor: 'pointer',
                      boxShadow: '0 8px 18px -8px var(--sp-sage)',
                    }}
                  >
                    <Check size={14} />
                    Finished
                  </button>
                  <button
                    onClick={() => setProgressBook(book)}
                    disabled={isPending}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: '4px 16px', borderRadius: 999,
                      background: 'var(--sp-clay)', color: '#fff',
                      fontFamily: 'var(--sp-body)', fontWeight: 600, fontSize: 14,
                      border: 'none', cursor: 'pointer',
                      boxShadow: '0 8px 18px -8px var(--sp-clay)',
                    }}
                  >
                    <BookOpen size={14} />
                    Reading
                  </button>
                </div>

                {/* delete */}
                <button
                  onClick={() => handleDelete(book.id)}
                  aria-label="Remove"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 34, height: 34, borderRadius: 9,
                    border: '1px solid var(--sp-line)', background: 'var(--sp-paper)',
                    color: 'var(--sp-muted)', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <Trash2 size={15} />
                </button>
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
