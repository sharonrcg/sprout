import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const GET = async () => {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
