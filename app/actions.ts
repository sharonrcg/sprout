'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/getUser'
import type { AddBookInput, Book, BookStatus } from '@/lib/types'

export const getBooks = async (status?: BookStatus): Promise<Book[]> => {
  const [supabase, user] = await Promise.all([createClient(), getUser()])
  if (!user) return []

  const base = supabase
    .from('books')
    .select('*')
    .eq('user_id', user.id)

  const { data, error } = await (status ? base.eq('status', status) : base)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Book[]
}

export const addBook = async (input: AddBookInput): Promise<Book> => {
  const [supabase, user] = await Promise.all([createClient(), getUser()])
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
