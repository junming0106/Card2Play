import { NextRequest } from 'next/server'
import { sql } from '@vercel/postgres'

// POST /api/db/add-match-history-column - 添加match_history欄位到user_matching_sessions表
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 添加 match_history 欄位到 user_matching_sessions 表...')
    
    // 簡單的安全檢查
    const { secret } = await request.json()
    if (secret !== process.env.DB_INIT_SECRET) {
      return new Response(
        JSON.stringify({ success: false, error: '未經授權' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 檢查欄位是否已存在
    const checkColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_matching_sessions' 
        AND column_name = 'match_history'
    `
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ match_history 欄位已存在')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'match_history 欄位已存在',
          action: 'no_action_needed'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 添加新欄位
    await sql`
      ALTER TABLE user_matching_sessions 
      ADD COLUMN match_history JSONB DEFAULT NULL
    `
    
    console.log('✅ match_history 欄位添加成功')
    
    // 添加註釋說明欄位用途
    await sql`
      COMMENT ON COLUMN user_matching_sessions.match_history IS '累積的配對歷史記錄，與當前配對結果(last_match_games)分離存儲'
    `
    
    // 檢查表格結構
    const tableStructure = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'user_matching_sessions'
      ORDER BY ordinal_position
    `
    
    console.log('📋 更新後的表格結構:', tableStructure.rows)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'match_history 欄位添加成功',
        tableStructure: tableStructure.rows,
        action: 'column_added'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 添加欄位失敗:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: '添加欄位失敗',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// GET /api/db/add-match-history-column - 檢查欄位狀態
export async function GET() {
  try {
    const checkColumn = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_matching_sessions'
      ORDER BY ordinal_position
    `
    
    const hasMatchHistory = checkColumn.rows.some(row => row.column_name === 'match_history')
    
    return new Response(
      JSON.stringify({
        success: true,
        hasMatchHistory,
        columns: checkColumn.rows,
        message: hasMatchHistory ? 'match_history 欄位已存在' : 'match_history 欄位不存在'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 檢查欄位失敗:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: '檢查欄位失敗',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}