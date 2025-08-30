import { NextRequest } from 'next/server'
import { sql } from '@vercel/postgres'
import { verifyAuthTokenAndGetUser, createSuccessResponse, createErrorResponse } from '@/lib/utils/api'

// POST /api/db/migrate-history - 添加歷史記錄欄位到 user_matching_sessions 表格
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 開始資料庫遷移：添加歷史記錄欄位')
    
    // 使用統一身份驗證函數
    const authResult = await verifyAuthTokenAndGetUser(request)
    
    if (!authResult.user) {
      console.log('❌ 身份驗證失敗:', authResult.error)
      return createErrorResponse(authResult.error || '未經授權', 401)
    }

    const user = authResult.user
    console.log('✅ 身份驗證成功，開始資料庫遷移...', {
      userId: user.id,
      email: user.email
    })

    // 1. 檢查表格是否存在
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_matching_sessions'
      )
    `
    
    if (!tableExists.rows[0]?.exists) {
      console.log('❌ user_matching_sessions 表格不存在')
      return createErrorResponse('user_matching_sessions 表格不存在', 400)
    }

    // 2. 檢查欄位是否已存在
    const columnsCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_matching_sessions' 
      AND column_name IN ('last_match_games', 'last_match_at')
    `
    
    const existingColumns = columnsCheck.rows.map(row => row.column_name)
    console.log('🔍 現有相關欄位:', existingColumns)

    const migrations = []
    
    // 3. 添加 last_match_games 欄位（如果不存在）
    if (!existingColumns.includes('last_match_games')) {
      console.log('➕ 添加 last_match_games 欄位 (JSON)')
      await sql`
        ALTER TABLE user_matching_sessions 
        ADD COLUMN last_match_games JSON
      `
      migrations.push('Added last_match_games (JSON) column')
    } else {
      console.log('✅ last_match_games 欄位已存在')
      migrations.push('last_match_games column already exists')
    }

    // 4. 添加 last_match_at 欄位（如果不存在）
    if (!existingColumns.includes('last_match_at')) {
      console.log('➕ 添加 last_match_at 欄位 (TIMESTAMP)')
      await sql`
        ALTER TABLE user_matching_sessions 
        ADD COLUMN last_match_at TIMESTAMP WITH TIME ZONE
      `
      migrations.push('Added last_match_at (TIMESTAMP) column')
    } else {
      console.log('✅ last_match_at 欄位已存在')
      migrations.push('last_match_at column already exists')
    }

    // 5. 驗證遷移結果
    const finalColumns = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_matching_sessions'
      ORDER BY ordinal_position
    `

    console.log('✅ 資料庫遷移完成')

    return createSuccessResponse({
      migrations: migrations,
      table_structure: finalColumns.rows,
      target_columns: {
        last_match_games: finalColumns.rows.find(col => col.column_name === 'last_match_games'),
        last_match_at: finalColumns.rows.find(col => col.column_name === 'last_match_at')
      }
    }, '歷史記錄欄位遷移完成')

  } catch (error) {
    console.error('💥 資料庫遷移失敗:', error)
    return createErrorResponse(`資料庫遷移失敗: ${error instanceof Error ? error.message : '未知錯誤'}`, 500)
  }
}

// OPTIONS - 處理 CORS 預檢請求
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}