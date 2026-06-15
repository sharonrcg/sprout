'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { addBook } from '@/app/actions'
import { coverUrl } from '@/lib/open-library'
import type { AddBookInput, BookSearchResult, BookStatus } from '@/lib/types'

interface Props {
  onSuccess?: () => void
}

export const AddBookForm = ({ onSuccess }: Props) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BookSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selected, setSelected] = useState<BookSearchResult | null>(null)

  const [status, setStatus] = useState<BookStatus>('finished')
  const [rating, setRating] = useState<number | null>(null)
  const [finishedAt, setFinishedAt] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return
    setIsSearching(true)
    try {
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`)
      if (res.ok) setResults(await res.json())
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelect = (book: BookSearchResult) => {
    setSelected(book)
    setQuery(book.title)
    setResults([])
  }

  const handleClear = () => {
    setSelected(null)
    setQuery('')
    setResults([])
    setRating(null)
    setNotes('')
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return

    const input: AddBookInput = {
      title: selected.title,
      author: selected.author,
      isbn: selected.isbn,
      cover_i: selected.cover_i,
      status,
      rating: status === 'finished' ? rating : null,
      notes: notes.trim() || null,
      finished_at: status === 'finished' ? finishedAt : null,
    }

    setError(null)
    startTransition(async () => {
      try {
        await addBook(input)
        router.refresh()
        onSuccess?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit}>
      {/* Search input */}
      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
          placeholder="Search for a book..."
          disabled={!!selected}
          autoComplete="off"
        />
        {selected ? (
          <button type="button" onClick={handleClear}>
            Clear
          </button>
        ) : (
          <button type="button" onClick={handleSearch} disabled={!query.trim() || isSearching}>
            {isSearching ? 'Searching…' : 'Search'}
          </button>
        )}
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <ul role="listbox" aria-label="Book search results">
          {results.map((book) => (
            <li key={book.openLibraryKey} role="option" aria-selected={false}>
              <button type="button" onClick={() => handleSelect(book)}>
                {book.cover_i && (
                  <Image
                    src={coverUrl(book.cover_i)!}
                    alt=""
                    width={32}
                    height={48}
                  />
                )}
                <span>{book.title}</span>
                <span>{book.author}</span>
                {book.firstPublishedYear && <span>{book.firstPublishedYear}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Fields shown after a book is selected */}
      {selected && (
        <>
          {/* Status */}
          <fieldset>
            <legend>Status</legend>
            {(['finished', 'reading', 'tbr'] as BookStatus[]).map((s) => (
              <label key={s}>
                <input
                  type="radio"
                  name="status"
                  value={s}
                  checked={status === s}
                  onChange={() => setStatus(s)}
                />
                {s === 'tbr' ? 'Want to read' : s[0].toUpperCase() + s.slice(1)}
              </label>
            ))}
          </fieldset>

          {/* Rating — only when finished */}
          {status === 'finished' && (
            <fieldset>
              <legend>Rating</legend>
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n}>
                  <input
                    type="radio"
                    name="rating"
                    value={n}
                    checked={rating === n}
                    onChange={() => setRating(n)}
                  />
                  {n}
                </label>
              ))}
              {rating !== null && (
                <button type="button" onClick={() => setRating(null)}>
                  Clear rating
                </button>
              )}
            </fieldset>
          )}

          {/* Date finished — only when finished */}
          {status === 'finished' && (
            <label>
              Date finished
              <input
                type="date"
                value={finishedAt}
                max={today}
                onChange={(e) => setFinishedAt(e.target.value)}
              />
            </label>
          )}

          {/* Notes */}
          <label>
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Your thoughts..."
              rows={4}
            />
          </label>
        </>
      )}

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={!selected || isPending}>
        {isPending ? 'Adding…' : 'Add book'}
      </button>
    </form>
  )
}
