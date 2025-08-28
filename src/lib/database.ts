import { sql } from '@vercel/postgres';

// 資料庫連接（自動從環境變數讀取 POSTGRES_URL）
export { sql } from '@vercel/postgres';

// 資料庫初始化腳本
export async function initializeDatabase() {
  try {
    console.log('🗄️ 開始初始化 PostgreSQL 資料庫...');

    // 建立 users 表
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ users 表建立完成');

    // 建立 games 表
    await sql`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        publisher VARCHAR(255),
        release_date DATE,
        image_url TEXT,
        custom_title VARCHAR(500),
        custom_publisher VARCHAR(255),
        is_custom BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ games 表建立完成');

    // 建立 user_games 表
    await sql`
      CREATE TABLE IF NOT EXISTS user_games (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
        status VARCHAR(20) CHECK (status IN ('owned', 'wanted')) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, game_id)
      )
    `;
    console.log('✅ user_games 表建立完成');

    // 建立配對優化索引
    await sql`CREATE INDEX IF NOT EXISTS idx_user_games_status_game ON user_games(status, game_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_games_user_status ON user_games(user_id, status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_games_title ON games(title)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)`;
    
    console.log('✅ 索引建立完成');
    console.log('🎉 PostgreSQL 資料庫初始化完成！');

    return { success: true };
  } catch (error) {
    console.error('❌ 資料庫初始化失敗:', error);
    return { success: false, error };
  }
}

// 用戶相關查詢
export async function createOrUpdateUser(googleId: string, email: string, name?: string, avatarUrl?: string) {
  try {
    const result = await sql`
      INSERT INTO users (google_id, email, name, avatar_url)
      VALUES (${googleId}, ${email}, ${name || null}, ${avatarUrl || null})
      ON CONFLICT (google_id) 
      DO UPDATE SET 
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW()
      RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    console.error('❌ 用戶建立/更新失敗:', error);
    throw error;
  }
}

export async function getUserByGoogleId(googleId: string) {
  try {
    const result = await sql`
      SELECT * FROM users WHERE google_id = ${googleId}
    `;
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ 用戶查詢失敗:', error);
    throw error;
  }
}

// 遊戲相關查詢
export async function createGame(gameData: {
  title: string;
  publisher?: string;
  releaseDate?: string;
  imageUrl?: string;
  customTitle?: string;
  customPublisher?: string;
  isCustom?: boolean;
}) {
  try {
    const result = await sql`
      INSERT INTO games (title, publisher, release_date, image_url, custom_title, custom_publisher, is_custom)
      VALUES (
        ${gameData.title}, 
        ${gameData.publisher || null}, 
        ${gameData.releaseDate || null}, 
        ${gameData.imageUrl || null},
        ${gameData.customTitle || null},
        ${gameData.customPublisher || null},
        ${gameData.isCustom || false}
      )
      ON CONFLICT DO NOTHING
      RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    console.error('❌ 遊戲建立失敗:', error);
    throw error;
  }
}

export async function findGameByTitle(title: string) {
  try {
    const result = await sql`
      SELECT * FROM games WHERE title = ${title} LIMIT 1
    `;
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ 遊戲查詢失敗:', error);
    throw error;
  }
}

// 用戶遊戲關聯查詢
export async function getUserGames(userId: number, status?: 'owned' | 'wanted') {
  try {
    let result;
    if (status) {
      result = await sql`
        SELECT ug.*, g.title, g.publisher, g.image_url, g.custom_title, g.custom_publisher, g.is_custom
        FROM user_games ug
        JOIN games g ON ug.game_id = g.id
        WHERE ug.user_id = ${userId} AND ug.status = ${status}
        ORDER BY ug.created_at DESC
      `;
    } else {
      result = await sql`
        SELECT ug.*, g.title, g.publisher, g.image_url, g.custom_title, g.custom_publisher, g.is_custom
        FROM user_games ug
        JOIN games g ON ug.game_id = g.id
        WHERE ug.user_id = ${userId}
        ORDER BY ug.created_at DESC
      `;
    }
    return result.rows;
  } catch (error) {
    console.error('❌ 用戶遊戲查詢失敗:', error);
    throw error;
  }
}

export async function addUserGame(userId: number, gameId: number, status: 'owned' | 'wanted') {
  try {
    const result = await sql`
      INSERT INTO user_games (user_id, game_id, status)
      VALUES (${userId}, ${gameId}, ${status})
      ON CONFLICT (user_id, game_id) 
      DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
      RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    console.error('❌ 用戶遊戲新增失敗:', error);
    throw error;
  }
}

