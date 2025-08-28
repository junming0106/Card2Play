import { NextRequest } from 'next/server'
import { createOrUpdateUser } from '@/lib/database'
import { verifyAuthToken, createSuccessResponse, createErrorResponse } from '@/lib/utils/api'

// POST /api/users/sync - 同步 Google 用戶到 PostgreSQL
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 開始用戶同步...')
    
    // 驗證 Firebase JWT Token - 使用備用機制
    const decodedToken = await verifyAuthToken(request)
    if (!decodedToken) {
      console.log('❌ Firebase Admin 身份驗證失敗')
      
      // 檢查基本的 Authorization header
      const authHeader = request.headers.get('Authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ 缺少有效的 Authorization header')
        return createErrorResponse('未經授權', 401)
      }
      
      console.log('⚠️ Firebase Admin 不可用，但 Authorization header 存在')
      // 在這種情況下，我們無法驗證 Token，但可以嘗試基本處理
      return createErrorResponse('Firebase 驗證服務不可用，請稍後再試', 503)
    }

    console.log('✅ JWT 驗證成功，UID:', decodedToken.uid)
    console.log('📧 用戶 Email:', decodedToken.email)
    console.log('👤 用戶名稱:', decodedToken.name)

    // 從 JWT Token 中取得用戶資訊
    const googleId = decodedToken.uid
    const email = decodedToken.email || ''
    const name = decodedToken.name || decodedToken.email?.split('@')[0] || '未知用戶'
    const avatarUrl = decodedToken.picture || null

    console.log('💾 開始同步到 PostgreSQL...')

    // 在 PostgreSQL 中建立或更新用戶
    const user = await createOrUpdateUser(googleId, email, name, avatarUrl || undefined)
    
    console.log('✅ 用戶同步成功:', {
      id: user.id,
      google_id: user.google_id,
      email: user.email,
      name: user.name
    })

    return createSuccessResponse({
      user: {
        id: user.id,
        googleId: user.google_id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    }, '用戶同步成功')

  } catch (error) {
    console.error('💥 用戶同步錯誤:', error)
    return createErrorResponse('用戶同步失敗', 500)
  }
}

// GET /api/users/sync - 檢查用戶同步狀態
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 檢查用戶同步狀態...')
    
    // 驗證 Firebase JWT Token - 使用備用機制
    const decodedToken = await verifyAuthToken(request)
    if (!decodedToken) {
      console.log('❌ Firebase Admin 身份驗證失敗')
      
      // 檢查基本的 Authorization header
      const authHeader = request.headers.get('Authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return createErrorResponse('未經授權', 401)
      }
      
      return createErrorResponse('Firebase 驗證服務不可用', 503)
    }

    const googleId = decodedToken.uid
    
    // 查詢 PostgreSQL 中的用戶記錄
    const { getUserByGoogleId } = await import('@/lib/database')
    const user = await getUserByGoogleId(googleId)
    
    if (user) {
      console.log('✅ 用戶已存在於 PostgreSQL')
      return createSuccessResponse({
        synced: true,
        user: {
          id: user.id,
          googleId: user.google_id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatar_url,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      }, '用戶已同步')
    } else {
      console.log('⚠️ 用戶尚未同步到 PostgreSQL')
      return createSuccessResponse({
        synced: false,
        googleId: googleId
      }, '用戶尚未同步')
    }

  } catch (error) {
    console.error('💥 檢查同步狀態錯誤:', error)
    return createErrorResponse('檢查同步狀態失敗', 500)
  }
}

// OPTIONS - 處理 CORS 預檢請求
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}