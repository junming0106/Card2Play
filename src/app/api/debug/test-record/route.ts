import { NextRequest } from 'next/server'
import { recordMatchingAttempt } from '@/lib/database'

// POST /api/debug/test-record - 測試記錄配對結果
export async function POST(request: NextRequest) {
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
    const { userId, matchResults } = await request.json()
    
    if (!userId || !matchResults) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: '需要提供 userId 和 matchResults 參數' 
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      })
    }

    console.log('🧪 測試記錄配對結果:', {
      userId,
      matchCount: matchResults.length,
      matches: matchResults
    })
    
    // 呼叫記錄函數
    const result = await recordMatchingAttempt(userId, matchResults)
    
    console.log('✅ 測試記錄成功')
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        session: result,
        inputData: { userId, matchResults }
      },
      message: '測試記錄配對結果成功'
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error('💥 測試記錄配對結果錯誤:', error)
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: '測試記錄失敗',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    })
  }
}