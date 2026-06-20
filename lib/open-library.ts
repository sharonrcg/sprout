import type { BookSearchResult, EditionCover, OpenLibrarySearchResult } from './types'

const OPEN_LIBRARY_BASE = 'https://openlibrary.org'
const COVERS_BASE = 'https://covers.openlibrary.org'

export const coverUrl = (coverId: string | number | null | undefined): string | null => {
  if (!coverId) return null
  return `${COVERS_BASE}/b/id/${coverId}-L.jpg`
}

export const coverUrlByIsbn = (isbn: string): string => {
  return `${COVERS_BASE}/b/isbn/${isbn}-L.jpg`
}

const toSearchResult = (doc: OpenLibrarySearchResult): BookSearchResult => {
  return {
    openLibraryKey: doc.key,
    title: doc.title,
    author: doc.author_name?.[0] ?? 'Unknown author',
    cover_i: doc.cover_i != null ? String(doc.cover_i) : null,
    isbn: doc.isbn?.[0] ?? null,
    firstPublishedYear: doc.first_publish_year ?? null,
    pageCount: doc.number_of_pages_median ?? null,
  }
}

export const findWorkKey = async (isbn: string | null, title: string): Promise<string | null> => {
  const params = new URLSearchParams({
    q: isbn ? `isbn:${isbn}` : title,
    fields: 'key',
    limit: '1',
  })
  const res = await fetch(`${OPEN_LIBRARY_BASE}/search.json?${params}`, { next: { revalidate: 3600 } })
  if (!res.ok) return null
  const data = await res.json()
  return (data.docs?.[0]?.key as string) ?? null
}

export const fetchWorkEditionCovers = async (workKey: string): Promise<EditionCover[]> => {
  const res = await fetch(`${OPEN_LIBRARY_BASE}${workKey}/editions.json?limit=50`, {
    next: { revalidate: 3600 },
  })
  if (!res.ok) return []
  const data = await res.json()
  const entries: Array<{ covers?: number[]; isbn_13?: string[]; isbn_10?: string[]; number_of_pages?: number }> = data.entries ?? []
  const seen = new Set<string>()
  const result: EditionCover[] = []
  for (const entry of entries) {
    if (!entry.covers?.length) continue
    for (const coverId of entry.covers) {
      if (coverId < 0) continue
      const id = String(coverId)
      if (seen.has(id)) continue
      seen.add(id)
      result.push({ cover_i: id, isbn: entry.isbn_13?.[0] ?? entry.isbn_10?.[0] ?? null, pageCount: entry.number_of_pages ?? null })
    }
  }
  return result
}

export const searchBooks = async (query: string): Promise<BookSearchResult[]> =>{
  if (!query.trim()) return []

  const params = new URLSearchParams({
    q: query,
    fields: 'key,title,author_name,first_publish_year,isbn,cover_i,number_of_pages_median',
    limit: '30',
  })

  const res = await fetch(`${OPEN_LIBRARY_BASE}/search.json?${params}`, {
    next: { revalidate: 60 },
  })

  if (!res.ok) throw new Error(`Open Library search failed: ${res.status}`)

  const data = await res.json()
  const docs: OpenLibrarySearchResult[] = data.docs ?? []
  return docs.map(toSearchResult)
}
