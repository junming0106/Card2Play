require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function seedTestData() {
  try {
    console.log('🌱 開始建立測試資料...');

    // 建立測試用戶
    console.log('👥 建立測試用戶...');
    
    const user1 = await sql`
      INSERT INTO users (google_id, email, name) 
      VALUES ('test_user_1', 'user1@test.com', '測試用戶 1')
      ON CONFLICT (google_id) DO UPDATE SET 
        email = EXCLUDED.email, name = EXCLUDED.name
      RETURNING *
    `;
    
    const user2 = await sql`
      INSERT INTO users (google_id, email, name) 
      VALUES ('test_user_2', 'user2@test.com', '測試用戶 2')
      ON CONFLICT (google_id) DO UPDATE SET 
        email = EXCLUDED.email, name = EXCLUDED.name
      RETURNING *
    `;

    const user3 = await sql`
      INSERT INTO users (google_id, email, name) 
      VALUES ('test_user_3', 'user3@test.com', '測試用戶 3')
      ON CONFLICT (google_id) DO UPDATE SET 
        email = EXCLUDED.email, name = EXCLUDED.name
      RETURNING *
    `;

    console.log('✅ 用戶建立完成');

    // 建立測試遊戲
    console.log('🎮 建立測試遊戲...');
    
    const games = [
      { title: '薩爾達傳說 曠野之息', publisher: 'Nintendo' },
      { title: '超級瑪利歐 奧德賽', publisher: 'Nintendo' },
      { title: '精靈寶可夢 朱/紫', publisher: 'Nintendo' },
      { title: '斯普拉遁3', publisher: 'Nintendo' },
      { title: '動物森友會', publisher: 'Nintendo' }
    ];

    const gameIds = [];
    for (const game of games) {
      const result = await sql`
        INSERT INTO games (title, publisher) 
        VALUES (${game.title}, ${game.publisher})
        ON CONFLICT DO NOTHING
        RETURNING *
      `;
      
      if (result.rows.length > 0) {
        gameIds.push(result.rows[0].id);
      } else {
        // 如果遊戲已存在，查詢其 ID
        const existing = await sql`SELECT id FROM games WHERE title = ${game.title} LIMIT 1`;
        gameIds.push(existing.rows[0].id);
      }
    }

    console.log('✅ 遊戲建立完成');

    // 建立用戶遊戲關聯（配對測試資料）
    console.log('🔗 建立用戶遊戲關聯...');

    // 用戶 1：想要「薩爾達傳說」和「瑪利歐」
    await sql`
      INSERT INTO user_games (user_id, game_id, status) 
      VALUES (${user1.rows[0].id}, ${gameIds[0]}, 'wanted')
      ON CONFLICT (user_id, game_id) DO UPDATE SET status = EXCLUDED.status
    `;
    
    await sql`
      INSERT INTO user_games (user_id, game_id, status) 
      VALUES (${user1.rows[0].id}, ${gameIds[1]}, 'wanted')
      ON CONFLICT (user_id, game_id) DO UPDATE SET status = EXCLUDED.status
    `;

    // 用戶 2：持有「薩爾達傳說」，想要「寶可夢」
    await sql`
      INSERT INTO user_games (user_id, game_id, status) 
      VALUES (${user2.rows[0].id}, ${gameIds[0]}, 'owned')
      ON CONFLICT (user_id, game_id) DO UPDATE SET status = EXCLUDED.status
    `;
    
    await sql`
      INSERT INTO user_games (user_id, game_id, status) 
      VALUES (${user2.rows[0].id}, ${gameIds[2]}, 'wanted')
      ON CONFLICT (user_id, game_id) DO UPDATE SET status = EXCLUDED.status
    `;

    // 用戶 3：持有「瑪利歐」和「斯普拉遁」
    await sql`
      INSERT INTO user_games (user_id, game_id, status) 
      VALUES (${user3.rows[0].id}, ${gameIds[1]}, 'owned')
      ON CONFLICT (user_id, game_id) DO UPDATE SET status = EXCLUDED.status
    `;
    
    await sql`
      INSERT INTO user_games (user_id, game_id, status) 
      VALUES (${user3.rows[0].id}, ${gameIds[3]}, 'owned')
      ON CONFLICT (user_id, game_id) DO UPDATE SET status = EXCLUDED.status
    `;

    console.log('✅ 用戶遊戲關聯建立完成');

    // 顯示測試配對結果
    console.log('\n🎯 測試配對查詢...');
    
    // 模擬用戶 1 的配對查詢
    const matches = await sql`
      SELECT DISTINCT 
        u.id as player_id,
        u.email as player_email,
        u.name as player_name,
        g.title as game_title,
        wanted_g.title as wanted_game,
        owned.created_at
      FROM user_games owned
      JOIN users u ON owned.user_id = u.id
      JOIN games g ON owned.game_id = g.id
      JOIN user_games wanted ON wanted.user_id = ${user1.rows[0].id}
        AND wanted.status = 'wanted'
        AND wanted.game_id = owned.game_id
      JOIN games wanted_g ON wanted.game_id = wanted_g.id
      WHERE owned.status = 'owned' 
        AND owned.user_id != ${user1.rows[0].id}
      ORDER BY owned.created_at DESC
    `;

    console.log('🎉 配對結果:');
    matches.rows.forEach((match, index) => {
      console.log(`  ${index + 1}. ${match.player_name} (${match.player_email})`);
      console.log(`     持有: ${match.game_title}`);
      console.log(`     你想要: ${match.wanted_game}`);
      console.log('');
    });

    console.log('🌱 測試資料建立完成！');
    console.log('🚀 現在可以測試 PostgreSQL 配對功能了！');

  } catch (error) {
    console.error('❌ 建立測試資料失敗:', error);
    process.exit(1);
  }
}

seedTestData();