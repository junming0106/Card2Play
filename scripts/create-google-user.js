require('dotenv').config({ path: '.env.local' });
const { createOrUpdateUser, addUserGame, findGameByTitle, createGame } = require('../src/lib/database.ts');

async function createGoogleTestUser() {
  try {
    console.log('👤 建立 Google 測試用戶...');

    // 模擬一個 Google 登入用戶
    const googleUser = {
      googleId: 'google_test_user_123', // 模擬 Firebase UID
      email: 'testuser@gmail.com',
      name: 'Google 測試用戶',
      avatarUrl: 'https://lh3.googleusercontent.com/test-avatar'
    };

    console.log('📝 用戶資訊:', googleUser);

    // 1. 建立用戶
    const user = await createOrUpdateUser(
      googleUser.googleId,
      googleUser.email,
      googleUser.name,
      googleUser.avatarUrl
    );

    console.log('✅ 用戶建立成功:', {
      id: user.id,
      google_id: user.google_id,
      email: user.email,
      name: user.name
    });

    // 2. 為用戶新增遊戲（設定一些想要交換的遊戲）
    console.log('🎮 為用戶新增遊戲...');

    // 確保遊戲存在
    const gameData = [
      { title: '薩爾達傳說 王國之淚', publisher: 'Nintendo' },
      { title: '超級瑪利歐兄弟 驚奇', publisher: 'Nintendo' }
    ];

    for (const gameInfo of gameData) {
      // 檢查遊戲是否存在，不存在則建立
      let game = await findGameByTitle(gameInfo.title);
      if (!game) {
        game = await createGame({
          title: gameInfo.title,
          publisher: gameInfo.publisher
        });
        console.log(`➕ 建立新遊戲: ${gameInfo.title}`);
      }

      // 設定用戶想要這個遊戲
      await addUserGame(user.id, game.id, 'wanted');
      console.log(`✅ 設定用戶想要: ${gameInfo.title}`);
    }

    console.log('🎉 Google 測試用戶建立完成！');
    console.log('📋 用戶摘要:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Google ID: ${user.google_id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log('');
    console.log('🚀 現在可以用這個 Google ID 測試配對 API：');
    console.log(`  Firebase UID: ${googleUser.googleId}`);
    console.log('  需要用 Firebase Admin SDK 生成 JWT Token 或使用真實的 Google 登入');

  } catch (error) {
    console.error('❌ 建立 Google 測試用戶失敗:', error);
    process.exit(1);
  }
}

createGoogleTestUser();