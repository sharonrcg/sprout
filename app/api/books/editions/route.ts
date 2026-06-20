import type { NextRequest } from 'next/server'
import { fetchWorkEditionCovers, findWorkKey } from '@/lib/open-library'

export const GET = async (request: NextRequest) => {
  const { searchParams } = request.nextUrl
  let key = searchParams.get('key')

  if (!key) {
    const isbn = searchParams.get('isbn')
    const title = searchParams.get('title') ?? ''
    key = await findWorkKey(isbn, title)
  }

  if (!key?.startsWith('/works/')) return Response.json([], { status: 400 })

  try {
    const covers = await fetchWorkEditionCovers(key)
    return Response.json(covers)
  } catch {
    return Response.json([], { status: 502 })
  }
}