export async function removeUserGame(userId: number, gameId: number) {
  try {
    const result = await sql`
      DELETE FROM user_games 
      WHERE user_id = ${userId} AND game_id = ${gameId}
      RETURNING *
    `;
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ 用戶遊戲移除失敗:', error);
    throw error;
  }
}

// 自定義遊戲相關查詢
export async function createCustomGame(userId: number, gameData: {
  title: string;
  customTitle?: string;
  customPublisher?: string;
  publisher?: string;
  releaseDate?: string;
  imageUrl?: string;
}) {
  try {
    const result = await sql`
      INSERT INTO games (title, publisher, release_date, image_url, custom_title, custom_publisher, is_custom)
      VALUES (
        ${gameData.title}, 
        ${gameData.publisher || gameData.customPublisher || '未知'}, 
        ${gameData.releaseDate || null}, 
        ${gameData.imageUrl || null},
        ${gameData.customTitle || gameData.title},
        ${gameData.customPublisher || '未知'},
        true
      )
      RETURNING *
    `;
    
    const game = result.rows[0];
    
    // 同時將遊戲加入用戶收藏為「持有中」
    await addUserGame(userId, game.id, 'owned');
    
    return game;
  } catch (error) {
    console.error('❌ 自定義遊戲建立失敗:', error);
    throw error;
  }
}

export async function getUserCustomGames(userId: number) {
  try {
    const result = await sql`
      SELECT g.*, ug.status, ug.created_at as added_at
      FROM games g
      JOIN user_games ug ON g.id = ug.game_id
      WHERE ug.user_id = ${userId} AND g.is_custom = true
      ORDER BY ug.created_at DESC
    `;
    return result.rows;
  } catch (error) {
    console.error('❌ 用戶自定義遊戲查詢失敗:', error);
    throw error;
  }
}

export async function deleteCustomGame(userId: number, gameId: number) {
  try {
    // 首先檢查遊戲是否為自定義遊戲且屬於該用戶
    const gameCheck = await sql`
      SELECT g.* FROM games g
      JOIN user_games ug ON g.id = ug.game_id
      WHERE g.id = ${gameId} AND g.is_custom = true AND ug.user_id = ${userId}
    `;
    
    if (gameCheck.rows.length === 0) {
      throw new Error('找不到指定的自定義遊戲或無權限刪除');
    }
    
    const game = gameCheck.rows[0];
    
    // 刪除用戶遊戲關聯（這會觸發 CASCADE 刪除）
    await sql`
      DELETE FROM user_games 
      WHERE user_id = ${userId} AND game_id = ${gameId}
    `;
    
    // 檢查是否還有其他用戶使用這個自定義遊戲
    const otherUsers = await sql`
      SELECT COUNT(*) as count FROM user_games WHERE game_id = ${gameId}
    `;
    
    // 如果沒有其他用戶使用，則刪除遊戲記錄
    if (otherUsers.rows[0].count == 0) {
      await sql`
        DELETE FROM games WHERE id = ${gameId} AND is_custom = true
      `;
    }
    
    return game;
  } catch (error) {
    console.error('❌ 自定義遊戲刪除失敗:', error);
    throw error;
  }
}

// 配對查詢（超高效！）
export async function findGameMatches(userId: number, limit = 3) {
  try {
    const result = await sql`
      SELECT DISTINCT 
        u.id as player_id,
        u.email as player_email,
        u.name as player_name,
        g.title as game_title,
        wanted_g.title as wanted_game,
        g.image_url,
        g.publisher,
        owned.created_at
      FROM user_games owned
      JOIN users u ON owned.user_id = u.id
      JOIN games g ON owned.game_id = g.id
      JOIN user_games wanted ON wanted.user_id = ${userId}
        AND wanted.status = 'wanted'
        AND wanted.game_id = owned.game_id
      JOIN games wanted_g ON wanted.game_id = wanted_g.id
      WHERE owned.status = 'owned' 
        AND owned.user_id != ${userId}
      ORDER BY owned.created_at DESC
      LIMIT 3
    `;
    
    return result.rows.slice(0, limit);
  } catch (error) {
    console.error('❌ 配對查詢失敗:', error);
    throw error;
  }
}