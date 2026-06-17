import type { BookSearchResult, OpenLibrarySearchResult } from './types'

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

export const searchBooks = async (query: string): Promise<BookSearchResult[]> =>{
  if (!query.trim()) return []

  const params = new URLSearchParams({
    q: query,
    fields: 'key,title,author_name,first_publish_year,isbn,cover_i,number_of_pages_median',
    limit: '10',
  })

  const res = await fetch(`${OPEN_LIBRARY_BASE}/search.json?${params}`, {
    next: { revalidate: 60 },
  })

  if (!res.ok) throw new Error(`Open Library search failed: ${res.status}`)

  const data = await res.json()
  const docs: OpenLibrarySearchResult[] = data.docs ?? []
  return docs.map(toSearchResult)
}
