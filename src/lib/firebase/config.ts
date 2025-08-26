import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
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
  throw new Error('Firebase configuration is missing. Please check your environment variables.')
}

// 初始化 Firebase
const app = initializeApp(firebaseConfig)

// 初始化 Firebase 服務
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app