import { NextRequest } from 'next/server'
import { verifyAuthTokenAndGetUser } from '@/lib/utils/api'
import { canUserMatch } from '@/lib/database'

// GET /api/debug/test-matching - 測試配對 API 各個環節
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 開始測試配對 API 各個環節...')
    
    const url = new URL(request.url)
    const statusOnly = url.searchParams.get('status_only') === 'true'
    console.log('📋 測試參數:', { statusOnly })
    
    // 1. 測試身份驗證
    console.log('1️⃣ 測試身份驗證...')
    const authResult = await verifyAuthTokenAndGetUser(request)
    
    if (!authResult.user) {
      return new Response(JSON.stringify({
        success: false,
        step: 'authentication',
        error: authResult.error || '未經授權'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    
    const user = authResult.user
    console.log('✅ 身份驗證成功:', { userId: user.id, email: user.email })
    
    // 2. 測試配對權限檢查
    console.log('2️⃣ 測試配對權限檢查...')
    const matchPermission = await canUserMatch(user.id)
    console.log('✅ 配對權限檢查完成:', {
      canMatch: matchPermission.canMatch,
      matchesUsed: matchPermission.matchesUsed,
      hasRecentMatches: !!matchPermission.recentMatches
    })
    
    // 3. 如果是狀態檢查，測試歷史記錄處理
    let historyTestResult = null
    if (statusOnly) {
      console.log('3️⃣ 測試歷史記錄處理...')
      
      const recentMatches = matchPermission.recentMatches
      historyTestResult = {
        hasRecentMatches: !!recentMatches,
        recentMatchesType: typeof recentMatches,
        recentMatchesLength: Array.isArray(recentMatches) ? recentMatches.length : 0,
        sampleData: Array.isArray(recentMatches) && recentMatches.length > 0 
          ? recentMatches[0] 
          : null
      }
      console.log('✅ 歷史記錄檢查:', historyTestResult)
    }
    
    // 4. 如果不是狀態檢查且有權限，測試配對查詢
    let matchingTestResult = null
    if (!statusOnly && matchPermission.canMatch) {
      console.log('4️⃣ 測試配對查詢功能...')
      
      try {
        // 只測試查詢函數是否存在，不實際執行配對
        const { findGameMatches, findReversematches } = await import('@/lib/database')
        
        matchingTestResult = {
          functionsAvailable: {
            findGameMatches: typeof findGameMatches === 'function',
            findReversematches: typeof findReversematches === 'function'
          },
          message: '配對函數可用，但未執行實際配對（測試模式）'
        }
        console.log('✅ 配對查詢測試:', matchingTestResult)
      } catch (importError) {
        matchingTestResult = {
          error: '配對函數導入失敗',
          details: importError.message
        }
        console.log('❌ 配對查詢測試失敗:', matchingTestResult)
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      testResults: {
        authentication: {
          passed: true,
          user: { id: user.id, email: user.email, name: user.name }
        },
        matchPermission: {
          passed: true,
          data: {
            canMatch: matchPermission.canMatch,
            matchesUsed: matchPermission.matchesUsed,
            matchesRemaining: matchPermission.matchesRemaining,
            secondsUntilReset: matchPermission.secondsUntilReset,
            hasRecentMatches: !!matchPermission.recentMatches
          }
        },
        historyHandling: statusOnly ? {
          passed: true,
          data: historyTestResult
        } : { skipped: '非狀態檢查模式' },
        matchingQuery: !statusOnly && matchPermission.canMatch ? {
          passed: matchingTestResult && !matchingTestResult.error,
          data: matchingTestResult
        } : { skipped: '狀態檢查模式或無配對權限' }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('💥 配對 API 測試失敗:', error)
    
    return new Response(JSON.stringify({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      details: {
        name: error.name,
        code: error.code
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}