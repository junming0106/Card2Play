import { NextRequest } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import {
  verifyAuthToken,
  createSuccessResponse,
  createErrorResponse,
  getSearchParams,
} from '@/lib/utils/api'
import { 
  CollectionItemExtended, 
  AddToCollectionRequest, 
  UpdateCollectionRequest,
  CollectionStats,
  CollectionStatus,
  UserCustomGame
} from '@/types/collection'

// GET /api/collections - 取得用戶收藏
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request)
    if (!user) {
      return createErrorResponse('未經授權', 401)
    }

    const { search, sortBy = 'addedAt', sortOrder = 'desc' } = getSearchParams(request)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as CollectionStatus | null
    const rating = searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : null
    const isCustomGame = searchParams.get('isCustomGame') === 'true'

    // 建立查詢
    let collectionRef = adminDb.collection(`collections/${user.uid}/games`)
    
    // 建立查詢條件陣列
    const queryFilters = []
    
    // 狀態過濾
    if (status) {
      queryFilters.push(['status', '==', status])
    }

    // 評分過濾
    if (rating) {
      queryFilters.push(['rating', '==', rating])
    }

    // 自定義遊戲過濾
    if (isCustomGame !== null) {
      queryFilters.push(['isCustomGame', '==', isCustomGame])
    }

    // 搜尋過濾 (搜尋遊戲標題)
    if (search) {
      queryFilters.push(['gameTitle', '>=', search])
      queryFilters.push(['gameTitle', '<=', search + '\uf8ff'])
    }
    
    // 套用所有過濾條件
    let query = collectionRef as any
    for (const [field, operator, value] of queryFilters) {
      query = query.where(field, operator, value)
    }
    
    // 排序
    const collectionQuery = query.orderBy(sortBy, sortOrder)

    const snapshot = await collectionQuery.get()
    const collections: CollectionItemExtended[] = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      addedAt: doc.data().addedAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as CollectionItemExtended[]

    return createSuccessResponse(collections)

  } catch (error) {
    console.error('Error fetching collections:', error)
    return createErrorResponse('無法取得收藏列表', 500)
  }
}

// POST /api/collections - 新增到收藏
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request)
    if (!user) {
      return createErrorResponse('未經授權', 401)
    }

    const body: AddToCollectionRequest = await request.json()

    // 驗證必要欄位
    if (!body.gameId || !body.gameTitle || !body.status) {
      return createErrorResponse('缺少必要欄位')
    }

    if (!['owned', 'wanted', 'completed', 'trading'].includes(body.status)) {
      return createErrorResponse('無效的收藏狀態')
    }

    // 檢查收藏數量限制（最多5個）
    const existingCollectionSnapshot = await adminDb
      .collection(`collections/${user.uid}/games`)
      .get()

    if (existingCollectionSnapshot.size >= 5) {
      return createErrorResponse('每位用戶最多只能收藏 5 個遊戲', 400)
    }

    // 驗證評分範圍
    if (body.rating !== undefined && (body.rating < 1 || body.rating > 5)) {
      return createErrorResponse('評分必須在 1-5 之間')
    }

    const collectionData: CollectionItemExtended = {
      id: body.gameId,
      gameId: body.gameId,
      gameTitle: body.gameTitle,
      status: body.status,
      rating: body.rating,
      notes: body.notes,
      isCustomGame: body.isCustomGame || false,
      customGameData: body.customGameData as UserCustomGame | undefined,
      addedAt: new Date(),
      updatedAt: new Date(),
    }

    // 使用 gameId 作為文檔 ID 來避免重複收藏
    await adminDb
      .collection(`collections/${user.uid}/games`)
      .doc(body.gameId)
      .set(collectionData, { merge: true })

    return createSuccessResponse(collectionData, '已新增至收藏')

  } catch (error) {
    console.error('Error adding to collection:', error)
    return createErrorResponse('無法新增至收藏', 500)
  }
}

// DELETE /api/collections - 從收藏中移除
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request)
    if (!user) {
      return createErrorResponse('未經授權', 401)
    }

    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')

    if (!gameId) {
      return createErrorResponse('缺少遊戲 ID')
    }

    // 從收藏中移除
    await adminDb
      .collection(`collections/${user.uid}/games`)
      .doc(gameId)
      .delete()

    return createSuccessResponse(null, '已從收藏中移除')

  } catch (error) {
    console.error('Error removing from collection:', error)
    return createErrorResponse('無法從收藏中移除', 500)
  }
}

// PUT /api/collections - 更新收藏項目
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request)
    if (!user) {
      return createErrorResponse('未經授權', 401)
    }

    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')

    if (!gameId) {
      return createErrorResponse('缺少遊戲 ID')
    }

    const body: UpdateCollectionRequest = await request.json()

    // 驗證狀態值
    if (body.status && !['owned', 'wanted', 'completed', 'trading'].includes(body.status)) {
      return createErrorResponse('無效的收藏狀態')
    }

    // 驗證評分範圍
    if (body.rating !== undefined && (body.rating < 1 || body.rating > 5)) {
      return createErrorResponse('評分必須在 1-5 之間')
    }

    // 更新收藏項目
    const updateData = {
      ...body,
      updatedAt: new Date(),
    }

    await adminDb
      .collection(`collections/${user.uid}/games`)
      .doc(gameId)
      .update(updateData)

    return createSuccessResponse(updateData, '收藏已更新')

  } catch (error) {
    console.error('Error updating collection:', error)
    return createErrorResponse('無法更新收藏', 500)
  }
}

// OPTIONS - 處理 CORS 預檢請求
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}