import { NextRequest } from 'next/server'
import { sql } from '@vercel/postgres'
import { verifyAuthTokenAndGetUser, createSuccessResponse, createErrorResponse } from '@/lib/utils/api'

// GET /api/debug/check-history - 檢查資料庫中的歷史記錄
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 檢查資料庫歷史記錄')
    
    // 使用統一身份驗證函數
    const authResult = await verifyAuthTokenAndGetUser(request)
    
    if (!authResult.user) {
      console.log('❌ 身份驗證失敗:', authResult.error)
      return createErrorResponse(authResult.error || '未經授權', 401)
    }

    const user = authResult.user
    console.log('✅ 身份驗證成功，檢查歷史記錄...', {
      userId: user.id,
      email: user.email
    })

    // 1. 檢查表格結構
    const tableStructure = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_matching_sessions'
      ORDER BY ordinal_position
    `

    // 2. 檢查所有用戶的配對會話
    const allSessions = await sql`
      SELECT 
        s.user_id,
        u.email,
        s.matches_used,
        s.last_match_at,
        s.session_start,
        CASE 
          WHEN s.last_match_games IS NOT NULL THEN 'Has History'
          ELSE 'No History'
        END as history_status,
        -- 檢查是否在有效期內
        CASE 
          WHEN s.last_match_at IS NULL THEN 'No Match Yet'
          WHEN s.last_match_at > NOW() AT TIME ZONE 'Asia/Taipei' - INTERVAL '1 minute' THEN 'Valid'
          ELSE 'Expired'
        END as validity_status,
        -- 計算分鐘數
        CASE 
          WHEN s.last_match_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (NOW() AT TIME ZONE 'Asia/Taipei' - s.last_match_at))/60
          ELSE NULL
        END as minutes_ago
      FROM user_matching_sessions s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.updated_at DESC
      LIMIT 20
    `

    // 3. 檢查當前用戶的詳細歷史記錄
    const userHistory = await sql`
      SELECT 
        s.*,
        u.email,
        -- 檢查JSON數據
        CASE 
          WHEN s.last_match_games IS NOT NULL THEN 
            JSON_ARRAY_LENGTH(s.last_match_games)
          ELSE 0
        END as match_count,
        -- 檢查數據長度
        CASE 
          WHEN s.last_match_games IS NOT NULL THEN 
            LENGTH(s.last_match_games::text)
          ELSE 0
        END as data_length
      FROM user_matching_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ${user.id}
    `

    // 4. 檢查有歷史記錄的用戶
    const usersWithHistory = await sql`
      SELECT 
        u.email,
        s.user_id,
        s.last_match_at,
        s.last_match_games::text as match_data_preview,
        JSON_ARRAY_LENGTH(s.last_match_games) as match_count,
        EXTRACT(EPOCH FROM (NOW() AT TIME ZONE 'Asia/Taipei' - s.last_match_at))/60 as minutes_ago
      FROM user_matching_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.last_match_games IS NOT NULL
      ORDER BY s.last_match_at DESC
    `

    // 5. 統計資訊
    const statistics = await sql`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN last_match_games IS NOT NULL THEN 1 END) as sessions_with_history,
        COUNT(CASE WHEN last_match_at > NOW() AT TIME ZONE 'Asia/Taipei' - INTERVAL '1 minute' THEN 1 END) as recent_matches,
        COUNT(CASE WHEN last_match_games IS NOT NULL AND last_match_at > NOW() AT TIME ZONE 'Asia/Taipei' - INTERVAL '1 minute' THEN 1 END) as valid_history_records
      FROM user_matching_sessions
    `

    const debugInfo = {
      current_user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      table_structure: tableStructure.rows,
      statistics: statistics.rows[0],
      all_sessions: allSessions.rows,
      current_user_history: userHistory.rows[0] || null,
      users_with_history: usersWithHistory.rows,
      key_fields: {
        table_name: 'user_matching_sessions',
        history_field: 'last_match_games (JSON)',
        timestamp_field: 'last_match_at (TIMESTAMP)',
        validity_period: '1 minute'
      },
      sql_queries: {
        check_your_history: `SELECT * FROM user_matching_sessions WHERE user_id = ${user.id}`,
        check_all_history: "SELECT * FROM user_matching_sessions WHERE last_match_games IS NOT NULL",
        check_valid_history: "SELECT * FROM user_matching_sessions WHERE last_match_games IS NOT NULL AND last_match_at > NOW() AT TIME ZONE 'Asia/Taipei' - INTERVAL '1 minute'"
      }
    }

    return createSuccessResponse(debugInfo, '歷史記錄檢查完成')

  } catch (error) {
    console.error('💥 檢查歷史記錄失敗:', error)
    return createErrorResponse('檢查歷史記錄失敗，請稍後再試', 500)
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