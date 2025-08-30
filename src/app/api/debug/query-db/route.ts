import { NextRequest } from 'next/server'
import { sql } from '@vercel/postgres'

// POST /api/debug/query-db - 執行資料庫查詢 (僅開發環境)
export async function POST(request: NextRequest) {
  // 僅在開發環境允許
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
    const { query } = await request.json()
    
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: '需要提供 query 參數' 
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      })
    }

    console.log('🔍 執行資料庫查詢:', query.substring(0, 100) + '...')
    
    const result = await sql.query(query)
    
    console.log('✅ 查詢成功，返回', result.rows.length, '筆資料')
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        rows: result.rows,
        rowCount: result.rowCount,
        query: query
      }
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error('💥 資料庫查詢錯誤:', error)
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: '資料庫查詢失敗',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    })
  }
}

// GET /api/debug/query-db - 預設查詢
export async function GET() {
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
    // 修正的查詢：不直接對 JSON 欄位排序
    const result = await sql`
      SELECT 
        id,
        user_id,
        session_start,
        matches_used,
        last_match_at,
        CASE 
          WHEN last_match_games IS NOT NULL THEN 'HAS_DATA'
          ELSE 'NO_DATA'
        END as has_last_match_games,
        created_at,
        updated_at
      FROM user_matching_sessions
      ORDER BY last_match_at DESC NULLS LAST
      LIMIT 50
    `
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        rows: result.rows,
        rowCount: result.rowCount
      }
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error('💥 預設查詢錯誤:', error)
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: '預設查詢失敗',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    })
  }
}