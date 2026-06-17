import { getBooks } from '@/app/actions'
import { FinishedShelfGrid } from './FinishedShelfGrid'

export const FinishedShelf = async () => {
  const books = await getBooks('finished')
  return <FinishedShelfGrid books={books} />
}
