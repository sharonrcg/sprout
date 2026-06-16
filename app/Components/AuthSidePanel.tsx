'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Leaf } from 'lucide-react'

const ROW1_COVERS = [
  { isbn: '0062060627', title: 'The Song of Achilles' },
  { isbn: '9788416884117', title: 'The Hobbit' },
  { isbn: '0593500148', title: "Emily Wilde's Encyclopaedia of Faeries" },
  { isbn: '9781529111798', title: 'I Who Have Never Known Men' },
  { isbn: '1537611453', title: 'Little Women' },
  { isbn: '0525559474', title: 'The Midnight Library' },
  { isbn: '0385472579', title: "The Handmaid's Tale" },
  { isbn: '9780451524935', title: '1984' },
  { isbn: '0743273567', title: 'The Great Gatsby' },
  { isbn: '9780747532699', title: "Harry Potter and the Philosopher's Stone" },
]

const ROW2_COVERS = [
  { isbn: '0316769177', title: 'The Catcher in the Rye' },
  { isbn: '9780062315007', title: 'The Alchemist' },
  { isbn: '9780143105428', title: 'The Road' },
  { isbn: '0141439513', title: 'Pride and Prejudice' },
  { isbn: '9780525478812', title: 'The Fault in Our Stars' },
  { isbn: '9780385737951', title: 'The Maze Runner' },
  { isbn: '0375831002', title: 'Life of Pi' },
  { isbn: '1594480001', title: 'The Kite Runner' },
  { isbn: '9780385333481', title: 'The Shining' },
  { isbn: '9780307277671', title: 'No Country for Old Men' },
]

interface Props {
  heading: string
  subheading: string
}

export const AuthSidePanel = ({ heading, subheading }: Props) => {
  const [failedCovers, setFailedCovers] = useState<Set<string>>(new Set())
  const row1 = ROW1_COVERS.filter(({ isbn }) => !failedCovers.has(isbn))
  const row2 = ROW2_COVERS.filter(({ isbn }) => !failedCovers.has(isbn))

  const markFailed = (isbn: string) =>
    setFailedCovers(prev => new Set([...prev, isbn]))

  const bookStyle = {
    width: 98,
    height: 148,
    marginRight: 12,
    flexShrink: 0,
    position: 'relative' as const,
    borderRadius: 7,
    overflow: 'hidden',
    boxShadow: '0 12px 24px -10px rgba(0,0,0,0.55)',
  }

  return (
    <aside
      className="hidden sm:flex flex-col flex-[1.02] relative overflow-hidden p-10 text-white"
      style={{ background: 'linear-gradient(158deg, #7B9564 0%, #5A6F47 52%, #445436 100%)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-50 mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />
      <span className="absolute -top-16 -right-16 opacity-10 pointer-events-none" style={{ fontSize: 300 }}>
        <Leaf strokeWidth={0.6} style={{ width: '1em', height: '1em' }} />
      </span>
      <span className="absolute -bottom-10 -left-12 opacity-[0.08] pointer-events-none rotate-[210deg]" style={{ fontSize: 200 }}>
        <Leaf strokeWidth={0.6} style={{ width: '1em', height: '1em' }} />
      </span>

      <div className="relative z-10 flex items-center gap-3">
        <span
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.16)' }}
        >
          <Leaf size={18} />
        </span>
        <span style={{ fontFamily: 'var(--sp-disp)', fontSize: 25, color: '#fff' }}>
          sprout
        </span>
      </div>

      <div className="mt-auto flex flex-col gap-10">
        <div
          className="relative z-10 flex flex-col gap-5 -mx-10"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          }}
        >
          <div className="relative overflow-hidden" style={{ height: 148 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, display: 'flex', animation: 'sp-marquee 40s linear infinite' }}>
              {[...row1, ...row1].map(({ isbn, title }, i) => (
                <div key={i < row1.length ? `${isbn}-a` : `${isbn}-b`} style={bookStyle}>
                  <Image
                    src={`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`}
                    alt={title} fill className="object-cover" sizes="98px"
                    onError={() => markFailed(isbn)}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden" style={{ height: 148 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, display: 'flex', animation: 'sp-marquee-reverse 50s linear infinite' }}>
              {[...row2, ...row2].map(({ isbn, title }, i) => (
                <div key={i < row2.length ? `${isbn}-a` : `${isbn}-b`} style={bookStyle}>
                  <Image
                    src={`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`}
                    alt={title} fill className="object-cover" sizes="98px"
                    onError={() => markFailed(isbn)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h2
            className="text-white leading-[1.08]"
            style={{ fontFamily: 'var(--sp-disp)', fontSize: 37, maxWidth: '11em' }}
          >
            {heading}
          </h2>
          <p className="mt-4 leading-relaxed" style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.82)', maxWidth: '34ch' }}>
            {subheading}
          </p>
        </div>
      </div>
    </aside>
  )
}
