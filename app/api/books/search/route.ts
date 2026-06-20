import type { NextRequest } from 'next/server'
import { searchBooks } from '@/lib/open-library'

export const GET = async (request: NextRequest) => {
  const { searchParams } = request.nextUrl
  const query = searchParams.get('q') ?? ''
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)

  if (!query.trim()) return Response.json([])

  try {
    const results = await searchBooks(query, offset)
    return Response.json(results)
  } catch (err) {
    console.error('[books/search]', err)
    return Response.json({ error: 'Search failed' }, { status: 502 })
  }
}
