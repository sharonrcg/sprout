import { getBooks } from '@/app/actions'
import { TbrShelfGrid } from './TbrShelfGrid'

export const TbrShelf = async () => {
  const books = await getBooks('tbr')
  return <TbrShelfGrid books={books} />
}
