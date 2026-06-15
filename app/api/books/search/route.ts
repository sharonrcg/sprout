import type { NextRequest } from 'next/server'
import { searchBooks } from '@/lib/open-library'

export const GET = async (request: NextRequest) => {
  const query = request.nextUrl.searchParams.get('q') ?? ''

  if (!query.trim()) {
    return Response.json([])
  }

  try {
    const results = await searchBooks(query)
    return Response.json(results)
  } catch (err) {
    console.error('[books/search]', err)
    return Response.json({ error: 'Search failed' }, { status: 502 })
  }
}
