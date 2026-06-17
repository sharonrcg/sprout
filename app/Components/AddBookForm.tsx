'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Leaf, Check, ChevronLeft, Sparkles } from 'lucide-react'
import { addBook } from '@/app/actions'
import { coverUrl } from '@/lib/open-library'
import type { AddBookInput, BookSearchResult } from '@/lib/types'

export type Mode = 'finished' | 'reading' | 'tbr'

const MODE_PATH: Record<Mode, string> = {
  finished: '/finished',
  reading: '/reading',
  tbr: '/tbr',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 15px',
  borderRadius: 14,
  border: '1px solid var(--sp-line-2)',
  background: 'var(--sp-paper)',
  fontSize: 15,
  color: 'var(--sp-ink)',
  fontFamily: 'var(--sp-body)',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--sp-ink-soft)',
  display: 'block',
  marginBottom: 9,
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
          style={{ display: 'flex', padding: 3, cursor: 'pointer', background: 'none', border: 'none' }}
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

  // debounced live search
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
      notes: notes.trim() || null,
      finished_at: mode === 'finished' ? finishedAt : null,
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
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          background: 'var(--sp-bg-2)',
          borderRadius: 999,
          marginBottom: 20,
        }}
      >
        {(['finished', 'reading', 'tbr'] as Mode[]).map(m => {
          const label = m === 'finished' ? 'Finished' : m === 'reading' ? 'Reading now' : 'Want to read'
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: '10px 6px',
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 13.5,
                fontFamily: 'var(--sp-body)',
                color: mode === m ? 'var(--sp-ink)' : 'var(--sp-ink-soft)',
                background: mode === m ? 'var(--sp-paper)' : 'transparent',
                boxShadow: mode === m ? '0 2px 8px -3px rgba(45,42,32,0.22)' : 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* ── search phase ── */}
      {!selected && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '15px 18px',
              borderRadius: 14,
              background: 'var(--sp-paper)',
              border: '1px solid var(--sp-line-2)',
              color: 'var(--sp-muted)',
            }}
          >
            <Search size={22} style={{ flexShrink: 0 }} />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Start typing a title or author…"
              autoComplete="off"
              style={{
                flex: 1,
                border: 'none',
                background: 'none',
                outline: 'none',
                fontSize: 16.5,
                color: 'var(--sp-ink)',
                fontFamily: 'var(--sp-body)',
              }}
            />
            {isSearching && (
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: '2.5px solid var(--sp-sage-soft)',
                  borderTopColor: 'var(--sp-sage)',
                  display: 'inline-block',
                  flexShrink: 0,
                  animation: 'sp-spin 0.7s linear infinite',
                }}
              />
            )}
          </div>

          {query.trim().length >= 2 && (
            <div
              style={{
                marginTop: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                maxHeight: '40vh',
                overflowY: 'auto',
                background: 'var(--sp-paper)',
                border: '1px solid var(--sp-line)',
                borderRadius: 14,
                padding: 6,
                boxShadow: '0 2px 8px -3px rgba(45,42,32,0.22)',
              }}
            >
              {isSearching && results.length === 0 && (
                <p style={{ padding: 18, textAlign: 'center', color: 'var(--sp-muted)', fontSize: 14, margin: 0 }}>
                  Searching the stacks…
                </p>
              )}
              {!isSearching && results.length === 0 && (
                <p style={{ padding: 18, textAlign: 'center', color: 'var(--sp-muted)', fontSize: 14, margin: 0 }}>
                  No matches. Check the spelling?
                </p>
              )}
              {results.map((book, i) => {
                const src = book.cover_i ? coverUrl(book.cover_i) : null
                return (
                  <button
                    key={book.openLibraryKey + i}
                    type="button"
                    onClick={() => handleSelect(book)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 13,
                      padding: '8px 10px',
                      borderRadius: 11,
                      textAlign: 'left',
                      background: 'none',
                      cursor: 'pointer',
                      border: 'none',
                      width: '100%',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--sp-bg-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <div style={{ width: 40, flexShrink: 0 }}>
                      <div
                        style={{
                          position: 'relative',
                          width: 40,
                          aspectRatio: '2/3',
                          borderRadius: 4,
                          overflow: 'hidden',
                          background: '#7a6a52',
                          boxShadow: '0 2px 8px -3px rgba(45,42,32,0.4)',
                        }}
                      >
                        {src && <Image src={src} alt={book.title} fill sizes="40px" style={{ objectFit: 'cover' }} />}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span
                        style={{
                          fontFamily: 'var(--sp-disp)',
                          fontSize: 17.5,
                          lineHeight: 1.1,
                          color: 'var(--sp-ink)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {book.title}
                      </span>
                      <span style={{ fontSize: 12.5, color: 'var(--sp-muted)' }}>
                        {book.author}{book.firstPublishedYear ? ` · ${book.firstPublishedYear}` : ''}
                      </span>
                    </div>
                    <div
                      style={{
                        flexShrink: 0,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'var(--sp-sage-soft)',
                        color: 'var(--sp-sage-deep)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        lineHeight: 1,
                      }}
                    >
                      +
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {query.trim().length < 2 && (
            <p
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 16,
                color: 'var(--sp-muted)',
                fontSize: 13.5,
                margin: '16px 0 0',
              }}
            >
              <Sparkles size={17} style={{ color: 'var(--sp-clay)', flexShrink: 0 }} />
              Covers &amp; details come straight from Open Library.
            </p>
          )}
        </div>
      )}

      {/* ── detail phase ── */}
      {selected && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* book header */}
          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
            <div style={{ width: 96, flexShrink: 0 }}>
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '2/3',
                  borderRadius: 9,
                  overflow: 'hidden',
                  background: '#7a6a52',
                  boxShadow: '0 10px 22px -10px rgba(45,42,32,0.5)',
                }}
              >
                {selected.cover_i && (
                  <Image src={coverUrl(selected.cover_i)!} alt={selected.title} fill sizes="96px" style={{ objectFit: 'cover' }} />
                )}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
              <h3
                style={{
                  fontFamily: 'var(--sp-disp)',
                  fontSize: 28,
                  fontWeight: 400,
                  lineHeight: 1.04,
                  color: 'var(--sp-ink)',
                  margin: 0,
                }}
              >
                {selected.title}
              </h3>
              {selected.author && (
                <p style={{ color: 'var(--sp-muted)', fontSize: 14.5, marginTop: 4, marginBottom: 0 }}>
                  {selected.author}{selected.firstPublishedYear ? ` · ${selected.firstPublishedYear}` : ''}
                </p>
              )}
              <button
                type="button"
                onClick={handleClear}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 12,
                  marginLeft: -8,
                  fontSize: 13.5,
                  color: 'var(--sp-ink-soft)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 8,
                  fontFamily: 'var(--sp-body)',
                }}
              >
                <ChevronLeft size={15} />
                Choose a different book
              </button>
            </div>
          </div>

          {/* finished fields */}
          {mode === 'finished' && (
            <>
              <div>
                <label style={labelStyle}>How was it?</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <InteractiveLeafRating value={rating} onChange={setRating} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Date finished</label>
                <input type="date" value={finishedAt} max={today} onChange={e => setFinishedAt(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Your thoughts</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="What stayed with you?"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.5 }}
                />
              </div>
            </>
          )}

          {/* reading fields */}
          {mode === 'reading' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* percent + label */}
              {(() => {
                const pc = selected.pageCount ?? 0
                const pct = pc > 0 ? Math.round((readingPage / pc) * 100) : 0
                return (
                  <>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span style={{ fontFamily: 'var(--sp-disp)', fontSize: 48, lineHeight: 1, color: 'var(--sp-sage-deep)' }}>
                        {pct}<small style={{ fontSize: 22, color: 'var(--sp-sage)' }}>%</small>
                      </span>
                      <span style={{ fontSize: 15, color: 'var(--sp-muted)' }}>
                        {pc > 0 ? `page ${readingPage} of ${pc}` : 'in progress'}
                      </span>
                    </div>

                    {/* slider */}
                    <input
                      type="range"
                      className="sp-slider"
                      min={0}
                      max={100}
                      value={pct}
                      onChange={e => setReadingPage(pc > 0 ? Math.round(Number(e.target.value) / 100 * pc) : 0)}
                      style={{ '--sp-pct': `${pct}%` } as React.CSSProperties}
                    />

                    {/* current page input */}
                    <div>
                      <label style={labelStyle}>
                        Current page <span style={{ fontWeight: 400, color: 'var(--sp-faint)' }}>(optional)</span>
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
                        style={{ ...inputStyle, width: 120 }}
                      />
                    </div>
                  </>
                )
              })()}

              <div>
                <label style={labelStyle}>
                  A note <span style={{ fontWeight: 400, color: 'var(--sp-faint)' }}>(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="How's it going so far?"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.5 }}
                />
              </div>
            </div>
          )}

          {/* tbr fields */}
          {mode === 'tbr' && (
            <div>
              <label style={labelStyle}>
                Why this one? <span style={{ fontWeight: 400, color: 'var(--sp-faint)' }}>(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="A note to future you…"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.5 }}
              />
            </div>
          )}

          {error && (
            <p role="alert" style={{ color: '#9a3d28', fontSize: 13, fontWeight: 600, margin: 0 }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={onSuccess}
              style={{
                padding: '12px 20px',
                borderRadius: 999,
                background: 'var(--sp-paper)',
                border: '1px solid var(--sp-line-2)',
                color: 'var(--sp-ink)',
                fontFamily: 'var(--sp-body)',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selected || isPending}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 22px',
                borderRadius: 999,
                background: 'var(--sp-clay)',
                color: '#fff',
                fontFamily: 'var(--sp-body)',
                fontWeight: 600,
                fontSize: 15,
                cursor: isPending ? 'default' : 'pointer',
                border: 'none',
                boxShadow: '0 8px 18px -8px var(--sp-clay)',
                opacity: isPending ? 0.7 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              <Check size={16} />
              {isPending ? 'Adding…' : submitLabel}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes sp-spin { to { transform: rotate(360deg); } }
        .sp-slider {
          -webkit-appearance: none; appearance: none;
          width: 100%; height: 8px; border-radius: 99px; outline: none; cursor: pointer;
          background: linear-gradient(to right, var(--sp-sage) 0%, var(--sp-sage) var(--sp-pct), var(--sp-bg-2) var(--sp-pct), var(--sp-bg-2) 100%);
        }
        .sp-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 22px; height: 22px; border-radius: 50%;
          background: var(--sp-sage-deep); border: 3px solid #fff;
          box-shadow: 0 2px 8px -2px rgba(45,42,32,0.35); cursor: pointer;
        }
        .sp-slider::-moz-range-thumb {
          width: 22px; height: 22px; border-radius: 50%;
          background: var(--sp-sage-deep); border: 3px solid #fff;
          box-shadow: 0 2px 8px -2px rgba(45,42,32,0.35); cursor: pointer;
        }
      `}</style>
    </form>
  )
}
