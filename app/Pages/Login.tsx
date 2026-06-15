'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn } from '@/app/actions/auth'

const Login = () => {
  const [error, action, pending] = useActionState(signIn, null)

  return (
    <form action={action}>
      <h1>Sign in</h1>

      <label>
        Email
        <input type="email" name="email" required autoComplete="email" />
      </label>

      <label>
        Password
        <input type="password" name="password" required autoComplete="current-password" />
      </label>

      <button type="submit" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>

      <p>
        Don't have an account? <Link href="/signup">Sign up</Link>
      </p>
    </form>
  )
}

export default Login
