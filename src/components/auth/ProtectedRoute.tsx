'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (!loading && user && !user.emailVerified) {
      // 用戶已登入但未驗證電子郵件，跳轉到驗證頁面
      router.push('/verify-email')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user || !user.emailVerified) {
    return null
  }

  return <>{children}</>
}