import { NextRequest } from 'next/server'
import { cleanExpiredMatchingSessions } from '@/lib/database'

// POST /api/db/cleanup - 手動清理過期配對記錄（測試用）
export async function POST(request: NextRequest) {
  try {
    console.log('🧹 手動觸發清理過期配對記錄...')
    
    // 簡單的安全檢查
    const { secret } = await request.json()
    if (secret !== process.env.DB_INIT_SECRET) {
      return new Response(
        JSON.stringify({ success: false, error: '未經授權' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const result = await cleanExpiredMatchingSessions()
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '清理完成',
        cleanedCount: result.cleanedCount
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 清理 API 錯誤:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: '清理失敗' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// GET /api/db/cleanup - 檢查過期配對記錄數量
export async function GET() {
  try {
    const { sql } = await import('@vercel/postgres')
    
    const result = await sql`
      SELECT COUNT(*) as expired_count
      FROM user_matching_sessions 
      WHERE last_match_at IS NOT NULL 
        AND last_match_at < NOW() - INTERVAL '60 minutes'
    `
    
    const expiredCount = result.rows[0]?.expired_count || 0
    
    return new Response(
      JSON.stringify({
        success: true,
        expiredCount: parseInt(expiredCount),
        message: `發現 ${expiredCount} 筆過期配對記錄`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 檢查過期記錄錯誤:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: '檢查失敗' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}