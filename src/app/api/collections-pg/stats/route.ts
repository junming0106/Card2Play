import { NextRequest } from 'next/server'
import { 
  verifyAuthTokenAndGetUser, 
  createSuccessResponse, 
  createErrorResponse 
} from '@/lib/utils/api'
import { getUserGameStats } from '@/lib/database'

// GET /api/collections-pg/stats - 取得用戶收藏統計
export async function GET(request: NextRequest) {
  try {
    console.log('📊 開始讀取收藏統計 (PostgreSQL)...')
    
    // 驗證身份並取得用戶
    const authResult = await verifyAuthTokenAndGetUser(request)
    if (!authResult.user) {
      console.log('❌ 身份驗證失敗:', authResult.error)
      return createErrorResponse(authResult.error || '未經授權', 401)
    }

    const user = authResult.user
    console.log('✅ 身份驗證成功，用戶 ID:', user.id)

    // 取得統計資料
    const stats = await getUserGameStats(user.id)
    console.log('📊 統計結果:', stats)

    return createSuccessResponse(stats)

  } catch (error) {
    console.error('💥 統計讀取錯誤:', error)
    return createErrorResponse('無法取得收藏統計', 500)
  }
}

// OPTIONS - 處理 CORS 預檢請求
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}