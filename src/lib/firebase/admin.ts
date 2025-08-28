import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

let adminDb: any = null
let adminAuth: any = null

// 只在運行時初始化，不在構建時
if (typeof window === 'undefined') {
  // 檢查是否已經初始化過
  if (!getApps().length) {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
    
    // 在構建時，如果環境變數缺失就跳過初始化
    if (process.env.FIREBASE_ADMIN_PROJECT_ID && 
        process.env.FIREBASE_ADMIN_CLIENT_EMAIL && 
        privateKey) {
      try {
        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: privateKey,
          }),
        })
        
        adminDb = getFirestore()
        adminAuth = getAuth()
      } catch (error) {
        console.warn('Firebase Admin initialization failed:', error)
      }
    } else if (process.env.NODE_ENV !== 'development') {
      console.warn('Firebase Admin configuration is missing in production')
    }
  } else {
    adminDb = getFirestore()
    adminAuth = getAuth()
  }
}

export { adminDb, adminAuth }