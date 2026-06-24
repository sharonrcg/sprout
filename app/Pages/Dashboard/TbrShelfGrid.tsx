'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Bookmark, GripVertical, Trash2, Check, BookOpen, Leaf } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { coverUrl, coverUrlByIsbn } from '@/lib/open-library'
import { removeBook, updateTbrOrder, finishBook } from '@/app/actions'
import { AddBookModal } from '@/app/Components/AddBookModal'
import { ReadingProgressModal } from '@/app/Components/ReadingProgressModal'
import { FinishBookModal } from '@/app/Components/FinishBookModal'
import { ShelfMove } from '@/app/Components/ShelfMove'
import type { Book } from '@/lib/types'
import '@/app/css/TbrShelfGrid.css'
import '@/app/globals.css'

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

const SortableBookItem = ({
  book,
  index,
  onFinish,
  onProgress,
  onDelete,
}: {
  book: Book
  index: number
  onFinish: (book: Book) => void
  onProgress: (book: Book) => void
  onDelete: (id: string) => void
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: book.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: isDragging ? ('relative' as const) : undefined,
  }

  return (
    <li ref={setNodeRef} style={style} className="tbr-card">
      <div className="tbr-left">
        <button
          className="tbr-drag-handle"
          {...listeners}
          {...attributes}
          aria-label="Drag to reorder"
          tabIndex={0}
        >
          <GripVertical size={16} />
        </button>
        <span className="tbr-rank">{index + 1}</span>
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
          <ShelfMove
            targets={[
              {
                id: 'reading',
                label: 'Reading now',
                swatchClass: 'ic-amber',
                Icon: BookOpen,
                onClick: () => onProgress(book),
              },
              {
                id: 'finished',
                label: 'Finished',
                swatchClass: 'ic-sage',
                Icon: Check,
                onClick: () => onFinish(book),
              },
            ]}
          />
          <button
            className="tbr-delete-btn"
            onClick={() => onDelete(book.id)}
            aria-label="Remove"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </li>
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex(b => b.id === active.id)
    const newIndex = items.findIndex(b => b.id === over.id)
    const next = arrayMove(items, oldIndex, newIndex)
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

  const [progressBook, setProgressBook] = useState<Book | null>(null)
  const [bookToFinish, setBookToFinish] = useState<Book | null>(null)

  return (
    <>
      <div className="header-logo">
        <div className="sp-mobile-top">
          <span className="sb-logo-icon">
            <Leaf size={40} />
          </span>
        </div>

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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <ul className="tbr-list" style={{ opacity: isPending ? 0.7 : 1 }}>
              {items.map((book, i) => (
                <SortableBookItem
                  key={book.id}
                  book={book}
                  index={i}
                  onFinish={setBookToFinish}
                  onProgress={setProgressBook}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {progressBook && (
        <ReadingProgressModal book={progressBook} onClose={() => setProgressBook(null)} />
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
