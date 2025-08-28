require('dotenv').config({ path: '.env.local' });
const { createCustomGame, getUserCustomGames, deleteCustomGame, getUserByGoogleId } = require('../src/lib/database.ts');

async function testPostgreSQLCustomGames() {
  try {
    console.log('🎮 測試 PostgreSQL 自定義遊戲功能...');

    // 使用之前建立的測試用戶
    const testGoogleId = 'google_test_user_123';
    const user = await getUserByGoogleId(testGoogleId);
    
    if (!user) {
      console.log('❌ 找不到測試用戶，請先執行 create-google-user.js');
      return;
    }
    
    console.log('✅ 找到測試用戶:', user.email);

    // 1. 建立自定義遊戲
    console.log('\n1. 建立自定義遊戲...');
    const gameData = {
      title: 'PostgreSQL 測試遊戲',
      customTitle: 'PostgreSQL 測試遊戲',
      customPublisher: '測試發行商',
      publisher: '測試發行商',
      releaseDate: '2024-01-01'
    };

    const customGame = await createCustomGame(user.id, gameData);
    console.log('✅ 自定義遊戲建立成功:', {
      id: customGame.id,
      title: customGame.title,
      publisher: customGame.publisher,
      is_custom: customGame.is_custom
    });

    // 2. 查詢用戶自定義遊戲
    console.log('\n2. 查詢用戶自定義遊戲...');
    const userCustomGames = await getUserCustomGames(user.id);
    console.log('✅ 找到', userCustomGames.length, '個自定義遊戲:');
    userCustomGames.forEach(game => {
      console.log(`  - ID: ${game.id}, 標題: ${game.title}, 狀態: ${game.status}`);
    });

    // 3. 刪除自定義遊戲
    console.log('\n3. 刪除自定義遊戲...');
    const deletedGame = await deleteCustomGame(user.id, customGame.id);
    console.log('✅ 自定義遊戲刪除成功:', deletedGame.title);

    // 4. 確認刪除
    console.log('\n4. 確認刪除結果...');
    const remainingGames = await getUserCustomGames(user.id);
    console.log('✅ 剩餘自定義遊戲數量:', remainingGames.length);

    console.log('\n🎉 PostgreSQL 自定義遊戲功能測試完成！');

  } catch (error) {
    console.error('❌ 測試失敗:', error);
  }
}

testPostgreSQLCustomGames();