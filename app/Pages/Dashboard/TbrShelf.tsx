import { getBooks } from '@/app/actions'
import { BookList } from '@/app/Components/BookList'

export const TbrShelf = async () => {
  const books = await getBooks('tbr')
  return <BookList books={books} emptyMessage="Your reading list is empty. Add something!" />
}
