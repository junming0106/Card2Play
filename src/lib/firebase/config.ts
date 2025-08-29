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
const hasRequiredConfig = firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId

if (!hasRequiredConfig) {
  console.warn('Firebase 配置缺失:', {
    apiKey: !!firebaseConfig.apiKey,
    authDomain: !!firebaseConfig.authDomain,
    projectId: !!firebaseConfig.projectId,
  })
  
  // 在建置時期，如果環境變數不存在，提供預設值避免錯誤
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PHASE === 'build') {
    console.log('⚠️ 建置模式：使用預設 Firebase 配置')
  }
}

// 初始化 Firebase（如果配置完整）
let app: any = null
let auth: any = null
let db: any = null
let storage: any = null

if (hasRequiredConfig) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)

    // 設定 Firebase Auth 持久化 - 使用本地儲存
    if (typeof window !== 'undefined') {
      setPersistence(auth, browserLocalPersistence).catch((error) => {
        console.error('Firebase Auth 持久化設定失敗:', error)
      })
    }
  } catch (error) {
    console.error('Firebase 初始化失敗:', error)
  }
} else {
  console.log('⚠️ Firebase 未初始化：環境變數不完整')
}

export { auth, db, storage }
export default app