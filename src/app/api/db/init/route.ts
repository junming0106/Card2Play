import { NextRequest } from 'next/server'
import { initializeDatabase } from '@/lib/database'

// POST /api/db/init - 初始化 PostgreSQL 資料庫
export async function POST(request: NextRequest) {
  try {
    console.log('🗄️ 開始初始化資料庫...')
    
    // 簡單的安全檢查（生產環境應該有更嚴格的驗證）
    const { secret } = await request.json()
    if (secret !== process.env.DB_INIT_SECRET) {
      return new Response(
        JSON.stringify({ success: false, error: '未經授權' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const result = await initializeDatabase()
    
    if (result.success) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'PostgreSQL 資料庫初始化成功' 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '資料庫初始化失敗',
          details: result.error 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('💥 初始化 API 錯誤:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: '資料庫初始化 API 錯誤' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// GET /api/db/init - 檢查資料庫狀態
export async function GET() {
  try {
    const { sql } = await import('@vercel/postgres')
    
    // 檢查表是否存在
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    
    const tableNames = tables.rows.map(row => row.table_name)
    const expectedTables = ['users', 'games', 'user_games', 'user_matching_sessions']
    const missingTables = expectedTables.filter(table => !tableNames.includes(table))
    
    return new Response(
      JSON.stringify({
        success: true,
        status: missingTables.length === 0 ? 'initialized' : 'incomplete',
        existingTables: tableNames,
        missingTables: missingTables
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 資料庫狀態檢查錯誤:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: '無法檢查資料庫狀態' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}