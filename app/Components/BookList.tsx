import Image from 'next/image'
import { coverUrl, coverUrlByIsbn } from '@/lib/open-library'
import type { Book } from '@/lib/types'

const BookCard = ({ book }: { book: Book }) => {
  const src = book.cover_i
    ? coverUrl(book.cover_i)
    : book.isbn
    ? coverUrlByIsbn(book.isbn)
    : null

  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      {src ? (
        <Image
          src={src}
          alt={book.title}
          width={52}
          height={78}
          style={{ borderRadius: 5, objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <div style={{ width: 52, height: 78, borderRadius: 5, flexShrink: 0, background: 'var(--sp-bg-2)' }} />
      )}
      <div style={{ paddingTop: 4 }}>
        <p style={{ fontWeight: 600, color: 'var(--sp-ink)', fontSize: 15 }}>{book.title}</p>
        {book.author && (
          <p style={{ fontSize: 13, color: 'var(--sp-muted)', marginTop: 2 }}>{book.author}</p>
        )}
        {book.rating != null && (
          <p style={{ fontSize: 13, marginTop: 6, color: 'var(--sp-sage)' }}>
            {'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}
          </p>
        )}
      </div>
    </div>
  )
}

interface Props {
  books: Book[]
  emptyMessage?: string
}

export const BookList = ({ books, emptyMessage = 'No books here yet.' }: Props) => {
  if (books.length === 0) {
    return (
      <p style={{ color: 'var(--sp-muted)', fontSize: 14, paddingTop: 8 }}>{emptyMessage}</p>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {books.map(book => <BookCard key={book.id} book={book} />)}
    </div>
  )
}
