'use client'

import { useState, useTransition } from 'react'
import { redirect, useRouter } from 'next/navigation'
import { Mail, Lock, Trash2, Check, Smile, Leaf } from 'lucide-react'
import { updateUserEmail, updateUserPassword, deleteUserAccount, updateUserName } from '@/app/actions'
import '@/app/css/YouPage.css'
import '@/app/globals.css'

interface Props {
  userName: string | null
  userEmail: string | null
  finishedCount: number
  readingCount: number
  tbrCount: number
}

function Row({ icon, title, sub, children }: {
  icon: React.ReactNode
  title: string
  sub: string
  children: React.ReactNode
}) {
  return (
    <div className="you-set-row">
      <div className="you-set-rowhead">
        <div className="you-set-ico">{icon}</div>
        <div>
          <b className="you-set-title">{title}</b>
          <span className="you-set-sub">{sub}</span>
        </div>
      </div>
      <div>{children}</div>
    </div>
  )
}

export const YouPage = ({ userName, userEmail, finishedCount, readingCount, tbrCount }: Props) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [emailDraft, setEmailDraft] = useState(userEmail ?? '')
  const [emailSaved, setEmailSaved] = useState(false)

  const [nameDraft, setNameDraft] = useState(userName ?? '')
  const [nameSaved, setNameSaved] = useState(false)

  const [pw, setPw] = useState({ cur: '', next: '', conf: '' })
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  const [delOpen, setDelOpen] = useState(false)

  const initial = (userName || userEmail || '?')[0].toUpperCase()

  const handleUpdateName = () => {
    startTransition(async () => {
      try {
        await updateUserName(nameDraft)
        setNameSaved(true)
        setTimeout(() => setNameSaved(false), 2500)
        router.refresh()
      } catch {}
    })
  }

  const handleUpdateEmail = () => {
    startTransition(async () => {
      try {
        await updateUserEmail(emailDraft)
        setEmailSaved(true)
        setTimeout(() => setEmailSaved(false), 2500)
        router.refresh()
      } catch {}
    })
  }

  const handleUpdatePassword = () => {
    startTransition(async () => {
      try {
        await updateUserPassword(pw.next)
        setPw({ cur: '', next: '', conf: '' })
        setPwSaved(true)
        setTimeout(() => setPwSaved(false), 2500)
      } catch (e) {
        setPwError(e instanceof Error ? e.message : 'Something went wrong')
      }
    })
  }

  const handleDeleteAccount = () => {
    startTransition(async () => {
      try {
        await deleteUserAccount()
        router.push('/login')
      } catch {}
    })
  }

  return (
    <div className="you-page">
      <div className="header-logo">
        <div className="sp-mobile-top">
          <span className="sb-logo-icon">
            <Leaf size={40} />
          </span>
        </div>

        <div className="you-header">
          <p className="you-eyebrow">Account</p>
          <h1 className="you-heading">You</h1>
        </div>
      </div>
      <div className="you-profile">
        <div className="you-avatar">{initial}</div>
        <div className="you-pid">
          <h2>{userName ?? 'Reader'}</h2>
          <p className="you-pid-email">{userEmail}</p>
          <div className="you-mini">
            <span><b>{finishedCount}</b> finished</span>
            <span><b>{readingCount}</b> reading</span>
            <span><b>{tbrCount}</b> in the pile</span>
          </div>
        </div>
      </div>

      <div className="you-section">
        <p className="you-section-label">Profile</p>
        <Row icon={<Smile size={18} />} title="Name" sub="Your display name.">
          <div className="you-inline">
            <input
              className="you-input"
              type="text"
              value={nameDraft}
              onChange={e => setNameDraft(e.target.value)}
            />
            <button
              className="you-btn-sage"
              disabled={nameDraft === userName || isPending}
              onClick={handleUpdateName}
            >
              Update
            </button>
          </div>
          {nameSaved && <span className="you-ok"><Check size={14} /> Name updated</span>}
        </Row>
        
        <Row icon={<Mail size={18} />} title="Email address" sub="Used to sign in.">
          <div className="you-inline">
            <input
              className="you-input"
              type="email"
              value={emailDraft}
              onChange={e => setEmailDraft(e.target.value)}
            />
            <button
              className="you-btn-sage"
              disabled={emailDraft === userEmail || !emailDraft.includes('@') || isPending}
              onClick={handleUpdateEmail}
            >
              Update
            </button>
          </div>
          {emailSaved && <span className="you-ok"><Check size={14} /> Email updated</span>}
        </Row>
      </div>

      <div className="you-section">
        <p className="you-section-label">Security</p>
        <Row icon={<Lock size={18} />} title="Change password" sub="At least 8 characters.">
          <div className="you-pw-grid">
            <input
              className="you-input"
              type="password"
              placeholder="Current password"
              value={pw.cur}
              onChange={e => setPw(s => ({ ...s, cur: e.target.value }))}
            />
            <input
              className="you-input"
              type="password"
              placeholder="New password"
              value={pw.next}
              onChange={e => { setPwError(null); setPw(s => ({ ...s, next: e.target.value })) }}
            />
            <input
              className="you-input"
              type="password"
              placeholder="Confirm new password"
              value={pw.conf}
              onChange={e => { setPwError(null); setPw(s => ({ ...s, conf: e.target.value })) }}
            />
          </div>
          {pw.next && pw.conf && pw.next !== pw.conf && (
            <span className="you-err">Passwords don&apos;t match.</span>
          )}
          {pw.next.length > 0 && pw.next.length < 8 && (
            <span className="you-err">At least 8 characters.</span>
          )}
          {pwError && <span className="you-err">{pwError}</span>}
          <div className="you-actionrow">
            <button
              className="you-btn-sage"
              disabled={!pw.cur || pw.next.length < 8 || pw.next !== pw.conf || isPending}
              onClick={handleUpdatePassword}
            >
              Update password
            </button>
            {pwSaved && <span className="you-ok"><Check size={14} /> Password changed</span>}
          </div>
        </Row>
      </div>

      <div className="you-section you-danger">
        <p className="you-section-label">Danger zone</p>
        <Row icon={<Trash2 size={18} />} title="Delete account" sub="Permanently erase your account and every book on your shelf.">
          <button className="you-btn-danger" onClick={() => { setDelOpen(true) }}>
            Delete my account
          </button>
        </Row>
      </div>

      {delOpen && (
        <div
          className="you-del-overlay"
          onClick={e => { if (e.target === e.currentTarget) setDelOpen(false) }}
        >
          <div className="you-del-inner">
            <h3 className="you-del-title">Delete your account?</h3>
            <p className="you-del-text">
              This erases all books across all of your shelves, along with ratings and notes. This cannot be undone.
            </p>
            <div className="you-del-actions">
              <button className="you-btn-ghost" onClick={() => setDelOpen(false)}>
                Keep my account
              </button>
              <button
                className="you-btn-danger-filled"
                disabled={isPending}
                onClick={handleDeleteAccount}
              >
                <Trash2 size={15} /> Delete account
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        className="you-btn-signout"
        onClick={() => redirect('/logout')}
      >
        Sign out
      </button>
    </div>
  )
}
