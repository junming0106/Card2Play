'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from 'firebase/auth'
import { onAuthStateChange } from '@/lib/firebase/auth'
import { setAuthToken, setUserInfo, clearAuthCookies } from '@/lib/utils/cookies'

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 監聽 Firebase 認證狀態變化
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        // 用戶已登入，同步更新 cookie 以備後用
        try {
          const token = await user.getIdToken()
          setAuthToken(token)
          setUserInfo({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            emailVerified: user.emailVerified
          })

          // 🔄 新增：自動同步用戶到 PostgreSQL
          console.log('🔄 開始同步用戶到 PostgreSQL...', user.uid)
          try {
            const syncResponse = await fetch('/api/users/sync', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            })
            
            if (syncResponse.ok) {
              const syncResult = await syncResponse.json()
              console.log('✅ 用戶同步成功:', syncResult)
            } else {
              const syncError = await syncResponse.json()
              console.log('⚠️ 用戶同步失敗:', syncError)
              // 同步失敗不應該影響登入流程，只記錄錯誤
            }
          } catch (syncError) {
            console.error('💥 用戶同步請求失敗:', syncError)
            // 同步失敗不應該影響登入流程
          }

        } catch (error) {
          console.error('更新認證 cookie 失敗:', error)
        }
        setUser(user)
      } else {
        // 用戶未登入，清除 cookies
        clearAuthCookies()
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const value = {
    user,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}