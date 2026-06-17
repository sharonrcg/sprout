export type BookStatus = 'tbr' | 'reading' | 'finished'

export interface Book {
  id: string
  user_id: string
  title: string
  author: string | null
  isbn: string | null
  cover_i: string | null
  status: BookStatus
  rating: number | null
  sort_order: number | null
  notes: string | null
  finished_at: string | null
  current_page: number | null
  page_count: number | null
  created_at: string
  updated_at: string
}

export interface AddBookInput {
  title: string
  author: string | null
  isbn: string | null
  cover_i: string | null
  status: BookStatus
  rating: number | null
  notes: string | null
  finished_at: string | null
  page_count: number | null
  current_page: number | null
}

export interface BookSearchResult {
  openLibraryKey: string
  title: string
  author: string
  cover_i: string | null
  isbn: string | null
  firstPublishedYear: number | null
  pageCount: number | null
}

export interface OpenLibrarySearchResult {
  key: string
  title: string
  author_name: string[] | undefined
  first_publish_year: number | undefined
  isbn: string[] | undefined
  cover_i: number | undefined
  number_of_pages_median: number | undefined
}
