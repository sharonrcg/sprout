'use server'

import { createClient } from '@/lib/supabase/server'
import type { AddBookInput, Book } from '@/lib/types'

export const addBook = async (input: AddBookInput): Promise<Book> => {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('books')
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      author: input.author?.trim() ?? null,
      isbn: input.isbn,
      cover_i: input.cover_i,
      status: input.status,
      rating: input.status === 'finished' ? input.rating : null,
      notes: input.notes?.trim() ?? null,
      finished_at: input.status === 'finished' ? input.finished_at : null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Book
}
