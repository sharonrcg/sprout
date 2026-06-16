import { getBooks } from '@/app/actions'
import { BookList } from '@/app/Components/BookList'

export const ReadingShelf = async () => {
  const books = await getBooks('reading')
  return <BookList books={books} emptyMessage="Nothing in progress. Pick something up!" />
}
