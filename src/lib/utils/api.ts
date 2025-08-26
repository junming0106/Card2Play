import { NextRequest } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T = any> {
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
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const idToken = authHeader.substring(7) // 移除 "Bearer " 前綴
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    
    return decodedToken
  } catch (error) {
    console.error('Token verification error:', error)
    return null
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