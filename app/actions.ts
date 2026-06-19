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

export const updateBookStatus = async (id: string, status: BookStatus): Promise<void> => {
  const [supabase, user] = await Promise.all([createClient(), getUser()])
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('books')
    .update({
      status,
      finished_at: status === 'finished' ? new Date().toISOString().split('T')[0] : null,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
}

export const removeBook = async (id: string): Promise<void> => {
  const [supabase, user] = await Promise.all([createClient(), getUser()])
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
}

export const updateTbrOrder = async (orderedIds: string[]): Promise<void> => {
  const [supabase, user] = await Promise.all([createClient(), getUser()])
  if (!user) throw new Error('Not authenticated')

  await Promise.all(
    orderedIds.map((id, i) =>
      supabase.from('books').update({ sort_order: i }).eq('id', id).eq('user_id', user.id)
    )
  )
}

export const updateBook = async (
  id: string,
  updates: Partial<Pick<Book, 'rating' | 'notes' | 'finished_at'>>
): Promise<void> => {
  const [supabase, user] = await Promise.all([createClient(), getUser()])
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('books')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
}

export const updateReadingProgress = async (
  id: string,
  currentPage: number,
  pageCount?: number
): Promise<void> => {
  const [supabase, user] = await Promise.all([createClient(), getUser()])
  if (!user) throw new Error('Not authenticated')

  const updates: Record<string, number> = { current_page: currentPage }
  if (pageCount !== undefined && pageCount > 0) updates.page_count = pageCount

  const { error } = await supabase
    .from('books')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
}

export const finishBook = async (
  id: string,
  data: { rating: number | null; notes: string | null; finished_at: string | null }
): Promise<void> => {
  const [supabase, user] = await Promise.all([createClient(), getUser()])
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('books')
    .update({ status: 'finished', rating: data.rating, notes: data.notes, finished_at: data.finished_at })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
}

export const updateUserName = async (name: string): Promise<void> => {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ data: { full_name: name } })
  if (error) throw new Error(error.message)
}

export const updateUserEmail = async (email: string): Promise<void> => {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ email })
  if (error) throw new Error(error.message)
}

export const updateUserPassword = async (password: string): Promise<void> => {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw new Error(error.message)
}

export const deleteUserAccount = async (): Promise<void> => {
  const [supabase, user] = await Promise.all([createClient(), getUser()])
  if (!user) throw new Error('Not authenticated')
  await supabase.from('books').delete().eq('user_id', user.id)
  await supabase.auth.signOut()
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
      page_count: input.page_count ?? null,
      current_page: input.current_page ?? 0,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Book
}
