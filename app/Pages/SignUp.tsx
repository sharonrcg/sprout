'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Leaf } from 'lucide-react'
import { signUp } from '@/app/actions/auth'
import { AuthSidePanel } from '@/app/Components'

const strengthOf = (pw: string): number => {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) s++
  return Math.min(3, Math.max(pw.length >= 8 ? 1 : 0, s - 1))
}
const STRENGTH_LABEL = ['Too short', 'Getting there', 'Good', 'Strong']
const STRENGTH_BAR_COLOR = ['var(--sp-clay)', 'var(--sp-gold)', 'var(--sp-sage)', 'var(--sp-sage)']

const SignUp = () => {
  const [error, action, pending] = useActionState(signUp, null)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  const str = strengthOf(password)

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: 'var(--sp-body)', background: 'var(--sp-bg)' }}
    >
      <AuthSidePanel
        heading="Welcome to your reading greenhouse."
        subheading="A cozy, quiet space to tend to your books and nurture your daily reading goals."
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
            Begin your journey.
          </h1>
          <p className="mt-2 mb-7" style={{ color: 'var(--sp-muted)', fontSize: 15.5 }}>
            Track what you&apos;re reading, what&apos;s next, and everything in between.
          </p>

          {error && (
            <p
              role="alert"
              className="mb-5 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: 'var(--sp-clay-soft)', color: 'var(--sp-clay-deep)' }}
            >
              {error}
            </p>
          )}

          <form action={action} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="su-name" className="text-[13px] font-semibold" style={{ color: 'var(--sp-ink-soft)' }}>
                Your name
              </label>
              <input
                id="su-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                className="w-full px-4 py-3 rounded-[14px] text-[15px] outline-none transition-all"
                style={{ border: '1px solid var(--sp-line-2)', background: 'var(--sp-paper)', color: 'var(--sp-ink)', fontFamily: 'var(--sp-body)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--sp-sage)'; e.target.style.boxShadow = '0 0 0 3px var(--sp-sage-soft)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--sp-line-2)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="su-email" className="text-[13px] font-semibold" style={{ color: 'var(--sp-ink-soft)' }}>
                Email
              </label>
              <input
                id="su-email"
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
              <label htmlFor="su-pw" className="text-[13px] font-semibold" style={{ color: 'var(--sp-ink-soft)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="su-pw"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
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

              {password && (
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="flex-1 h-[5px] rounded-full transition-all duration-300"
                        style={{ background: i <= str - 1 ? STRENGTH_BAR_COLOR[str] : 'var(--sp-bg-2)' }}
                      />
                    ))}
                  </div>
                  <p className="text-[12.5px]" style={{ color: 'var(--sp-muted)' }}>
                    Strength: <b style={{ color: 'var(--sp-ink-soft)' }}>{STRENGTH_LABEL[str]}</b>
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full mt-2 py-4 rounded-full font-semibold text-[16px] text-white transition-all active:scale-[0.99]"
              style={{ background: 'var(--sp-clay)', boxShadow: '0 8px 18px -8px var(--sp-clay)', opacity: pending ? 0.5 : 1, cursor: pending ? 'not-allowed' : 'pointer' }}
            >
              {pending ? 'Creating your account' : 'Create account'}
            </button>
          </form>

          <p className="text-center mt-6 text-[14.5px]" style={{ color: 'var(--sp-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold underline underline-offset-2" style={{ color: 'var(--sp-clay-deep)' }}>
              Log in here
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default SignUp
