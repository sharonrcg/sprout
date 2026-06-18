'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Leaf, Check, ChevronLeft, Sparkles, Plus } from 'lucide-react'
import { addBook, getBooks } from '@/app/actions'
import { coverUrl } from '@/lib/open-library'
import type { AddBookInput, BookSearchResult } from '@/lib/types'
import '@/app/css/AddBookForm.css'

export type Mode = 'finished' | 'reading' | 'tbr'

const MODE_PATH: Record<Mode, string> = {
  finished: '/finished',
  reading: '/reading',
  tbr: '/tbr',
}

const MAX_MULTI_SELECT = 10

const InteractiveLeafRating = ({ value, onChange, size = 34 }: { value: number; onChange: (v: number) => void; size?: number }) => {
  const [hovered, setHovered] = useState(0)
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i === value ? 0 : i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className="abf-leaf-btn"
        >
          <Leaf
            size={size}
            style={{
              color: 'var(--sp-sage)',
              opacity: i <= (hovered || value) ? 1 : 0.25,
              fill: i <= (hovered || value) ? 'rgba(110,137,90,0.22)' : 'none',
              transition: 'opacity 0.12s, transform 0.12s',
              transform: hovered && i <= hovered ? 'scale(1.18) rotate(-6deg)' : 'none',
            }}
          />
        </button>
      ))}
    </div>
  )
}

interface Props {
  onSuccess?: () => void
  defaultMode?: Mode
}

