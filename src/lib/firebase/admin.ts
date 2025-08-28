// 構建時安全的 Firebase Admin 配置
// 只保留 Auth 功能，移除 Firestore
let adminAuthInstance: any = null

// 檢查是否在構建時
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV && !process.env.FIREBASE_ADMIN_PROJECT_ID

if (!isBuildTime && typeof window === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { initializeApp, getApps, cert } = require('firebase-admin/app')
    // 只需要 Auth 功能，移除 Firestore
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getAuth } = require('firebase-admin/auth')

    // 確保環境變數存在
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

    console.log('🔧 Firebase Admin 環境檢查:', {
      projectId: !!projectId,
      clientEmail: !!clientEmail,
      privateKey: !!(privateKey && privateKey.length > 100),
      appsLength: getApps().length
    })

    if (!projectId || !clientEmail || !privateKey) {
      console.warn('⚠️ Firebase Admin 環境變數不完整，跳過初始化')
    } else {
      // 檢查是否已經初始化過
      if (!getApps().length) {
        console.log('🚀 初始化 Firebase Admin...')
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        })

        adminAuthInstance = getAuth()
        console.log('✅ Firebase Admin 初始化成功')
      } else {
        console.log('♻️ 使用現有的 Firebase Admin 實例')
        adminAuthInstance = getAuth()
      }
    }
  } catch (error) {
    console.error('❌ Firebase Admin 初始化失敗:', error instanceof Error ? error.message : 'Unknown error')
    console.error('詳細錯誤:', error)
  }
} else {
  console.log('⏩ 跳過 Firebase Admin 初始化 (構建時或客戶端)')
}

// 導出實例或 null（構建時）
// 移除 Firestore，只保留 Auth
export const adminAuth = adminAuthInstance