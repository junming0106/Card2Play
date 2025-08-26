'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUpWithEmail, signInWithGoogle } from '@/lib/firebase/auth'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('密碼不一致')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('密碼長度至少需要 6 個字元')
      setLoading(false)
      return
    }

    const { user, error } = await signUpWithEmail(email, password, displayName)
    
    if (error) {
      setError(getErrorMessage((error as any)?.code || 'unknown'))
    } else if (user) {
      router.push('/dashboard')
    }
    
    setLoading(false)
  }

  const handleGoogleRegister = async () => {
    setLoading(true)
    setError('')

    const { user, error } = await signInWithGoogle()
    
    if (error) {
      setError(getErrorMessage((error as any)?.code || 'unknown'))
    } else if (user) {
      router.push('/dashboard')
    }
    
    setLoading(false)
  }

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return '此電子郵件已被使用'
      case 'auth/invalid-email':
        return '電子郵件格式不正確'
      case 'auth/weak-password':
        return '密碼太弱，請使用更強的密碼'
      default:
        return '註冊失敗，請稍後再試'
    }
  }

  return (
    <div className="min-h-screen bg-orange-300 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border-8 border-black p-6 shadow-[16px_16px_0px_#000000] transform rotate-1">
        <header className="text-center mb-4 bg-blue-500 border-4 border-black p-2 transform -rotate-2">
          <h2 className="text-2xl font-black text-white">註冊 CARD2PLAY</h2>
        </header>
        
        {error && (
          <div className="error-brutalist mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailRegister} className="space-y-6">
          <div>
            <label htmlFor="displayName" className="label-brutalist block mb-2">
              顯示名稱
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="input-brutalist w-full"
              placeholder="輸入你的顯示名稱"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="label-brutalist block mb-2">
              電子郵件
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-brutalist w-full"
              placeholder="輸入你的電子郵件"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="label-brutalist block mb-2">
              密碼
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="input-brutalist w-full"
              placeholder="輸入你的密碼"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="label-brutalist block mb-2">
              確認密碼
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="input-brutalist w-full"
              placeholder="再次輸入密碼"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-brutalist w-full text-xl py-4 disabled:opacity-50"
          >
            {loading ? '註冊中...' : '立即註冊'}
          </button>
        </form>

        <div className="mt-6">
          <button
            onClick={handleGoogleRegister}
            disabled={loading}
            className="w-full bg-green-400 text-black border-4 border-black font-bold text-lg py-3 hover:bg-purple-400 hover:text-white transform hover:scale-105 transition-all duration-100 disabled:opacity-50"
          >
            使用 GOOGLE 註冊
          </button>
        </div>

        <div className="mt-6 text-center bg-pink-400 border-4 border-black p-4">
          <span className="font-bold text-black">
            已有帳戶？{' '}
            <a href="/login" className="bg-yellow-300 text-black px-3 py-1 border-2 border-black hover:bg-cyan-400 transform hover:scale-105 transition-all duration-100 inline-block">
              立即登入
            </a>
          </span>
        </div>
      </div>
    </div>
  )
}