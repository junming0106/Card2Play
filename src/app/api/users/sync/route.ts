import { NextRequest } from 'next/server'
import { verifyAuthTokenAndGetUser, createSuccessResponse, createErrorResponse } from '@/lib/utils/api'

// POST /api/users/sync - 同步 Google 用戶到 PostgreSQL
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 開始用戶同步...')
    
    // 使用統一身份驗證（支援備用機制）
    const authResult = await verifyAuthTokenAndGetUser(request)
    if (!authResult.user) {
      console.log('❌ 身份驗證失敗:', authResult.error)
      return createErrorResponse(authResult.error || '未經授權', 401)
    }

    const user = authResult.user
    console.log('✅ 用戶同步成功:', {
      id: user.id,
      googleId: user.googleId,
      email: user.email,
      name: user.name
    })

    return createSuccessResponse({
      user: {
        id: user.id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
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
    
    // 使用統一身份驗證（支援備用機制）
    const authResult = await verifyAuthTokenAndGetUser(request)
    if (!authResult.user) {
      // 如果用戶不存在，可能是尚未同步，返回相應狀態
      if (authResult.error === '用戶未同步到資料庫') {
        return createSuccessResponse({
          synced: false,
          error: authResult.error
        }, '用戶尚未同步')
      }
      
      console.log('❌ 身份驗證失敗:', authResult.error)
      return createErrorResponse(authResult.error || '未經授權', 401)
    }

    const user = authResult.user
    console.log('✅ 用戶已同步')
    
    return createSuccessResponse({
      synced: true,
      user: {
        id: user.id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }, '用戶已同步')

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