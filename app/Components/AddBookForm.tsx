'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Leaf, Check, ChevronLeft, Sparkles } from 'lucide-react'
import { addBook } from '@/app/actions'
import { coverUrl } from '@/lib/open-library'
import type { AddBookInput, BookSearchResult } from '@/lib/types'
import '@/app/css/AddBookForm.css'

export type Mode = 'finished' | 'reading' | 'tbr'

const MODE_PATH: Record<Mode, string> = {
  finished: '/finished',
  reading: '/reading',
  tbr: '/tbr',
}

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
  const [rating, setRating] = useState(0)
  const [finishedAt, setFinishedAt] = useState(() => new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [readingPage, setReadingPage] = useState(0)
  const [error, setError] = useState<string | null>(null)

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

  const handleSelect = (book: BookSearchResult) => {
    console.log('sg', book)
    setSelected(book)
    setResults([])
  }

  const handleClear = () => {
    setSelected(null)
    setQuery('')
    setResults([])
    setRating(0)
    setNotes('')
    setReadingPage(0)
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return

    const pageCount = selected.pageCount ?? null
    const currentPage = mode === 'reading' ? readingPage : null

    const input: AddBookInput = {
      title: selected.title,
      author: selected.author,
      isbn: selected.isbn,
      cover_i: selected.cover_i,
      status: mode === 'tbr' ? 'tbr' : mode === 'reading' ? 'reading' : 'finished',
      rating: mode === 'finished' ? (rating || null) : null,
      notes: mode === 'finished' ? (notes.trim() || null) : null,
      finished_at: mode === 'finished' ? (finishedAt || null) : null,
      page_count: pageCount,
      current_page: currentPage,
    }

    setError(null)
    startTransition(async () => {
      try {
        await addBook(input)
        handleClear()
        onSuccess?.()
        const target = MODE_PATH[mode]
        router.refresh()
        if (pathname !== target) {
          router.push(target)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  const today = new Date().toISOString().split('T')[0]
  const submitLabel = mode === 'finished' ? 'Add to shelf' : mode === 'reading' ? 'Start reading' : 'Add to TBR'

  return (
    <form onSubmit={handleSubmit}>
      {/* 3-tab segment */}
      <div className="abf-tabs">
        {(['finished', 'reading', 'tbr'] as Mode[]).map(m => {
          const label = m === 'finished' ? 'Finished' : m === 'reading' ? 'Reading now' : 'Want to read'
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`abf-tab ${mode === m ? 'abf-tab-active' : 'abf-tab-inactive'}`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* ── search phase ── */}
      {!selected && (
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
                    <div className="abf-result-add">+</div>
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

      {/* ── detail phase ── */}
      {selected && (
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

          {/* finished fields */}
          {mode === 'finished' && (
            <>
              <div>
                <label className="abf-label">How was it?</label>
                <div className="abf-rating-row">
                  <InteractiveLeafRating value={rating} onChange={setRating} />
                </div>
              </div>
              <div>
                <label className="abf-label">Date finished <span className="abf-label-faint">(optional)</span></label>
                <input type="date" value={finishedAt} max={today} onChange={e => setFinishedAt(e.target.value)} className="abf-input" />
              </div>
              <div>
                <label className="abf-label">Your thoughts</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="What stayed with you?"
                  rows={3}
                  className="abf-textarea"
                />
              </div>
            </>
          )}

          {/* reading fields */}
          {mode === 'reading' && (
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
                        Current page{' '}
                        <span className="abf-label-faint">(optional)</span>
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
          )}

          {error && <p role="alert" className="abf-error">{error}</p>}

          <div className="abf-actions">
            <button type="button" onClick={onSuccess} className="abf-cancel-btn">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selected || isPending}
              className="abf-submit-btn"
              style={{ opacity: isPending ? 0.7 : 1 }}
            >
              <Check size={16} />
              {isPending ? 'Adding…' : submitLabel}
            </button>
          </div>
        </div>
      )}
    </form>
  )
}
