import { NextRequest } from 'next/server'
import { deleteUserByGoogleId } from '@/lib/database'
import { verifyAuthTokenAndGetUser, createSuccessResponse, createErrorResponse } from '@/lib/utils/api'

// DELETE /api/users/delete - 刪除當前用戶及其所有相關資料
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ 開始用戶刪除流程...')
    
    // 驗證身份並取得用戶
    const authResult = await verifyAuthTokenAndGetUser(request)
    if (!authResult.user) {
      console.log('❌ 身份驗證失敗:', authResult.error)
      return createErrorResponse(authResult.error || '未經授權', 401)
    }

    const user = authResult.user
    console.log('✅ 身份驗證成功，準備刪除用戶:', {
      userId: user.id,
      googleId: user.googleId,
      email: user.email,
      name: user.name
    })

    // 確認刪除操作（在生產環境中可能需要額外的確認機制）
    const { searchParams } = new URL(request.url)
    const confirmDelete = searchParams.get('confirm')
    
    if (confirmDelete !== 'true') {
      console.log('❌ 缺少刪除確認參數')
      return createErrorResponse('請確認刪除操作，添加 ?confirm=true 參數', 400)
    }

    // 刪除用戶及其相關資料
    const deletedUser = await deleteUserByGoogleId(user.googleId)
    
    if (!deletedUser) {
      console.log('❌ 用戶刪除失敗 - 用戶不存在')
      return createErrorResponse('用戶不存在或已被刪除', 404)
    }

    console.log('✅ 用戶刪除完成')
    return createSuccessResponse(
      {
        deletedUser: {
          id: deletedUser.id,
          email: deletedUser.email,
          name: deletedUser.name,
          deletedAt: new Date().toISOString()
        }
      },
      '用戶及其所有相關資料已成功刪除'
    )

  } catch (error) {
    console.error('💥 用戶刪除錯誤:', error)
    return createErrorResponse('用戶刪除失敗，請稍後再試', 500)
  }
}

// OPTIONS - 處理 CORS 預檢請求
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}