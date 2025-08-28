import { NextRequest } from 'next/server'
import { createCustomGame, getUserCustomGames, deleteCustomGame } from '@/lib/database'
import { verifyAuthToken, verifyAuthTokenAndGetUser, createSuccessResponse, createErrorResponse } from '@/lib/utils/api'

// POST /api/custom-games-pg - 建立自定義遊戲（PostgreSQL 版本）
export async function POST(request: NextRequest) {
  try {
    console.log('🎮 開始建立自定義遊戲...')
    
    // 先解析請求資料
    const body = await request.json()
    console.log('📝 遊戲資料:', body)
    
    // 驗證身份並取得用戶
    const authResult = await verifyAuthTokenAndGetUser(request)
    
    // 如果標準驗證失敗，嘗試基本的 Firebase 驗證
    if (!authResult.user) {
      console.log('⚠️ PostgreSQL 用戶驗證失敗，嘗試基本 Firebase 驗證:', authResult.error)
      
      const decodedToken = await verifyAuthToken(request)
      if (!decodedToken) {
        console.log('❌ Firebase 身份驗證也失敗')
        return createErrorResponse('未經授權', 401)
      }
      
      // 使用 Firebase UID 作為臨時用戶 ID
      console.log('✅ 使用 Firebase 基本驗證成功:', decodedToken.uid)
      const user = {
        id: parseInt(decodedToken.uid.slice(-8), 36) || 1, // 將 UID 後8位轉為數字作為臨時 ID
        email: decodedToken.email || 'unknown@user.com',
        firebaseUid: decodedToken.uid,
        name: decodedToken.name || 'User'
      }
      
      // 驗證必要欄位
      if (!body.customTitle?.trim()) {
        return createErrorResponse('遊戲標題為必填欄位', 400)
      }
      
      // 建立自定義遊戲（使用臨時用戶資料）
      const gameData = {
        title: body.customTitle,
        customTitle: body.customTitle,
        customPublisher: body.customPublisher || '未知',
        publisher: body.customPublisher || '未知',
        releaseDate: body.releaseDate || new Date().toISOString().split('T')[0],
        imageUrl: undefined
      }

      try {
        const customGame = await createCustomGame(user.id, gameData)
        
        console.log('✅ 自定義遊戲建立成功:', customGame.title)
        
        return createSuccessResponse({
          game: {
            id: customGame.id,
            title: customGame.title,
            customTitle: customGame.custom_title,
            customPublisher: customGame.custom_publisher,
            publisher: customGame.publisher,
            releaseDate: customGame.release_date,
            isCustom: customGame.is_custom,
            createdAt: customGame.created_at
          }
        }, '自定義遊戲建立成功')
      } catch (dbError) {
        console.error('💥 資料庫操作失敗:', dbError)
        return createErrorResponse('資料庫連線失敗', 500)
      }
    }

    const user = authResult.user
    console.log('✅ 完整身份驗證成功:', user.email)

    // 驗證必要欄位
    if (!body.customTitle?.trim()) {
      return createErrorResponse('遊戲標題為必填欄位', 400)
    }

    // 建立自定義遊戲
    const gameData = {
      title: body.customTitle,
      customTitle: body.customTitle,
      customPublisher: body.customPublisher || '未知',
      publisher: body.customPublisher || '未知',
      releaseDate: body.releaseDate || new Date().toISOString().split('T')[0],
      imageUrl: undefined
    }

    const customGame = await createCustomGame(user.id, gameData)
    
    console.log('✅ 自定義遊戲建立成功:', customGame.title)

    return createSuccessResponse({
      game: {
        id: customGame.id,
        title: customGame.title,
        customTitle: customGame.custom_title,
        customPublisher: customGame.custom_publisher,
        publisher: customGame.publisher,
        releaseDate: customGame.release_date,
        isCustom: customGame.is_custom,
        createdAt: customGame.created_at
      }
    }, '自定義遊戲建立成功')

  } catch (error) {
    console.error('💥 建立自定義遊戲錯誤:', error)
    return createErrorResponse('建立自定義遊戲失敗', 500)
  }
}

// GET /api/custom-games-pg - 取得用戶自定義遊戲列表
export async function GET(request: NextRequest) {
  try {
    console.log('📋 取得用戶自定義遊戲列表...')
    
    // 驗證身份並取得用戶
    const authResult = await verifyAuthTokenAndGetUser(request)
    if (!authResult.user) {
      return createErrorResponse(authResult.error || '未經授權', 401)
    }

    const user = authResult.user
    const customGames = await getUserCustomGames(user.id)

    console.log('✅ 找到', customGames.length, '個自定義遊戲')

    const formattedGames = customGames.map(game => ({
      id: game.id,
      title: game.title,
      customTitle: game.custom_title,
      customPublisher: game.custom_publisher,
      publisher: game.publisher,
      releaseDate: game.release_date,
      status: game.status,
      isCustom: game.is_custom,
      createdAt: game.created_at,
      addedAt: game.added_at
    }))

    return createSuccessResponse({ games: formattedGames })

  } catch (error) {
    console.error('💥 取得自定義遊戲列表錯誤:', error)
    return createErrorResponse('取得遊戲列表失敗', 500)
  }
}

// DELETE /api/custom-games-pg - 刪除自定義遊戲
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ 開始刪除自定義遊戲...')
    
    // 驗證身份並取得用戶
    const authResult = await verifyAuthTokenAndGetUser(request)
    if (!authResult.user) {
      console.log('❌ 身份驗證失敗:', authResult.error)
      return createErrorResponse(authResult.error || '未經授權', 401)
    }

    const user = authResult.user
    const { searchParams } = new URL(request.url)
    const gameIdStr = searchParams.get('gameId')
    
    console.log('📋 要刪除的遊戲 ID:', gameIdStr)
    console.log('👤 用戶:', user.email)

    if (!gameIdStr) {
      console.log('❌ 缺少遊戲 ID 參數')
      return createErrorResponse('缺少遊戲 ID', 400)
    }

    // 將 gameId 轉換為數字
    const gameId = parseInt(gameIdStr)
    if (isNaN(gameId)) {
      console.log('❌ 無效的遊戲 ID 格式')
      return createErrorResponse('無效的遊戲 ID 格式', 400)
    }

    // 刪除自定義遊戲
    const deletedGame = await deleteCustomGame(user.id, gameId)
    
    console.log('✅ 自定義遊戲刪除成功:', deletedGame.title)

    return createSuccessResponse({
      game: {
        id: deletedGame.id,
        title: deletedGame.title || deletedGame.custom_title,
        customTitle: deletedGame.custom_title
      }
    }, '自定義遊戲已刪除')

  } catch (error) {
    console.error('💥 刪除自定義遊戲錯誤:', error)
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 404)
    }
    
    return createErrorResponse('刪除自定義遊戲失敗', 500)
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