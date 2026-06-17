import { getBooks } from '@/app/actions'
import { ReadingShelfGrid } from './ReadingShelfGrid'

export const ReadingShelf = async () => {
  const books = await getBooks('reading')
  return <ReadingShelfGrid books={books} />
}
