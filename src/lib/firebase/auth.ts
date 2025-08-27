import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  sendEmailVerification,
  reload,
  User,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from './config'
import { setAuthToken, setUserInfo, clearAuthCookies } from '@/lib/utils/cookies'

// Google 登入提供者
const googleProvider = new GoogleAuthProvider()

// 用戶資料介面
export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
  createdAt: Date
  updatedAt: Date
}

// Email 登入
export const signInWithEmail = async (email: string, password: string) => {
  try {
    console.log('嘗試 Email 登入:', email)
    const result = await signInWithEmailAndPassword(auth, email, password)
    console.log('Email 登入成功:', result.user.email)
    
    // 取得並儲存 token 到 cookie
    const token = await result.user.getIdToken()
    setAuthToken(token)
    
    // 儲存用戶資訊到 cookie
    setUserInfo({
      uid: result.user.uid,
      email: result.user.email || '',
      displayName: result.user.displayName || '',
      emailVerified: result.user.emailVerified
    })
    
    console.log('用戶認證資訊已儲存到 cookie (有效期 2 天)')
    
    return { user: result.user, error: null }
  } catch (error) {
    console.error('Email 登入失敗:', error)
    return { user: null, error: error as Error }
  }
}

// Email 註冊
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
) => {
  try {
    console.log('嘗試 Email 註冊:', email, '密碼長度:', password.length)
    const result = await createUserWithEmailAndPassword(auth, email, password)
    console.log('Firebase Auth 註冊成功')
    
    // 更新用戶個人資料
    await updateProfile(result.user, {
      displayName,
    })
    console.log('用戶資料更新成功')

    // 發送驗證郵件
    await sendEmailVerification(result.user)
    console.log('驗證郵件已發送到:', result.user.email)

    // 暫時停用 Firestore 操作直到權限問題解決
    console.log('Email 註冊完成，用戶:', result.user.email)

    return { user: result.user, error: null }
  } catch (error) {
    console.error('Email 註冊失敗:', error)
    return { user: null, error: error as Error }
  }
}

// Google 登入
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    
    // 取得並儲存 token 到 cookie
    const token = await result.user.getIdToken()
    setAuthToken(token)
    
    // 儲存用戶資訊到 cookie
    setUserInfo({
      uid: result.user.uid,
      email: result.user.email || '',
      displayName: result.user.displayName || '',
      emailVerified: result.user.emailVerified
    })
    
    console.log('Google 登入成功，用戶:', result.user.email)
    console.log('用戶認證資訊已儲存到 cookie (有效期 2 天)')

    return { user: result.user, error: null }
  } catch (error) {
    console.error('Google 登入失敗:', error)
    return { user: null, error: error as Error }
  }
}

// 非同步創建用戶資料，不阻塞登入流程
const createUserProfileAsync = async (user: User) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    
    if (!userDoc.exists()) {
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await setDoc(doc(db, 'users', user.uid), userProfile)
    }
  } catch (error) {
    console.warn('創建用戶資料失敗，但不影響登入:', error)
  }
}

// 登出
export const signOutUser = async () => {
  try {
    await signOut(auth)
    // 清除所有認證相關的 cookies
    clearAuthCookies()
    console.log('已登出並清除認證 cookies')
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

// 重置密碼
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email)
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

// 監聽認證狀態變化
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback)
}

// 取得目前用戶
export const getCurrentUser = (): User | null => {
  return auth.currentUser
}

// 取得用戶資料（暫時停用）
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  console.warn('Firestore 功能暫時停用')
  return null
}

// 更新用戶資料（暫時停用）
export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  console.warn('Firestore 功能暫時停用')
  return { error: null }
}

// 發送驗證郵件
export const sendVerificationEmail = async (): Promise<{ error: Error | null }> => {
  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error('沒有登入用戶')
    }

    await sendEmailVerification(user)
    console.log('驗證郵件已重新發送到:', user.email)
    return { error: null }
  } catch (error) {
    console.error('發送驗證郵件失敗:', error)
    return { error: error as Error }
  }
}

// 重新載入用戶資料
export const reloadUser = async (): Promise<{ error: Error | null }> => {
  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error('沒有登入用戶')
    }

    await reload(user)
    console.log('用戶資料已重新載入，驗證狀態:', user.emailVerified)
    return { error: null }
  } catch (error) {
    console.error('重新載入用戶資料失敗:', error)
    return { error: error as Error }
  }
}