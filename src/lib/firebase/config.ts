import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  // messagingSenderId 和 appId 為可選，但建議設定以避免警告
  ...(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID && {
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  }),
  ...(process.env.NEXT_PUBLIC_FIREBASE_APP_ID && {
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }),
}

// 檢查環境變數是否存在
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('Firebase 配置缺失:', {
    apiKey: !!firebaseConfig.apiKey,
    authDomain: !!firebaseConfig.authDomain,
    projectId: !!firebaseConfig.projectId,
  })
  throw new Error('Firebase configuration is missing. Please check your environment variables.')
}

// Firebase 配置載入成功

// 初始化 Firebase
const app = initializeApp(firebaseConfig)

// 初始化 Firebase 服務
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// 設定 Firebase Auth 持久化 - 使用本地儲存
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('Firebase Auth 持久化設定失敗:', error)
  })
}

export default app