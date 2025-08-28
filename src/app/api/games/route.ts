import { NextRequest } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import {
  verifyAuthToken,
  createSuccessResponse,
  createErrorResponse,
  getSearchParams,
  createPaginatedResponse,
} from '@/lib/utils/api'
import { Game, CreateGameRequest } from '@/types/game'

// GET /api/games - 取得遊戲列表
export async function GET(request: NextRequest) {
  try {
    const { search, sortBy = 'createdAt', sortOrder, limit, page } = getSearchParams(request)
    
    // 建立查詢
    const gamesRef = adminDb.collection('games')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = gamesRef as any

    // 搜尋過濾
    if (search) {
      query = query
        .where('title', '>=', search)
        .where('title', '<=', search + '\uf8ff')
    }

    // 排序和分頁
    const gameQuery = query.orderBy(sortBy, sortOrder).limit(limit)

    // 取得總數 (用於分頁) - 簡化版本
    const totalQuery = search 
      ? (adminDb.collection('games') as any)
          .where('title', '>=', search)
          .where('title', '<=', search + '\uf8ff')
      : adminDb.collection('games')
    
    const totalSnapshot = await totalQuery.count().get()
    const total = totalSnapshot.data().count

    // 取得資料
    const snapshot = await gameQuery.get()
    const games: Game[] = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as Game[]

    return new Response(
      JSON.stringify(createPaginatedResponse(games, total, page, limit)),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error fetching games:', error)
    return createErrorResponse('無法取得遊戲列表', 500)
  }
}

// POST /api/games - 新增遊戲 (需要管理員權限)
export async function POST(request: NextRequest) {
  try {
    // 驗證認證
    const user = await verifyAuthToken(request)
    if (!user) {
      return createErrorResponse('未經授權', 401)
    }

    // TODO: 檢查管理員權限
    // 這裡需要實作檢查用戶是否為管理員的邏輯

    const body: CreateGameRequest = await request.json()

    // 驗證必要欄位
    if (!body.title || !body.publisher || !body.platform) {
      return createErrorResponse('缺少必要欄位')
    }

    // 檢查遊戲是否已存在
    const existingGameSnapshot = await adminDb
      .collection('games')
      .where('title', '==', body.title)
      .where('platform', '==', body.platform)
      .get()
    
    if (!existingGameSnapshot.empty) {
      return createErrorResponse('遊戲已存在')
    }

    // 建立遊戲資料
    const gameData: Omit<Game, 'id'> = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // 新增到 Firestore
    const docRef = await adminDb.collection('games').add(gameData)
    
    const newGame: Game = {
      id: docRef.id,
      ...gameData,
    }

    return createSuccessResponse(newGame, '遊戲新增成功')

  } catch (error) {
    console.error('Error creating game:', error)
    return createErrorResponse('無法新增遊戲', 500)
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