import { NextRequest } from 'next/server'
import { sql } from '@vercel/postgres'
import { verifyAuthTokenAndGetUser, createSuccessResponse, createErrorResponse } from '@/lib/utils/api'

// GET /api/debug/matching-sessions - 調試配對會話數據
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 調試：檢查配對會話數據')
    
    // 使用統一身份驗證函數
    const authResult = await verifyAuthTokenAndGetUser(request)
    
    if (!authResult.user) {
      console.log('❌ 身份驗證失敗:', authResult.error)
      return createErrorResponse(authResult.error || '未經授權', 401)
    }

    const user = authResult.user
    console.log('✅ 身份驗證成功，檢查配對會話...', {
      userId: user.id,
      email: user.email,
      name: user.name
    })

    // 查詢該用戶的配對會話數據
    const result = await sql`
      SELECT 
        *,
        -- 計算 session 是否已過3小時
        CASE 
          WHEN session_start < NOW() - INTERVAL '3 hours' THEN true 
          ELSE false 
        END as session_expired,
        -- 計算距離重置還有多少秒
        CASE 
          WHEN session_start < NOW() - INTERVAL '3 hours' THEN 0
          ELSE EXTRACT(EPOCH FROM (session_start + INTERVAL '3 hours' - NOW()))::INTEGER
        END as seconds_until_reset,
        -- 檢查最後配對記錄是否在60分鐘內
        CASE 
          WHEN last_match_at IS NULL THEN false
          WHEN last_match_at > NOW() - INTERVAL '1 minute' THEN true
          ELSE false 
        END as has_recent_matches,
        -- 時間差計算
        EXTRACT(EPOCH FROM (NOW() - last_match_at))::INTEGER as minutes_since_last_match
      FROM user_matching_sessions 
      WHERE user_id = ${user.id}
    `;

    const session = result.rows[0] || null

    let parsedMatches = null
    let parseError = null
    
    if (session && session.last_match_games) {
      try {
        parsedMatches = JSON.parse(session.last_match_games)
      } catch (error) {
        parseError = error instanceof Error ? error.message : 'Unknown parse error'
      }
    }

    const debugInfo = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      session: session ? {
        id: session.id,
        user_id: session.user_id,
        session_start: session.session_start,
        matches_used: session.matches_used,
        last_match_at: session.last_match_at,
        session_expired: session.session_expired,
        seconds_until_reset: session.seconds_until_reset,
        has_recent_matches: session.has_recent_matches,
        minutes_since_last_match: session.minutes_since_last_match,
        last_match_games_raw: session.last_match_games ? session.last_match_games.substring(0, 200) + (session.last_match_games.length > 200 ? '...' : '') : null,
        last_match_games_type: typeof session.last_match_games,
        created_at: session.created_at,
        updated_at: session.updated_at
      } : null,
      parsed_matches: {
        success: !parseError,
        error: parseError,
        count: parsedMatches ? (Array.isArray(parsedMatches) ? parsedMatches.length : 'not array') : 0,
        data: parsedMatches && Array.isArray(parsedMatches) ? parsedMatches.slice(0, 3) : parsedMatches // 只顯示前3個
      },
      current_time: new Date().toISOString(),
      database_time: await getCurrentDatabaseTime()
    }

    return createSuccessResponse(debugInfo, '調試信息獲取成功')

  } catch (error) {
    console.error('💥 調試 API 錯誤:', error)
    return createErrorResponse('調試 API 失敗，請稍後再試', 500)
  }
}

// 獲取資料庫當前時間
async function getCurrentDatabaseTime() {
  try {
    const result = await sql`SELECT NOW() as db_time`
    return result.rows[0]?.db_time || null
  } catch (error) {
    return null
  }
}

// OPTIONS - 處理 CORS 預檢請求
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}