import { NextRequest } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T = unknown> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 驗證 Firebase ID Token
export async function verifyAuthToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    console.log('🔍 Authorization Header:', authHeader ? 'Present' : 'null')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ 無效的 Authorization Header 格式')
      return null
    }

    const idToken = authHeader.substring(7) // 移除 "Bearer " 前綴
    console.log('🎫 ID Token 長度:', idToken.length)
    
    console.log('🔐 開始驗證 ID Token...')
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    console.log('✅ Token 驗證成功，UID:', decodedToken.uid)
    
    return decodedToken
  } catch (error) {
    console.error('💥 Token 驗證錯誤:', error)
    console.error('💥 錯誤詳情:', error instanceof Error ? error.message : 'Unknown error')
    if (error instanceof Error && error.message) {
      console.error('💥 完整錯誤:', error.message)
    }
    return null
  }
}

// 統一身份驗證函數：驗證 JWT Token 並取得 PostgreSQL 用戶資料
export async function verifyAuthTokenAndGetUser(request: NextRequest) {
  try {
    // 第一步：驗證 Firebase JWT Token
    const decodedToken = await verifyAuthToken(request)
    if (!decodedToken) {
      return { user: null, error: 'JWT Token 驗證失敗' }
    }

    // 第二步：在 PostgreSQL 中查詢對應的用戶
    const { getUserByGoogleId } = await import('@/lib/database')
    const pgUser = await getUserByGoogleId(decodedToken.uid)
    
    if (!pgUser) {
      console.log('⚠️ PostgreSQL 中找不到用戶，UID:', decodedToken.uid)
      return { 
        user: null, 
        error: '用戶未同步到資料庫',
        firebaseUser: decodedToken 
      }
    }

    console.log('✅ 找到 PostgreSQL 用戶:', {
      id: pgUser.id,
      email: pgUser.email,
      name: pgUser.name
    })

    // 返回包含完整資訊的用戶物件
    return {
      user: {
        // PostgreSQL 用戶資料
        id: pgUser.id,
        googleId: pgUser.google_id,
        email: pgUser.email,
        name: pgUser.name,
        avatarUrl: pgUser.avatar_url,
        createdAt: pgUser.created_at,
        updatedAt: pgUser.updated_at,
        // Firebase 用戶資料
        firebaseUid: decodedToken.uid,
        firebaseToken: decodedToken
      },
      error: null
    }

  } catch (error) {
    console.error('💥 統一身份驗證錯誤:', error)
    return { user: null, error: '身份驗證過程發生錯誤' }
  }
}

// 創建成功回應
export function createSuccessResponse<T>(data: T, message?: string): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      message,
    } as ApiResponse<T>),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  )
}

// 創建錯誤回應
export function createErrorResponse(error: string, status: number = 400): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error,
    } as ApiResponse),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  )
}

// 創建分頁回應
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// 從 URL 獲取搜尋參數
export function getSearchParams(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // 最大 100
  const search = searchParams.get('search') || ''
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
  const offset = (page - 1) * limit

  return {
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    offset,
  }
}

// 輸入驗證輔助函數
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): boolean {
  return password.length >= 6
}

// 清理字串輸入
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>\"']/g, '')
}

// 檢查是否為管理員
export async function isAdmin(uid: string): Promise<boolean> {
  try {
    const userRecord = await adminAuth.getUser(uid)
    return userRecord.customClaims?.admin === true
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

// 設定自訂聲明
export async function setAdminClaim(uid: string, isAdmin: boolean) {
  try {
    await adminAuth.setCustomUserClaims(uid, { admin: isAdmin })
    return { error: null }
  } catch (error) {
    console.error('Error setting admin claim:', error)
    return { error: error as Error }
  }
}