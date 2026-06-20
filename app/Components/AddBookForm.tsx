'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Check, ChevronLeft, Sparkles, Plus, Layers, X } from 'lucide-react'
import { addBook, getBooks } from '@/app/actions'
import { coverUrl } from '@/lib/open-library'
import { FinishBookModal } from './FinishBookModal'
import type { AddBookInput, BookSearchResult, EditionCover } from '@/lib/types'
import '@/app/css/AddBookForm.css'

export type Mode = 'finished' | 'reading' | 'tbr'

const MODE_PATH: Record<Mode, string> = {
  finished: '/finished',
  reading: '/reading',
  tbr: '/tbr',
}

const MAX_MULTI_SELECT = 10


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
  const [singleFinishBook, setSingleFinishBook] = useState<BookSearchResult | null>(null)
  const [readingPage, setReadingPage] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [shelfKeys, setShelfKeys] = useState<Set<string>>(new Set())
  const [visibleCount, setVisibleCount] = useState(10)

  const [editionPickerTarget, setEditionPickerTarget] = useState<BookSearchResult | null>(null)
  const [coverOverrides, setCoverOverrides] = useState<Record<string, { cover_i: string; isbn: string | null }>>({})
  const [editionCovers, setEditionCovers] = useState<EditionCover[]>([])
  const [editionsLoading, setEditionsLoading] = useState(false)

  const effectiveCoverId = (book: BookSearchResult) => coverOverrides[book.openLibraryKey]?.cover_i ?? book.cover_i
  const effectiveIsbn = (book: BookSearchResult) => coverOverrides[book.openLibraryKey]?.isbn ?? book.isbn

  const openEditionPicker = async (e: React.MouseEvent, book: BookSearchResult) => {
    e.stopPropagation()
    setEditionPickerTarget(book)
    setEditionCovers([])
    setEditionsLoading(true)
    try {
      const res = await fetch(`/api/books/editions?key=${encodeURIComponent(book.openLibraryKey)}`)
      if (res.ok) setEditionCovers(await res.json())
    } catch {}
    setEditionsLoading(false)
  }

  const pickEditionCover = (cover: EditionCover) => {
    if (!editionPickerTarget) return
    setCoverOverrides(prev => ({ ...prev, [editionPickerTarget.openLibraryKey]: { cover_i: cover.cover_i, isbn: cover.isbn } }))
    setEditionPickerTarget(null)
  }

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

  useEffect(() => { setVisibleCount(10) }, [query])

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
    setCoverOverrides({})
    setEditionPickerTarget(null)
    setEditionCovers([])
  }

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode)
    setMultiSelected([])
    setSelected(null)
    setSingleFinishBook(null)
    setVisibleCount(10)
  }

  const handleBulkAdd = () => {
    if (multiSelected.length === 0) return
    setError(null)
    startTransition(async () => {
      try {
        await Promise.all(multiSelected.map(book => addBook({
          title: book.title,
          author: book.author,
          isbn: effectiveIsbn(book),
          cover_i: effectiveCoverId(book),
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
      isbn: effectiveIsbn(selected),
      cover_i: effectiveCoverId(selected),
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

  const renderResultItem = (book: BookSearchResult, i: number, onClickMain: () => void) => {
    const activeCoverId = effectiveCoverId(book)
    const src = activeCoverId ? coverUrl(activeCoverId) : null
    const checked = isBookSelected(book)
    const onShelf = isOnShelf(book)
    const hasOverride = !!coverOverrides[book.openLibraryKey]
    return (
      <div
        key={book.openLibraryKey + i}
        role="button"
        tabIndex={onShelf ? -1 : 0}
        onClick={() => { if (!onShelf) onClickMain() }}
        onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !onShelf) onClickMain() }}
        className={`abf-result-item${checked ? ' abf-result-item-selected' : ''}${onShelf ? ' abf-result-item-on-shelf' : ''}`}
        title={onShelf ? 'Already on your shelf' : undefined}
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
        <div className="abf-result-actions">
          {!onShelf && (
            <button
              type="button"
              className={`abf-editions-btn${hasOverride ? ' abf-editions-btn-active' : ''}`}
              onClick={e => openEditionPicker(e, book)}
              aria-label="Choose edition"
              title="Choose edition"
            >
              <Layers size={13} />
            </button>
          )}
          <div className={`abf-result-add${onShelf ? ' abf-result-add-on-shelf' : ''}${checked ? ' abf-result-add-checked' : ''}`}>
            {onShelf ? <Check size={15} /> : checked ? <Check size={15} /> : <Plus size={15} />}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
    {/* Edition picker modal */}
    {editionPickerTarget && (
      <div className="abf-edition-overlay" onClick={() => setEditionPickerTarget(null)}>
        <div className="abf-edition-modal" onClick={e => e.stopPropagation()}>
          <div className="abf-edition-header">
            <div>
              <p className="abf-edition-label">Choose an edition</p>
              <p className="abf-edition-book">{editionPickerTarget.title}</p>
            </div>
            <button type="button" className="abf-edition-close" onClick={() => setEditionPickerTarget(null)}>
              <X size={18} />
            </button>
          </div>
          {editionsLoading ? (
            <p className="abf-edition-msg">Loading editions…</p>
          ) : editionCovers.length === 0 ? (
            <p className="abf-edition-msg">No alternate covers found.</p>
          ) : (
            <div className="abf-edition-grid">
              {editionCovers.map(cover => {
                const isActive = (coverOverrides[editionPickerTarget.openLibraryKey]?.cover_i ?? editionPickerTarget.cover_i) === cover.cover_i
                return (
                  <button
                    key={cover.cover_i}
                    type="button"
                    className={`abf-edition-cover-btn${isActive ? ' abf-edition-cover-active' : ''}`}
                    onClick={() => pickEditionCover(cover)}
                  >
                    <Image src={coverUrl(cover.cover_i)!} alt="Edition cover" fill sizes="90px" style={{ objectFit: 'cover' }} />
                    {isActive && (
                      <div className="abf-edition-check"><Check size={13} /></div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )}

    {singleFinishBook && (
      <FinishBookModal
        book={{ ...singleFinishBook, openLibraryKey: singleFinishBook.openLibraryKey }}
        onSave={async (data) => {
          await addBook({
            title: singleFinishBook.title,
            author: singleFinishBook.author,
            isbn: data.isbn ?? effectiveIsbn(singleFinishBook),
            cover_i: data.cover_i ?? effectiveCoverId(singleFinishBook),
            status: 'finished',
            rating: data.rating,
            notes: data.notes,
            finished_at: data.finished_at,
            page_count: singleFinishBook.pageCount ?? null,
            current_page: null,
          })
          handleClear()
          onSuccess?.()
          router.refresh()
          if (pathname !== MODE_PATH.finished) router.push(MODE_PATH.finished)
        }}
        onClose={() => setSingleFinishBook(null)}
      />
    )}
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
              {results.slice(0, visibleCount).map((book, i) =>
                renderResultItem(book, i, () => handleSelect(book))
              )}
              {results.length > visibleCount && (
                <button type="button" onClick={() => setVisibleCount(c => c + 10)} className="abf-show-more-btn">
                  Show more
                </button>
              )}
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
                {effectiveCoverId(selected) && (
                  <Image src={coverUrl(effectiveCoverId(selected))!} alt={selected.title} fill sizes="96px" style={{ objectFit: 'cover' }} />
                )}
              </div>
              <button type="button" className="abf-editions-detail-btn" onClick={e => openEditionPicker(e, selected)}>
                <Layers size={12} /> Editions
              </button>
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
              {results.slice(0, visibleCount).map((book, i) =>
                renderResultItem(book, i, () => toggleSelect(book))
              )}
              {results.length > visibleCount && (
                <button type="button" onClick={() => setVisibleCount(c => c + 10)} className="abf-show-more-btn">
                  Show more
                </button>
              )}
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
                onClick={() => {
                  if (mode === 'finished' && multiSelected.length === 1) {
                    const book = multiSelected[0]
                    setSingleFinishBook({ ...book, cover_i: effectiveCoverId(book), isbn: effectiveIsbn(book) })
                  } else {
                    handleBulkAdd()
                  }
                }}
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
    </>
  )
}
