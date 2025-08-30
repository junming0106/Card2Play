import { NextRequest } from 'next/server'
import { sql } from '@vercel/postgres'
import { verifyAuthTokenAndGetUser, createSuccessResponse, createErrorResponse } from '@/lib/utils/api'

// GET /api/debug/user-games - 調試用戶遊戲數據
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 調試：檢查用戶遊戲數據')
    
    // 使用統一身份驗證函數
    const authResult = await verifyAuthTokenAndGetUser(request)
    
    if (!authResult.user) {
      console.log('❌ 身份驗證失敗:', authResult.error)
      return createErrorResponse(authResult.error || '未經授權', 401)
    }

    const user = authResult.user
    console.log('✅ 身份驗證成功，檢查用戶遊戲...', {
      userId: user.id,
      email: user.email,
      name: user.name
    })

    // 查詢該用戶的遊戲收藏
    const userGamesResult = await sql`
      SELECT 
        ug.*,
        g.title as game_title,
        g.publisher,
        g.is_custom
      FROM user_games ug
      JOIN games g ON ug.game_id = g.id
      WHERE ug.user_id = ${user.id}
      ORDER BY ug.status, ug.added_at DESC
    `;

    // 統計數據
    const stats = await sql`
      SELECT 
        COUNT(*) as total_games,
        COUNT(CASE WHEN status = '持有中' THEN 1 END) as owned_games,
        COUNT(CASE WHEN status = '想要交換' THEN 1 END) as wanted_games,
        COUNT(CASE WHEN status = '已借出' THEN 1 END) as lent_games
      FROM user_games 
      WHERE user_id = ${user.id}
    `;

    // 檢查其他用戶的遊戲（用於配對）
    const otherUsersGames = await sql`
      SELECT 
        ug.user_id,
        u.name as user_name,
        u.email as user_email,
        ug.status,
        g.title as game_title,
        ug.added_at
      FROM user_games ug
      JOIN games g ON ug.game_id = g.id
      JOIN users u ON ug.user_id = u.id
      WHERE ug.user_id != ${user.id}
      ORDER BY ug.added_at DESC
      LIMIT 20
    `;

    // 檢查潛在的配對機會
    const potentialMatches = await sql`
      -- 我想要的遊戲，其他人持有
      SELECT 
        'seeking' as match_type,
        seeker.user_id as my_user_id,
        holder.user_id as other_user_id,
        holder_user.name as other_user_name,
        holder_user.email as other_user_email,
        game.title as game_title,
        game.id as game_id
      FROM user_games seeker
      JOIN games game ON seeker.game_id = game.id
      JOIN user_games holder ON holder.game_id = seeker.game_id
      JOIN users holder_user ON holder.user_id = holder_user.id
      WHERE seeker.user_id = ${user.id}
        AND seeker.status = '想要交換'
        AND holder.status = '持有中'
        AND holder.user_id != ${user.id}
      
      UNION ALL
      
      -- 我持有的遊戲，其他人想要
      SELECT 
        'offering' as match_type,
        holder.user_id as my_user_id,
        seeker.user_id as other_user_id,
        seeker_user.name as other_user_name,
        seeker_user.email as other_user_email,
        game.title as game_title,
        game.id as game_id
      FROM user_games holder
      JOIN games game ON holder.game_id = game.id
      JOIN user_games seeker ON seeker.game_id = holder.game_id
      JOIN users seeker_user ON seeker.user_id = seeker_user.id
      WHERE holder.user_id = ${user.id}
        AND holder.status = '持有中'
        AND seeker.status = '想要交換'
        AND seeker.user_id != ${user.id}
      
      LIMIT 10
    `;

    const debugInfo = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      user_games: {
        total: userGamesResult.rows.length,
        games: userGamesResult.rows,
        stats: stats.rows[0]
      },
      other_users_games: {
        total: otherUsersGames.rows.length,
        sample: otherUsersGames.rows
      },
      potential_matches: {
        total: potentialMatches.rows.length,
        matches: potentialMatches.rows
      },
      summary: {
        can_find_matches: potentialMatches.rows.length > 0,
        has_wanted_games: stats.rows[0].wanted_games > 0,
        has_owned_games: stats.rows[0].owned_games > 0,
        other_users_exist: otherUsersGames.rows.length > 0
      }
    }

    return createSuccessResponse(debugInfo, '用戶遊戲調試信息獲取成功')

  } catch (error) {
    console.error('💥 用戶遊戲調試 API 錯誤:', error)
    return createErrorResponse('用戶遊戲調試失敗，請稍後再試', 500)
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