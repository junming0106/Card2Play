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

// 同步用戶到資料庫的函數（支援重試機制）
async function syncUserToDatabase(user: User, token: string, maxRetries = 3, retryDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 同步用戶嘗試 ${attempt}/${maxRetries}`)
      
      const syncResponse = await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        // 增加逾時設定
        signal: AbortSignal.timeout(10000) // 10秒逾時
      })
      
      if (syncResponse.ok) {
        const syncResult = await syncResponse.json()
        console.log('✅ 用戶同步成功:', syncResult)
        return syncResult
      } else {
        const syncError = await syncResponse.json()
        console.log(`⚠️ 用戶同步失敗 (嘗試 ${attempt}):`, syncError)
        
        // 如果是最後一次嘗試，記錄最終失敗
        if (attempt === maxRetries) {
          console.error('💥 用戶同步最終失敗:', syncError)
          // 儲存同步失敗狀態到 localStorage
          localStorage.setItem('sync_failed', JSON.stringify({
            uid: user.uid,
            error: syncError,
            timestamp: Date.now()
          }))
        }
      }
    } catch (syncError) {
      console.error(`💥 用戶同步請求失敗 (嘗試 ${attempt}):`, syncError)
      
      // 如果是最後一次嘗試，記錄最終失敗
      if (attempt === maxRetries) {
        console.error('💥 用戶同步最終失敗')
        // 儲存同步失敗狀態到 localStorage
        localStorage.setItem('sync_failed', JSON.stringify({
          uid: user.uid,
          error: syncError instanceof Error ? syncError.message : 'Unknown error',
          timestamp: Date.now()
        }))
        return null
      }
    }

    // 如果不是最後一次嘗試，等待後重試
    if (attempt < maxRetries) {
      console.log(`⏳ ${retryDelay}ms 後重試...`)
      await new Promise(resolve => setTimeout(resolve, retryDelay))
      retryDelay *= 2 // 指數退避
    }
  }
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

          // 🔄 新增：自動同步用戶到 PostgreSQL（增強版）
          console.log('🔄 開始同步用戶到 PostgreSQL...', user.uid)
          
          // 先清除之前的同步失敗狀態
          localStorage.removeItem('sync_failed')
          
          const syncResult = await syncUserToDatabase(user, token)
          
          // 如果同步成功，儲存同步成功狀態
          if (syncResult) {
            localStorage.setItem('sync_success', JSON.stringify({
              uid: user.uid,
              timestamp: Date.now()
            }))
          }

        } catch (error) {
          console.error('更新認證 cookie 失敗:', error)
        }
        setUser(user)
      } else {
        // 用戶未登入，清除 cookies 和同步狀態
        clearAuthCookies()
        localStorage.removeItem('sync_success')
        localStorage.removeItem('sync_failed')
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