import { getBooks } from '@/app/actions'
import { BookList } from '@/app/Components/BookList'

export const FinishedShelf = async () => {
  const books = await getBooks('finished')
  return <BookList books={books} emptyMessage="No finished books yet. You'll get there!" />
}
