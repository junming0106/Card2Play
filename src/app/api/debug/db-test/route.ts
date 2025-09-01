import { NextRequest } from 'next/server'
import { sql } from '@vercel/postgres'

// GET /api/debug/db-test - 測試資料庫連接
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 測試資料庫連接...')
    
    // 1. 測試基本連接
    const basicTest = await sql`SELECT NOW() AT TIME ZONE 'Asia/Taipei' as current_time, version() as pg_version`
    console.log('✅ 基本連接成功:', basicTest.rows[0])
    
    // 2. 檢查必要的表是否存在
    const tablesCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('users', 'games', 'user_games', 'user_matching_sessions')
      ORDER BY table_name
    `
    
    const existingTables = tablesCheck.rows.map(row => row.table_name)
    const expectedTables = ['users', 'games', 'user_games', 'user_matching_sessions']
    const missingTables = expectedTables.filter(table => !existingTables.includes(table))
    
    console.log('📋 表格檢查:', { existingTables, missingTables })
    
    // 3. 檢查用戶配對會話表結構
    let sessionTableStructure = null
    if (existingTables.includes('user_matching_sessions')) {
      const structureCheck = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'user_matching_sessions' 
          AND table_schema = 'public'
        ORDER BY ordinal_position
      `
      sessionTableStructure = structureCheck.rows
      console.log('📊 user_matching_sessions 表結構:', sessionTableStructure)
    }
    
    // 4. 檢查是否有示例數據
    let sampleData = null
    if (existingTables.includes('user_matching_sessions')) {
      const dataCheck = await sql`
        SELECT COUNT(*) as total_sessions,
               COUNT(CASE WHEN last_match_at IS NOT NULL THEN 1 END) as sessions_with_history
        FROM user_matching_sessions
      `
      sampleData = dataCheck.rows[0]
      console.log('📈 配對會話統計:', sampleData)
    }
    
    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        currentTime: basicTest.rows[0].current_time,
        version: basicTest.rows[0].pg_version
      },
      tables: {
        existing: existingTables,
        missing: missingTables,
        allRequired: missingTables.length === 0
      },
      sessionTable: {
        exists: existingTables.includes('user_matching_sessions'),
        structure: sessionTableStructure,
        data: sampleData
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('💥 資料庫測試失敗:', error)
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      details: {
        name: errorName,
        code: (error as any)?.code,
        stack: errorStack
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}