import { NextRequest } from 'next/server'
import { verifyAuthTokenAndGetUser } from '@/lib/utils/api'
import { sql } from '@vercel/postgres'

// GET /api/debug/matching-session - 調試用戶配對會話數據
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 調試：檢查用戶配對會話數據...')
    
    // 驗證用戶身份
    const authResult = await verifyAuthTokenAndGetUser(request)
    if (!authResult.user) {
      return new Response(JSON.stringify({ error: '未經授權' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      })
    }

    const user = authResult.user
    console.log('調試用戶:', { id: user.id, email: user.email })

    // 直接查詢資料庫
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
          WHEN last_match_at > NOW() - INTERVAL '60 minutes' THEN true
          ELSE false 
        END as has_recent_matches,
        -- 顯示時間差
        CASE 
          WHEN last_match_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (NOW() - last_match_at))::INTEGER
          ELSE NULL
        END as seconds_since_last_match
      FROM user_matching_sessions 
      WHERE user_id = ${user.id}
    `

    const session = result.rows[0] || null

    if (!session) {
      return new Response(JSON.stringify({
        success: true,
        message: '沒有找到配對會話',
        data: null
      }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      })
    }

    // 嘗試解析 JSON
    let parsedGames = null
    let parseError = null
    if (session.last_match_games) {
      try {
        parsedGames = JSON.parse(session.last_match_games)
      } catch (error) {
        parseError = error instanceof Error ? error.message : 'Unknown parse error'
      }
    }

    const debugData = {
      session: {
        id: session.id,
        user_id: session.user_id,
        session_start: session.session_start,
        matches_used: session.matches_used,
        last_match_at: session.last_match_at,
        has_recent_matches: session.has_recent_matches,
        session_expired: session.session_expired,
        seconds_until_reset: session.seconds_until_reset,
        seconds_since_last_match: session.seconds_since_last_match,
        created_at: session.created_at,
        updated_at: session.updated_at
      },
      raw_last_match_games: session.last_match_games,
      parsed_games: parsedGames,
      parse_error: parseError,
      analysis: {
        has_session: !!session,
        has_match_games_data: !!session.last_match_games,
        games_count: parsedGames ? parsedGames.length : 0,
        is_within_60_minutes: session.has_recent_matches,
        minutes_since_last_match: session.seconds_since_last_match ? Math.floor(session.seconds_since_last_match / 60) : null
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: '調試數據獲取成功',
      data: debugData
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error('💥 調試API錯誤:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: '調試失敗',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    })
  }
}