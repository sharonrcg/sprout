'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp } from '@/app/actions/auth'

const SignUp = () => {
  const [error, action, pending] = useActionState(signUp, null)

  return (
    <form action={action}>
      <h1>Create account</h1>

      {error && <p role="alert">{error}</p>}

      <label>
        Email
        <input type="email" name="email" required autoComplete="email" />
      </label>

      <label>
        Password
        <input type="password" name="password" required autoComplete="new-password" minLength={6} />
      </label>

      <button type="submit" disabled={pending}>
        {pending ? 'Creating account…' : 'Create account'}
      </button>

      <p>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </form>
  )
}

export default SignUp
