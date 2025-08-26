import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from './config'

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
    const result = await signInWithEmailAndPassword(auth, email, password)
    return { user: result.user, error: null }
  } catch (error) {
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
    const result = await createUserWithEmailAndPassword(auth, email, password)
    
    // 更新用戶個人資料
    await updateProfile(result.user, {
      displayName,
    })

    // 在 Firestore 中創建用戶資料
    const userProfile: UserProfile = {
      uid: result.user.uid,
      email: result.user.email || '',
      displayName: displayName,
      photoURL: result.user.photoURL,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await setDoc(doc(db, 'users', result.user.uid), userProfile)

    return { user: result.user, error: null }
  } catch (error) {
    return { user: null, error: error as Error }
  }
}

// Google 登入
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    
    // 檢查是否是新用戶
    const userDoc = await getDoc(doc(db, 'users', result.user.uid))
    
    if (!userDoc.exists()) {
      // 新用戶，創建資料
      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || '',
        photoURL: result.user.photoURL,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await setDoc(doc(db, 'users', result.user.uid), userProfile)
    }

    return { user: result.user, error: null }
  } catch (error) {
    return { user: null, error: error as Error }
  }
}

// 登出
export const signOutUser = async () => {
  try {
    await signOut(auth)
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

// 取得用戶資料
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (userDoc.exists()) {
      const data = userDoc.data()
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as UserProfile
    }
    return null
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

// 更新用戶資料
export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  try {
    const updatedData = {
      ...updates,
      updatedAt: new Date(),
    }
    await setDoc(doc(db, 'users', uid), updatedData, { merge: true })
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}