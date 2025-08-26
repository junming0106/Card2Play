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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center">註冊 Card2Play</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailRegister} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                顯示名稱
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                電子郵件
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密碼
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                確認密碼
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? '註冊中...' : '註冊'}
            </button>
          </form>

          <div className="mt-4">
            <button
              onClick={handleGoogleRegister}
              disabled={loading}
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              使用 Google 註冊
            </button>
          </div>

          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600">
              已有帳戶？{' '}
              <a href="/login" className="text-blue-600 hover:text-blue-500">
                立即登入
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}