'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { coverUrl } from '@/lib/open-library'
import type { EditionCover } from '@/lib/types'
import '@/app/css/AddBookForm.css'

const PAGE_SIZE = 8

interface Props {
  title: string
  isbn?: string | null
  workKey?: string | null
  currentCoverId?: string | null
  onSelect: (cover: EditionCover) => void
  onClose: () => void
}

export const EditionPickerModal = ({ title, isbn, workKey, currentCoverId, onSelect, onClose }: Props) => {
  const [covers, setCovers] = useState<EditionCover[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  useEffect(() => {
    const params = new URLSearchParams()
    if (workKey) {
      params.set('key', workKey)
    } else {
      if (isbn) params.set('isbn', isbn)
      params.set('title', title)
    }
    fetch(`/api/books/editions?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(setCovers)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [workKey, isbn, title])

  const totalPages = Math.ceil(covers.length / PAGE_SIZE)
  const visible = covers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="abf-edition-overlay" onClick={onClose}>
      <div className="abf-edition-modal" onClick={e => e.stopPropagation()}>
        <div className="abf-edition-header">
          <div>
            <p className="abf-edition-label">Choose an edition</p>
            <p className="abf-edition-book">{title}</p>
          </div>
          <button type="button" className="abf-edition-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <p className="abf-edition-msg">Loading editions…</p>
        ) : covers.length === 0 ? (
          <p className="abf-edition-msg">No alternate covers found.</p>
        ) : (
          <>
            <div className="abf-edition-grid">
              {visible.map(cover => {
                const isActive = currentCoverId === cover.cover_i
                return (
                  <button
                    key={cover.cover_i}
                    type="button"
                    className={`abf-edition-cover-btn${isActive ? ' abf-edition-cover-active' : ''}`}
                    onClick={() => onSelect(cover)}
                  >
                    <Image src={coverUrl(cover.cover_i)!} alt="Edition cover" fill sizes="90px" style={{ objectFit: 'cover' }} />
                    {isActive && <div className="abf-edition-check"><Check size={13} /></div>}
                  </button>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="abf-edition-pagination">
                <button
                  type="button"
                  className="abf-edition-page-btn"
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 0}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="abf-edition-page-num">{page + 1} / {totalPages}</span>
                <button
                  type="button"
                  className="abf-edition-page-btn"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === totalPages - 1}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
