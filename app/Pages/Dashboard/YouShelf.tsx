import { getBooks } from '@/app/actions'
import { getUser } from '@/lib/supabase/getUser'
import { YouPage } from './YouPage'

export const YouShelf = async () => {
  const [user, finished, reading, tbr] = await Promise.all([
    getUser(),
    getBooks('finished'),
    getBooks('reading'),
    getBooks('tbr'),
  ])

  const userName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null
  const userEmail = user?.email ?? null

  return (
    <YouPage
      userName={userName}
      userEmail={userEmail}
      finishedCount={finished.length}
      readingCount={reading.length}
      tbrCount={tbr.length}
    />
  )
}
