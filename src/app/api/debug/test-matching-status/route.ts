import { NextRequest } from 'next/server'
import { canUserMatch } from '@/lib/database'

// GET /api/debug/test-matching-status - 測試配對狀態檢查
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return new Response(JSON.stringify({ 
      success: false, 
      error: '此 API 僅在開發環境可用' 
    }), { 
      status: 403, 
      headers: { 'Content-Type': 'application/json' } 
    })
  }

  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    
    if (!userId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: '需要提供 userId 參數' 
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      })
    }

    console.log('🧪 測試配對狀態檢查:', { userId })
    
    // 檢查用戶配對權限
    const matchPermission = await canUserMatch(parseInt(userId))
    
    console.log('✅ 配對狀態檢查完成')
    
    return new Response(JSON.stringify({
      success: true,
      data: matchPermission,
      message: '配對狀態檢查成功'
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error('💥 配對狀態檢查錯誤:', error)
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: '配對狀態檢查失敗',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    })
  }
}