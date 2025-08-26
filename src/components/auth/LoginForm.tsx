'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmail, signInWithGoogle, resetPassword } from '@/lib/firebase/auth'

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const router = useRouter()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { user, error } = await signInWithEmail(email, password)
    
    if (error) {
      setError(getErrorMessage((error as any)?.code || 'unknown'))
    } else if (user) {
      router.push('/dashboard')
    }
    
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
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

  const handlePasswordReset = async () => {
    if (!email) {
      setError('請輸入電子郵件地址')
      return
    }

    setLoading(true)
    const { error } = await resetPassword(email)
    
    if (error) {
      setError(getErrorMessage((error as any)?.code || 'unknown'))
    } else {
      setResetEmailSent(true)
    }
    
    setLoading(false)
  }

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return '找不到此電子郵件對應的用戶'
      case 'auth/wrong-password':
        return '密碼錯誤'
      case 'auth/invalid-email':
        return '電子郵件格式不正確'
      case 'auth/user-disabled':
        return '此帳戶已被停用'
      case 'auth/too-many-requests':
        return '登入嘗試次數過多，請稍後再試'
      default:
        return '登入失敗，請稍後再試'
    }
  }

  return (
    <div className="min-h-screen bg-cyan-300 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border-8 border-black p-8 shadow-[16px_16px_0px_#000000] transform -rotate-1">
        <header className="text-center mb-6 bg-red-500 border-4 border-black p-3 transform rotate-2">
          <h2 className="text-3xl font-black text-white">登入 CARD2PLAY</h2>
        </header>
        
        {error && (
          <div className="error-brutalist mb-6">
            {error}
          </div>
        )}
        
        {resetEmailSent && (
          <div className="success-brutalist mb-6">
            密碼重設郵件已發送，請檢查您的信箱
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-6">
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
              className="input-brutalist w-full"
              placeholder="輸入你的密碼"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-brutalist w-full text-xl py-4 disabled:opacity-50"
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </form>

        <div className="mt-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-yellow-400 text-black border-4 border-black font-bold text-lg py-3 hover:bg-purple-400 hover:text-white transform hover:scale-105 transition-all duration-100 disabled:opacity-50"
          >
            使用 GOOGLE 登入
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handlePasswordReset}
            disabled={loading}
            className="bg-black text-white border-4 border-red-500 px-6 py-2 font-bold hover:bg-red-500 hover:border-black transform hover:scale-105 transition-all duration-100"
          >
            忘記密碼？
          </button>
        </div>

        <div className="mt-6 text-center bg-purple-400 border-4 border-black p-4">
          <span className="font-bold text-black">
            還沒有帳戶？{' '}
            <a href="/register" className="bg-yellow-300 text-black px-3 py-1 border-2 border-black hover:bg-green-400 transform hover:scale-105 transition-all duration-100 inline-block">
              立即註冊
            </a>
          </span>
        </div>
      </div>
    </div>
  )
}