export const AddBookForm = ({ onSuccess, defaultMode = 'finished' }: Props) => {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const [mode, setMode] = useState<Mode>(defaultMode)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BookSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selected, setSelected] = useState<BookSearchResult | null>(null)
  const [multiSelected, setMultiSelected] = useState<BookSearchResult[]>([])
  const [readingPage, setReadingPage] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [shelfKeys, setShelfKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    getBooks().then(books => {
      const keys = new Set(books.flatMap(b => {
        const out: string[] = []
        if (b.isbn) out.push(`isbn:${b.isbn}`)
        out.push(`title:${b.title.toLowerCase().trim()}::${(b.author ?? '').toLowerCase().trim()}`)
        return out
      }))
      setShelfKeys(keys)
    }).catch(() => {})
  }, [])

  const isMultiMode = mode !== 'reading'

  useEffect(() => {
    if (selected) return
    const term = query.trim()
    if (term.length < 2) { setResults([]); setIsSearching(false); return }
    setIsSearching(true)
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        if (res.ok) setResults(await res.json())
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== 'AbortError') setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [query, selected])

  const isOnShelf = (book: BookSearchResult): boolean => {
    if (book.isbn && shelfKeys.has(`isbn:${book.isbn}`)) return true
    return shelfKeys.has(`title:${book.title.toLowerCase().trim()}::${(book.author ?? '').toLowerCase().trim()}`)
  }

  const isBookSelected = (book: BookSearchResult) =>
    multiSelected.some(b => b.openLibraryKey === book.openLibraryKey)

  const toggleSelect = (book: BookSearchResult) => {
    setMultiSelected(prev => {
      if (prev.some(b => b.openLibraryKey === book.openLibraryKey)) {
        return prev.filter(b => b.openLibraryKey !== book.openLibraryKey)
      }
      if (prev.length >= MAX_MULTI_SELECT) return prev
      return [...prev, book]
    })
  }

  const handleSelect = (book: BookSearchResult) => {
    setSelected(book)
    setResults([])
  }

  const handleClear = () => {
    setSelected(null)
    setQuery('')
    setResults([])
    setReadingPage(0)
    setError(null)
    setMultiSelected([])
  }

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode)
    setMultiSelected([])
    setSelected(null)
  }

  const handleBulkAdd = () => {
    if (multiSelected.length === 0) return
    setError(null)
    startTransition(async () => {
      try {
        await Promise.all(multiSelected.map(book => addBook({
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          cover_i: book.cover_i,
          status: mode === 'tbr' ? 'tbr' : 'finished',
          rating: null,
          notes: null,
          finished_at: null,
          page_count: book.pageCount ?? null,
          current_page: null,
        })))
        handleClear()
        onSuccess?.()
        const target = MODE_PATH[mode]
        router.refresh()
        if (pathname !== target) router.push(target)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode !== 'reading' || !selected) return

    const input: AddBookInput = {
      title: selected.title,
      author: selected.author,
      isbn: selected.isbn,
      cover_i: selected.cover_i,
      status: 'reading',
      rating: null,
      notes: null,
      finished_at: null,
      page_count: selected.pageCount ?? null,
      current_page: readingPage,
    }

    setError(null)
    startTransition(async () => {
      try {
        await addBook(input)
        handleClear()
        onSuccess?.()
        router.refresh()
        if (pathname !== MODE_PATH.reading) router.push(MODE_PATH.reading)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* mode tabs */}
      <div className="abf-tabs">
        {(['finished', 'reading', 'tbr'] as Mode[]).map(m => {
          const label = m === 'finished' ? 'Finished' : m === 'reading' ? 'Reading now' : 'Want to read'
          return (
            <button
              key={m}
              type="button"
              onClick={() => handleModeChange(m)}
              className={`abf-tab ${mode === m ? 'abf-tab-active' : 'abf-tab-inactive'}`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* ── READING: single-select + progress detail ── */}
      {mode === 'reading' && !selected && (
        <div>
          <div className="abf-search-box">
            <Search size={22} style={{ flexShrink: 0 }} />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Start typing a title or author…"
              autoComplete="off"
              className="abf-search-input"
            />
            {isSearching && <span className="abf-spinner" />}
          </div>

          {query.trim().length >= 2 && (
            <div className="abf-results">
              {isSearching && results.length === 0 && (
                <p className="abf-results-msg">Searching the stacks…</p>
              )}
              {!isSearching && results.length === 0 && (
                <p className="abf-results-msg">No matches. Check the spelling?</p>
              )}
              {results.filter(b => !isOnShelf(b)).map((book, i) => {
                const src = book.cover_i ? coverUrl(book.cover_i) : null
                return (
                  <button
                    key={book.openLibraryKey + i}
                    type="button"
                    onClick={() => handleSelect(book)}
                    className="abf-result-item"
                  >
                    <div className="abf-result-cover-wrap">
                      <div className="abf-result-cover">
                        {src && <Image src={src} alt={book.title} fill sizes="40px" style={{ objectFit: 'cover' }} />}
                      </div>
                    </div>
                    <div className="abf-result-info">
                      <span className="abf-result-title">{book.title}</span>
                      <span className="abf-result-meta">
                        {book.author}{book.firstPublishedYear ? ` · ${book.firstPublishedYear}` : ''}
                      </span>
                    </div>
                    <div className="abf-result-add"><Plus size={15} /></div>
                  </button>
                )
              })}
            </div>
          )}

          {query.trim().length < 2 && (
            <p className="abf-hint">
              <Sparkles size={17} style={{ color: 'var(--sp-clay)', flexShrink: 0 }} />
              Covers &amp; details come straight from Open Library.
            </p>
          )}
        </div>
      )}

      {mode === 'reading' && selected && (
        <div className="abf-detail">
          <div className="abf-book-header">
            <div className="abf-book-cover-col">
              <div className="abf-book-cover">
                {selected.cover_i && (
                  <Image src={coverUrl(selected.cover_i)!} alt={selected.title} fill sizes="96px" style={{ objectFit: 'cover' }} />
                )}
              </div>
            </div>
            <div className="abf-book-meta">
              <h3 className="abf-book-title">{selected.title}</h3>
              {selected.author && (
                <p className="abf-book-author">
                  {selected.author}{selected.firstPublishedYear ? ` · ${selected.firstPublishedYear}` : ''}
                </p>
              )}
              <button type="button" onClick={handleClear} className="abf-change-btn">
                <ChevronLeft size={15} />
                Choose a different book
              </button>
            </div>
          </div>

          <div className="abf-reading-fields">
            {(() => {
              const pc = selected.pageCount ?? 0
              const pct = pc > 0 ? Math.round((readingPage / pc) * 100) : 0
              return (
                <>
                  <div className="abf-pct-row">
                    <span className="abf-pct-number">
                      {pct}<small className="abf-pct-sign">%</small>
                    </span>
                    <span className="abf-pct-label">
                      {pc > 0 ? `page ${readingPage} of ${pc}` : 'in progress'}
                    </span>
                  </div>
                  <input
                    type="range"
                    className="sp-slider"
                    min={0}
                    max={100}
                    value={pct}
                    onChange={e => setReadingPage(pc > 0 ? Math.round(Number(e.target.value) / 100 * pc) : 0)}
                    style={{ '--sp-pct': `${pct}%` } as React.CSSProperties}
                  />
                  <div>
                    <label className="abf-label">
                      Current page <span className="abf-label-faint">(optional)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={pc > 0 ? pc : undefined}
                      value={readingPage || ''}
                      placeholder="0"
                      onChange={e => {
                        const n = parseInt(e.target.value, 10)
                        setReadingPage(isNaN(n) ? 0 : Math.max(0, pc > 0 ? Math.min(n, pc) : n))
                      }}
                      className="abf-input abf-input-sm"
                    />
                  </div>
                </>
              )
            })()}
          </div>

          {error && <p role="alert" className="abf-error">{error}</p>}

          <div className="abf-actions">
            <button type="button" onClick={onSuccess} className="abf-cancel-btn">Cancel</button>
            <button
              type="submit"
              disabled={!selected || isPending}
              className="abf-submit-btn"
              style={{ opacity: isPending ? 0.7 : 1 }}
            >
              <Check size={16} />
              {isPending ? 'Adding…' : 'Start reading'}
            </button>
          </div>
        </div>
      )}

      {/* ── FINISHED / TBR: multi-select ── */}
      {isMultiMode && (
        <div>
          <div className="abf-search-box">
            <Search size={22} style={{ flexShrink: 0 }} />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Start typing a title or author…"
              autoComplete="off"
              className="abf-search-input"
            />
            {isSearching && <span className="abf-spinner" />}
          </div>

          {query.trim().length >= 2 && (
            <div className="abf-results">
              {isSearching && results.length === 0 && (
                <p className="abf-results-msg">Searching the stacks…</p>
              )}
              {!isSearching && results.length === 0 && (
                <p className="abf-results-msg">No matches. Check the spelling?</p>
              )}
              {results.map((book, i) => {
                const src = book.cover_i ? coverUrl(book.cover_i) : null
                const checked = isBookSelected(book)
                return (
                  <button
                    key={book.openLibraryKey + i}
                    type="button"
                    onClick={() => toggleSelect(book)}
                    className={`abf-result-item${checked ? ' abf-result-item-selected' : ''}`}
                  >
                    <div className="abf-result-cover-wrap">
                      <div className="abf-result-cover">
                        {src && <Image src={src} alt={book.title} fill sizes="40px" style={{ objectFit: 'cover' }} />}
                      </div>
                    </div>
                    <div className="abf-result-info">
                      <span className="abf-result-title">{book.title}</span>
                      <span className="abf-result-meta">
                        {book.author}{book.firstPublishedYear ? ` · ${book.firstPublishedYear}` : ''}
                      </span>
                    </div>
                    <div className={`abf-result-add${checked ? ' abf-result-add-checked' : ''}`}>
                      {checked ? <Check size={15} /> : <Plus size={15} />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {query.trim().length < 2 && multiSelected.length === 0 && (
            <p className="abf-hint">
              <Sparkles size={17} style={{ color: 'var(--sp-clay)', flexShrink: 0 }} />
              Covers &amp; details come straight from Open Library.
            </p>
          )}

          {error && <p role="alert" className="abf-error">{error}</p>}

          {multiSelected.length > 0 && (
            <div className="abf-bottom-bar">
              <div className="abf-bottom-info">
                <span className="abf-bottom-badge">{multiSelected.length}</span>
                <span className="abf-bottom-text">
                  book{multiSelected.length !== 1 ? 's' : ''} selected
                </span>
                <button type="button" onClick={() => setMultiSelected([])} className="abf-bottom-clear">
                  Clear
                </button>
              </div>
              <button
                type="button"
                onClick={handleBulkAdd}
                disabled={isPending}
                className="abf-submit-btn"
                style={{ opacity: isPending ? 0.7 : 1 }}
              >
                <Check size={16} />
                {isPending ? 'Adding…' : 'Add book(s) to shelf'}
              </button>
            </div>
          )}
        </div>
      )}
    </form>
  )
}
