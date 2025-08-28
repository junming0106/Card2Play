require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function testUserDeletion() {
  try {
    console.log('🧪 開始測試用戶刪除功能...');

    // 建立測試用戶
    console.log('👤 建立測試用戶...');
    const testUser = await sql`
      INSERT INTO users (google_id, email, name) 
      VALUES ('test_deletion_user', 'deletion-test@test.com', '刪除測試用戶')
      ON CONFLICT (google_id) DO UPDATE SET 
        email = EXCLUDED.email, name = EXCLUDED.name
      RETURNING *
    `;
    
    const userId = testUser.rows[0].id;
    console.log('✅ 測試用戶建立完成:', userId);

    // 建立測試遊戲
    console.log('🎮 建立測試遊戲...');
    const testGame = await sql`
      INSERT INTO games (title, publisher) 
      VALUES ('刪除測試遊戲', 'Test Publisher')
      ON CONFLICT DO NOTHING
      RETURNING *
    `;

    let gameId;
    if (testGame.rows.length > 0) {
      gameId = testGame.rows[0].id;
    } else {
      const existingGame = await sql`SELECT id FROM games WHERE title = '刪除測試遊戲' LIMIT 1`;
      gameId = existingGame.rows[0].id;
    }
    
    console.log('✅ 測試遊戲準備完成:', gameId);

    // 為用戶新增遊戲收藏
    console.log('📚 新增遊戲收藏...');
    await sql`
      INSERT INTO user_games (user_id, game_id, status) 
      VALUES (${userId}, ${gameId}, '持有中')
      ON CONFLICT (user_id, game_id) DO UPDATE SET status = EXCLUDED.status
    `;
    
    console.log('✅ 遊戲收藏建立完成');

    // 驗證資料存在
    console.log('🔍 驗證資料存在...');
    const userCheck = await sql`SELECT * FROM users WHERE id = ${userId}`;
    const gameCheck = await sql`SELECT * FROM user_games WHERE user_id = ${userId}`;
    
    console.log('📊 刪除前資料狀態:');
    console.log('  - 用戶數量:', userCheck.rows.length);
    console.log('  - 收藏數量:', gameCheck.rows.length);

    // 執行用戶刪除
    console.log('🗑️ 執行用戶刪除...');
    const deletedUser = await sql`
      DELETE FROM users WHERE id = ${userId}
      RETURNING *
    `;
    
    console.log('✅ 用戶刪除完成:', {
      id: deletedUser.rows[0].id,
      email: deletedUser.rows[0].email,
      name: deletedUser.rows[0].name
    });

    // 驗證級聯刪除
    console.log('🔍 驗證級聯刪除效果...');
    const userAfterDelete = await sql`SELECT * FROM users WHERE id = ${userId}`;
    const gamesAfterDelete = await sql`SELECT * FROM user_games WHERE user_id = ${userId}`;
    
    console.log('📊 刪除後資料狀態:');
    console.log('  - 用戶數量:', userAfterDelete.rows.length);
    console.log('  - 收藏數量:', gamesAfterDelete.rows.length);

    // 驗證結果
    if (userAfterDelete.rows.length === 0 && gamesAfterDelete.rows.length === 0) {
      console.log('🎉 測試成功！用戶及其收藏已完全刪除');
    } else {
      console.log('❌ 測試失敗！資料未完全刪除');
    }

    console.log('✅ 用戶刪除功能測試完成！');

  } catch (error) {
    console.error('❌ 測試失敗:', error);
    process.exit(1);
  }
}

testUserDeletion();