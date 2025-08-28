import { NextRequest } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import {
  verifyAuthToken,
  createSuccessResponse,
  createErrorResponse,
  getSearchParams,
} from '@/lib/utils/api'
import { CreateCustomGameRequest, UserCustomGame } from '@/types/collection'

// GET /api/custom-games - 取得用戶的自定義遊戲列表
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request)
    if (!user) {
      return createErrorResponse('未經授權', 401)
    }

    const { search, sortBy = 'createdAt', sortOrder = 'desc' } = getSearchParams(request)

    // 建立查詢
    let customGamesRef = adminDb.collection(`customGames/${user.uid}/games`)
    let query = customGamesRef as any

    // 搜尋過濾
    if (search) {
      query = query
        .where('customTitle', '>=', search)
        .where('customTitle', '<=', search + '\uf8ff')
    }

    // 排序
    const customGamesQuery = query.orderBy(sortBy, sortOrder)

    const snapshot = await customGamesQuery.get()
    const customGames: UserCustomGame[] = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as UserCustomGame[]

    return createSuccessResponse(customGames)

  } catch (error) {
    console.error('Error fetching custom games:', error)
    return createErrorResponse('無法取得自定義遊戲列表', 500)
  }
}

// POST /api/custom-games - 創建新的自定義遊戲
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request)
    if (!user) {
      return createErrorResponse('未經授權', 401)
    }

    // 檢查用戶自定義遊戲數量限制（最多5個）
    const existingGamesSnapshot = await adminDb
      .collection(`customGames/${user.uid}/games`)
      .get()

    if (existingGamesSnapshot.size >= 5) {
      return createErrorResponse('每位用戶最多只能新增 5 個自定義遊戲', 400)
    }

    const body: CreateCustomGameRequest = await request.json()

    // 驗證必要欄位
    if (!body.customTitle) {
      return createErrorResponse('缺少必要欄位：遊戲名稱')
    }
    
    // 為 Nintendo Switch 設定預設值
    const platform = body.platform || "Nintendo Switch"
    const media = body.media || "實體卡帶"

    // 檢查遊戲名稱是否已存在（在用戶的自定義遊戲中）
    const existingTitleSnapshot = await adminDb
      .collection(`customGames/${user.uid}/games`)
      .where('customTitle', '==', body.customTitle)
      .get()
    
    if (!existingTitleSnapshot.empty) {
      return createErrorResponse('您已經新增過這個遊戲名稱')
    }

    // 生成唯一 ID
    const customGameId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 建立自定義遊戲資料
    const customGameData: UserCustomGame = {
      id: customGameId,
      title: body.customTitle,
      customTitle: body.customTitle,
      customPublisher: body.customPublisher || '未知',
      publisher: body.customPublisher || '未知',
      releaseDate: body.releaseDate || new Date().toISOString().split('T')[0],
      platform: platform,
      media: media,
      userId: user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      isCustom: true,
    }

    // 儲存到 Firestore
    await adminDb
      .collection(`customGames/${user.uid}/games`)
      .doc(customGameId)
      .set(customGameData)

    return createSuccessResponse(customGameData, '自定義遊戲新增成功')

  } catch (error) {
    console.error('Error creating custom game:', error)
    return createErrorResponse('無法新增自定義遊戲', 500)
  }
}

// DELETE /api/custom-games - 刪除自定義遊戲
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ 開始刪除自定義遊戲...')
    
    const user = await verifyAuthToken(request)
    if (!user) {
      console.log('❌ 身份驗證失敗')
      return createErrorResponse('未經授權', 401)
    }

    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')
    
    console.log('📋 要刪除的遊戲 ID:', gameId)
    console.log('👤 用戶 UID:', user.uid)

    if (!gameId) {
      console.log('❌ 缺少遊戲 ID 參數')
      return createErrorResponse('缺少遊戲 ID', 400)
    }

    if (!gameId.startsWith('custom_')) {
      console.log('❌ 無效的自定義遊戲 ID 格式')
      return createErrorResponse('無效的自定義遊戲 ID 格式', 400)
    }

    // 檢查遊戲是否屬於該用戶
    console.log('🔍 檢查自定義遊戲是否存在...')
    const customGameDoc = await adminDb
      .collection(`customGames/${user.uid}/games`)
      .doc(gameId)
      .get()

    if (!customGameDoc.exists) {
      console.log('❌ 找不到指定的自定義遊戲')
      return createErrorResponse('找不到指定的自定義遊戲', 404)
    }

    const customGameData = customGameDoc.data()
    console.log('✅ 找到自定義遊戲:', customGameData?.title || customGameData?.customTitle)

    // 同時從收藏中移除此遊戲
    console.log('🗑️ 從收藏中移除遊戲...')
    try {
      await adminDb
        .collection(`collections/${user.uid}/games`)
        .doc(gameId)
        .delete()
      console.log('✅ 已從收藏中移除')
    } catch (collectionError) {
      console.log('⚠️ 從收藏中移除失敗 (可能不存在):', collectionError)
      // 不影響主要刪除流程
    }

    // 刪除自定義遊戲
    console.log('🗑️ 刪除自定義遊戲記錄...')
    await adminDb
      .collection(`customGames/${user.uid}/games`)
      .doc(gameId)
      .delete()

    console.log('✅ 自定義遊戲刪除成功')
    return createSuccessResponse({ 
      gameId: gameId,
      title: customGameData?.title || customGameData?.customTitle 
    }, '自定義遊戲已刪除')

  } catch (error) {
    console.error('Error deleting custom game:', error)
    return createErrorResponse('無法刪除自定義遊戲', 500)
  }
}

// OPTIONS - 處理 CORS 預檢請求
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}