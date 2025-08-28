require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function testConnection() {
  console.log('🔧 環境變數檢查:');
  console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? '✅ 已設定' : '❌ 未設定');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ 已設定' : '❌ 未設定');
  console.log('');
  try {
    console.log('🔗 測試 Neon PostgreSQL 連接...');
    
    // 測試基本連接
    const result = await sql`SELECT NOW() as current_time, version()`;
    console.log('✅ 資料庫連接成功！');
    console.log('📅 當前時間:', result.rows[0].current_time);
    console.log('🗄️ 資料庫版本:', result.rows[0].version);
    
    // 檢查現有表格
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('📋 現有資料表:');
    if (tables.rows.length === 0) {
      console.log('  (無資料表，需要初始化)');
    } else {
      tables.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }
    
    console.log('🎉 資料庫連接測試完成！');
    
  } catch (error) {
    console.error('❌ 資料庫連接失敗:', error.message);
    process.exit(1);
  }
}

testConnection();