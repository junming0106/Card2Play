import { NextRequest } from 'next/server'
import { 
  verifyAuthTokenAndGetUser, 
  createSuccessResponse, 
  createErrorResponse 
} from '@/lib/utils/api'
import { 
  getUserGames, 
  findOrCreateGameByTitle, 
  addUserGame, 
  removeUserGame,
  updateUserGame 
} from '@/lib/database'

// GET /api/collections-pg - 取得用戶收藏列表
export async function GET(request: NextRequest) {
  try {
    console.log('📋 開始讀取用戶收藏 (PostgreSQL)...')
    
    // 驗證身份並取得用戶
    const authResult = await verifyAuthTokenAndGetUser(request)
    if (!authResult.user) {
      console.log('❌ 身份驗證失敗:', authResult.error)
      return createErrorResponse(authResult.error || '未經授權', 401)
    }

    const user = authResult.user
    console.log('✅ 身份驗證成功，用戶 ID:', user.id)

    // 取得用戶所有收藏遊戲
    const userGames = await getUserGames(user.id)
    console.log('📊 找到', userGames.length, '個收藏項目')

    // 格式化回應資料
    const collections = userGames.map((game: any) => ({
      id: game.game_id.toString(),
      gameId: game.game_id.toString(),
      gameTitle: game.custom_title || game.title,
      status: game.status,
      rating: game.rating,
      notes: game.notes,
      isCustomGame: game.is_custom,
      addedAt: game.added_at || game.created_at,
      updatedAt: game.updated_at,
      // 保留原始遊戲資訊
      title: game.title,
      publisher: game.custom_publisher || game.publisher,
      imageUrl: game.image_url
    }))

    console.log('✅ 收藏資料格式化完成')
    return createSuccessResponse(collections)

  } catch (error) {
    console.error('💥 讀取收藏錯誤:', error)
    return createErrorResponse('無法取得收藏列表', 500)
  }
}

// POST /api/collections-pg - 新增遊戲到收藏
export async function POST(request: NextRequest) {
  try {
    console.log('🎮 開始新增遊戲到收藏 (PostgreSQL)...')
    
    // 驗證身份並取得用戶
    const authResult = await verifyAuthTokenAndGetUser(request)
    if (!authResult.user) {
      console.log('❌ 身份驗證失敗:', authResult.error)
      return createErrorResponse(authResult.error || '未經授權', 401)
    }

    const user = authResult.user
    const body = await request.json()
    
    console.log('📦 收到的請求資料:', {
      gameTitle: body.gameTitle,
      status: body.status,
      rating: body.rating,
      notes: body.notes ? body.notes.substring(0, 50) + '...' : null
    })

    // 驗證必要欄位
    if (!body.gameTitle || !body.status) {
      console.log('❌ 缺少必要欄位')
      return createErrorResponse('缺少遊戲標題或收藏狀態', 400)
    }

    // 驗證收藏狀態
    if (!['持有中', '想要交換', '已借出'].includes(body.status)) {
      console.log('❌ 無效的收藏狀態:', body.status)
      return createErrorResponse('無效的收藏狀態', 400)
    }

    // 驗證評分範圍
    if (body.rating !== undefined && body.rating !== null && (body.rating < 1 || body.rating > 5)) {
      console.log('❌ 無效評分:', body.rating)
      return createErrorResponse('評分必須在 1-5 之間', 400)
    }

    // 檢查收藏數量限制（最多5個）
    const existingGames = await getUserGames(user.id)
    if (existingGames.length >= 5) {
      console.log('❌ 已達收藏上限:', existingGames.length)
      return createErrorResponse('每位用戶最多只能收藏 5 個遊戲', 400)
    }

    // 尋找或建立遊戲
    const game = await findOrCreateGameByTitle(body.gameTitle)
    console.log('🎯 遊戲 ID:', game.id, '標題:', game.title)

    // 新增到用戶收藏
    const userGame = await addUserGame(
      user.id,
      game.id,
      body.status,
      body.rating || undefined,
      body.notes || undefined
    )

    console.log('✅ 遊戲成功加入收藏')

    // 回應資料
    const responseData = {
      id: game.id.toString(),
      gameId: game.id.toString(),
      gameTitle: game.title,
      status: userGame.status,
      rating: userGame.rating,
      notes: userGame.notes,
      isCustomGame: game.is_custom,
      addedAt: userGame.added_at || userGame.created_at,
      updatedAt: userGame.updated_at
    }

    return createSuccessResponse(responseData, '遊戲已新增至收藏')

  } catch (error) {
    console.error('💥 新增收藏錯誤:', error)
    return createErrorResponse('無法新增至收藏', 500)
  }
}

// PUT /api/collections-pg - 更新收藏項目
export async function PUT(request: NextRequest) {
  try {
    console.log('📝 開始更新收藏項目 (PostgreSQL)...')
    
    // 驗證身份並取得用戶
    const authResult = await verifyAuthTokenAndGetUser(request)
    if (!authResult.user) {
      console.log('❌ 身份驗證失敗:', authResult.error)
      return createErrorResponse(authResult.error || '未經授權', 401)
    }

    const user = authResult.user
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')

    if (!gameId) {
      console.log('❌ 缺少遊戲 ID')
      return createErrorResponse('缺少遊戲 ID', 400)
    }

    const body = await request.json()
    console.log('📝 更新資料:', body)

    // 驗證狀態值
    if (body.status && !['持有中', '想要交換', '已借出'].includes(body.status)) {
      console.log('❌ 無效的收藏狀態:', body.status)
      return createErrorResponse('無效的收藏狀態', 400)
    }

    // 驗證評分範圍
    if (body.rating !== undefined && body.rating !== null && (body.rating < 1 || body.rating > 5)) {
      console.log('❌ 無效評分:', body.rating)
      return createErrorResponse('評分必須在 1-5 之間', 400)
    }

    // 更新收藏項目
    const updatedGame = await updateUserGame(user.id, parseInt(gameId), {
      status: body.status,
      rating: body.rating,
      notes: body.notes
    })

    if (!updatedGame) {
      console.log('❌ 找不到收藏項目')
      return createErrorResponse('找不到收藏項目', 404)
    }

    console.log('✅ 收藏項目更新成功')
    return createSuccessResponse(updatedGame, '收藏已更新')

  } catch (error) {
    console.error('💥 更新收藏錯誤:', error)
    return createErrorResponse('無法更新收藏', 500)
  }
}

// DELETE /api/collections-pg - 從收藏中移除
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ 開始移除收藏項目 (PostgreSQL)...')
    
    // 驗證身份並取得用戶
    const authResult = await verifyAuthTokenAndGetUser(request)
    if (!authResult.user) {
      console.log('❌ 身份驗證失敗:', authResult.error)
      return createErrorResponse(authResult.error || '未經授權', 401)
    }

    const user = authResult.user
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')

    if (!gameId) {
      console.log('❌ 缺少遊戲 ID')
      return createErrorResponse('缺少遊戲 ID', 400)
    }

    console.log('🗑️ 準備移除遊戲 ID:', gameId, '用戶 ID:', user.id)

    // 從收藏中移除
    const removedGame = await removeUserGame(user.id, parseInt(gameId))

    if (!removedGame) {
      console.log('❌ 找不到收藏項目')
      return createErrorResponse('找不到收藏項目', 404)
    }

    console.log('✅ 收藏項目移除成功')
    return createSuccessResponse(null, '已從收藏中移除')

  } catch (error) {
    console.error('💥 移除收藏錯誤:', error)
    return createErrorResponse('無法從收藏中移除', 500)
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