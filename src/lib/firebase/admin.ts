// 構建時安全的 Firebase Admin 配置
let adminDbInstance: any = null
let adminAuthInstance: any = null

// 檢查是否在構建時（只有在沒有環境變數時才跳過初始化）
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV && !process.env.FIREBASE_ADMIN_PROJECT_ID

if (!isBuildTime && typeof window === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { initializeApp, getApps, cert } = require('firebase-admin/app')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getFirestore } = require('firebase-admin/firestore')  
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getAuth } = require('firebase-admin/auth')

    // 檢查是否已經初始化過
    if (!getApps().length) {
      const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
      
      if (process.env.FIREBASE_ADMIN_PROJECT_ID && 
          process.env.FIREBASE_ADMIN_CLIENT_EMAIL && 
          privateKey) {
        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: privateKey,
          }),
        })

        adminDbInstance = getFirestore()
        adminAuthInstance = getAuth()
      }
    } else {
      adminDbInstance = getFirestore()
      adminAuthInstance = getAuth()
    }
  } catch (error) {
    console.warn('Firebase Admin initialization skipped:', error instanceof Error ? error.message : 'Unknown error')
  }
}

// 導出實例或 null（構建時）
export const adminDb = adminDbInstance
export const adminAuth = adminAuthInstance