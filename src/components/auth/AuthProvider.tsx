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