'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const signIn = async (_prevState: string | null, formData: FormData) => {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return error.message
  redirect('/')
}

export const signUp = async (_prevState: string | null, formData: FormData) => {
  const username = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { 
      emailRedirectTo: 'http://localhost:3000/auth/callback',  
      data: {
        full_name: username
      }, 
    },
  })
  if (error) return error.message
  if (data.session) redirect('/')
  redirect('/login?message=Check your email to confirm your account')
}

export const signOut = async () => {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
