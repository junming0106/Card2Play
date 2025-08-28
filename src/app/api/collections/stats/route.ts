import { NextRequest } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import {
  verifyAuthToken,
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/utils/api'
import { CollectionStats } from '@/types/collection'

// GET /api/collections/stats - 取得用戶收藏統計
export async function GET(request: NextRequest) {
  try {
    console.log('📊 開始讀取收藏統計...')
    
    const user = await verifyAuthToken(request)
    if (!user) {
      console.log('❌ 統計讀取：身份驗證失敗')
      return createErrorResponse('未經授權', 401)
    }

    console.log('✅ 身份驗證成功，讀取統計:', user.uid)

    const collectionsSnapshot = await adminDb
      .collection(`collections/${user.uid}/games`)
      .get()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const collections = collectionsSnapshot.docs.map((doc: any) => doc.data())
    
    const stats: CollectionStats = {
      total: collections.length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      持有中: collections.filter((item: any) => item.status === '持有中').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      想要交換: collections.filter((item: any) => item.status === '想要交換').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      已借出: collections.filter((item: any) => item.status === '已借出').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customGames: collections.filter((item: any) => item.isCustomGame).length,
    }

    console.log('✅ 統計計算完成:', stats)
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