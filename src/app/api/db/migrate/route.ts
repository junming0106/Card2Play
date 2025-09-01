import { NextRequest } from 'next/server'
import { sql } from '@vercel/postgres'

// POST /api/db/migrate - 執行資料庫遷移
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 開始資料庫遷移...')

    // 添加 added_at 欄位到 user_games 表
    try {
      await sql`ALTER TABLE user_games ADD COLUMN IF NOT EXISTS added_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Taipei')`
      console.log('✅ 已添加 added_at 欄位')
    } catch (error) {
      console.log('⚠️ added_at 欄位可能已存在:', (error as Error).message)
    }

    // 添加 rating 欄位到 user_games 表
    try {
      await sql`ALTER TABLE user_games ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5)`
      console.log('✅ 已添加 rating 欄位')
    } catch (error) {
      console.log('⚠️ rating 欄位可能已存在:', (error as Error).message)
    }

    // 添加 notes 欄位到 user_games 表
    try {
      await sql`ALTER TABLE user_games ADD COLUMN IF NOT EXISTS notes TEXT`
      console.log('✅ 已添加 notes 欄位')
    } catch (error) {
      console.log('⚠️ notes 欄位可能已存在:', (error as Error).message)
    }

    // 更新 status 欄位約束以支援中文狀態
    try {
      await sql`ALTER TABLE user_games DROP CONSTRAINT IF EXISTS user_games_status_check`
      console.log('✅ 已刪除舊的 status 約束')
      
      await sql`ALTER TABLE user_games ADD CONSTRAINT user_games_status_check CHECK (status IN ('owned', 'wanted', '持有中', '想要交換', '已借出'))`
      console.log('✅ 已添加新的 status 約束')
    } catch (error) {
      console.log('⚠️ status 約束更新失敗:', (error as Error).message)
    }

    // 檢查欄位是否存在
    const columnsResult = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_games' 
      ORDER BY column_name
    `
    
    const columns = columnsResult.rows.map(row => row.column_name)
    console.log('📋 user_games 表的所有欄位:', columns)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'user_games 表遷移完成',
        columns: columns
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 資料庫遷移錯誤:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: '資料庫遷移失敗',
        details: (error as Error).message
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
}

// GET /api/db/migrate - 檢查遷移狀態
export async function GET() {
  try {
    // 檢查 user_games 表結構
    const columnsResult = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_games' 
      ORDER BY ordinal_position
    `
    
    const columns = columnsResult.rows
    const hasAddedAt = columns.some(col => col.column_name === 'added_at')
    const hasRating = columns.some(col => col.column_name === 'rating')
    const hasNotes = columns.some(col => col.column_name === 'notes')
    
    return new Response(
      JSON.stringify({
        success: true,
        migrationStatus: {
          hasAddedAt,
          hasRating, 
          hasNotes,
          needsMigration: !hasAddedAt || !hasRating || !hasNotes
        },
        columns: columns
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 檢查遷移狀態錯誤:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: '無法檢查遷移狀態' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
}