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
    const user = await verifyAuthToken(request)
    if (!user) {
      return createErrorResponse('未經授權', 401)
    }

    // 取得所有收藏項目
    const collectionsSnapshot = await adminDb
      .collection(`collections/${user.uid}/games`)
      .get()

    // 取得自定義遊戲數量
    const customGamesSnapshot = await adminDb
      .collection(`customGames/${user.uid}/games`)
      .get()

    // 初始化統計
    const stats: CollectionStats = {
      total: 0,
      owned: 0,
      wanted: 0,
      completed: 0,
      trading: 0,
      customGames: customGamesSnapshot.size,
    }

    // 計算各狀態數量
    collectionsSnapshot.forEach((doc) => {
      const data = doc.data()
      stats.total++
      
      switch (data.status) {
        case 'owned':
          stats.owned++
          break
        case 'wanted':
          stats.wanted++
          break
        case 'completed':
          stats.completed++
          break
        case 'trading':
          stats.trading++
          break
      }
    })

    return createSuccessResponse(stats)

  } catch (error) {
    console.error('Error fetching collection stats:', error)
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