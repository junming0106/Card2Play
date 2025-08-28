import { NextRequest } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import {
  verifyAuthToken,
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/utils/api'
import { 
  CollectionItemExtended, 
  AddToCollectionRequest, 
  UpdateCollectionRequest,
} from '@/types/collection'

// GET /api/collections - 取得用戶收藏
export async function GET(request: NextRequest) {
  try {
    console.log('📖 開始讀取用戶收藏...')
    
    // 檢查 Firebase Admin 是否可用
    if (!adminDb) {
      console.log('⚠️ Firebase Admin 不可用，無法讀取 Firestore 資料')
      return createErrorResponse('服務暫時不可用', 503)
    }
    
    const user = await verifyAuthToken(request)
    if (!user) {
      console.log('❌ 讀取收藏：身份驗證失敗')
      
      // 檢查基本的 Authorization header
      const authHeader = request.headers.get('Authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return createErrorResponse('未經授權', 401)
      }
      
      // 無法使用 Firebase Admin，返回空列表或建議
      return createErrorResponse('Firebase 服務不可用', 503)
    }

    console.log('✅ 身份驗證成功，讀取用戶收藏:', user.uid)

    const collectionsSnapshot = await adminDb
      .collection(`collections/${user.uid}/games`)
      .orderBy('addedAt', 'desc')
      .get()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const collections: CollectionItemExtended[] = collectionsSnapshot.docs.map((doc: any) => ({
      ...doc.data(),
      addedAt: doc.data().addedAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as CollectionItemExtended[]

    console.log('✅ 成功讀取', collections.length, '個收藏項目')
    return createSuccessResponse(collections)

  } catch (error) {
    console.error('💥 讀取收藏錯誤:', error)
    return createErrorResponse('無法取得收藏列表', 500)
  }
}

// POST /api/collections - 新增到收藏
export async function POST(request: NextRequest) {
  try {
    console.log('🎮 開始新增到收藏...')
    
    // 檢查 Firebase Admin 是否可用
    if (!adminDb) {
      console.log('⚠️ Firebase Admin 不可用，無法使用 Firestore API')
      return createErrorResponse('服務暫時不可用，請使用手動新增遊戲功能', 503)
    }
    console.log('🎯 API 呼叫開始')
    
    // 先測試基本請求解析
    const body: AddToCollectionRequest = await request.json()
    console.log('📦 收到的請求資料:', JSON.stringify(body, null, 2))

    // 驗證必要欄位
    if (!body.gameId || !body.gameTitle || !body.status) {
      console.log('❌ 缺少必要欄位:', { gameId: !!body.gameId, gameTitle: !!body.gameTitle, status: !!body.status })
      return createErrorResponse('缺少必要欄位')
    }

    if (!['持有中', '想要交換', '已借出'].includes(body.status)) {
      console.log('❌ 無效的收藏狀態:', body.status)
      return createErrorResponse(`無效的收藏狀態: ${body.status}`)
    }

    console.log('✅ 基本驗證通過')

    // 身份驗證 - 使用備用機制
    console.log('🔐 開始身份驗證...')
    const user = await verifyAuthToken(request)
    if (!user) {
      console.log('❌ Firebase Admin 身份驗證失敗，嘗試基本驗證')
      
      // 檢查基本的 Authorization header
      const authHeader = request.headers.get('Authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ 缺少有效的 Authorization header')
        return createErrorResponse('未經授權', 401)
      }
      
      // 在這種情況下，我們無法使用 Firestore，返回建議使用其他功能
      console.log('⚠️ 無法使用 Firebase Admin，建議使用手動新增遊戲功能')
      return createErrorResponse('Firebase 服務不可用，請使用手動新增遊戲功能', 503)
    }
    console.log('✅ 身份驗證成功，用戶 UID:', user.uid)

    // 檢查收藏數量限制（最多5個）
    console.log('📊 檢查收藏數量限制...')
    const existingCollectionSnapshot = await adminDb
      .collection(`collections/${user.uid}/games`)
      .get()
    
    console.log('📊 目前收藏數量:', existingCollectionSnapshot.size)

    if (existingCollectionSnapshot.size >= 5) {
      console.log('❌ 已達收藏上限')
      return createErrorResponse('每位用戶最多只能收藏 5 個遊戲', 400)
    }

    // 驗證評分範圍
    if (body.rating !== undefined && (body.rating < 1 || body.rating > 5)) {
      console.log('❌ 無效評分:', body.rating)
      return createErrorResponse('評分必須在 1-5 之間')
    }

    // 過濾掉 null 值，避免 Firestore 錯誤
    const collectionData: Record<string, unknown> = {
      id: body.gameId,
      gameId: body.gameId,
      gameTitle: body.gameTitle,
      status: body.status,
      isCustomGame: body.isCustomGame || false,
      addedAt: new Date(),
      updatedAt: new Date(),
    }

    // 只有當值不為 null 時才加入
    if (body.rating !== null && body.rating !== undefined) {
      collectionData.rating = body.rating
    }
    if (body.notes !== null && body.notes !== undefined && body.notes !== '') {
      collectionData.notes = body.notes
    }
    if (body.customGameData) {
      collectionData.customGameData = body.customGameData
    }

    // 寫入 Firestore
    console.log('💾 開始寫入 Firestore...')
    await adminDb
      .collection(`collections/${user.uid}/games`)
      .doc(body.gameId)
      .set(collectionData, { merge: true })

    console.log('✅ API 呼叫成功完成，遊戲已新增至收藏')
    return createSuccessResponse(collectionData, '已新增至收藏')

  } catch (error) {
    console.error('💥 API 錯誤詳情:', error)
    console.error('💥 錯誤堆疊:', (error as Error).stack)
    return createErrorResponse(`無法新增至收藏: ${(error as Error).message}`, 500)
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
    if (body.status && !['持有中', '想要交換', '已借出'].includes(body.status)) {
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