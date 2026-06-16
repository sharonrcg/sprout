'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Leaf } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { signIn } from '@/app/actions/auth'
import { AuthSidePanel } from '@/app/Components'

const Login = () => {
  const [error, action, pending] = useActionState(signIn, null)
  const [showPw, setShowPw] = useState(false)
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const urlError = searchParams.get('error')

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: 'var(--sp-body)', background: 'var(--sp-bg)' }}
    >
      <AuthSidePanel
        heading="Welcome back."
        subheading="Your reading garden missed you. Let's log your progress for today."
      />

      <main className="flex flex-1 items-center justify-center px-6 py-11">
        <div className="w-full max-w-[418px]">
          <div className="flex sm:hidden items-center gap-2.5 mb-7">
            <span
              className="flex items-center justify-center w-8 h-8 rounded-xl"
              style={{ background: 'var(--sp-sage)', color: '#fff' }}
            >
              <Leaf size={16} />
            </span>
            <span style={{ fontFamily: 'var(--sp-disp)', fontSize: 24, color: 'var(--sp-ink)' }}>
              sprout
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--sp-disp)', fontSize: 'clamp(34px,4.6vw,44px)', lineHeight: 1.02, color: 'var(--sp-ink)' }}>
            Sign in
          </h1>
          <p className="mt-2 mb-7" style={{ color: 'var(--sp-muted)', fontSize: 15.5 }}>
            Good to have you back.
          </p>

          {message && (
            <p
              className="mb-5 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: 'var(--sp-sage-soft)', color: 'var(--sp-sage-deep)' }}
            >
              {message}
            </p>
          )}
          {(error || urlError) && (
            <p
              role="alert"
              className="mb-5 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: 'var(--sp-clay-soft)', color: 'var(--sp-clay-deep)' }}
            >
              {error ?? urlError}
            </p>
          )}

          <form action={action} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="li-email" className="text-[13px] font-semibold" style={{ color: 'var(--sp-ink-soft)' }}>
                Email
              </label>
              <input
                id="li-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-[14px] text-[15px] outline-none transition-all"
                style={{ border: '1px solid var(--sp-line-2)', background: 'var(--sp-paper)', color: 'var(--sp-ink)', fontFamily: 'var(--sp-body)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--sp-sage)'; e.target.style.boxShadow = '0 0 0 3px var(--sp-sage-soft)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--sp-line-2)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="li-pw" className="text-[13px] font-semibold" style={{ color: 'var(--sp-ink-soft)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="li-pw"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Your password"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-[14px] text-[15px] outline-none transition-all"
                  style={{ border: '1px solid var(--sp-line-2)', background: 'var(--sp-paper)', color: 'var(--sp-ink)', fontFamily: 'var(--sp-body)' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--sp-sage)'; e.target.style.boxShadow = '0 0 0 3px var(--sp-sage-soft)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--sp-line-2)'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                  style={{ color: 'var(--sp-muted)' }}
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full mt-2 py-4 rounded-full font-semibold text-[16px] text-white transition-all active:scale-[0.99]"
              style={{ background: 'var(--sp-clay)', boxShadow: '0 8px 18px -8px var(--sp-clay)', opacity: pending ? 0.5 : 1, cursor: pending ? 'not-allowed' : 'pointer' }}
            >
              {pending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center mt-6 text-[14.5px]" style={{ color: 'var(--sp-muted)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold underline underline-offset-2" style={{ color: 'var(--sp-clay-deep)' }}>
              Create one
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default Login
