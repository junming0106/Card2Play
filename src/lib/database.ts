import { sql } from "@vercel/postgres";

// 資料庫連接（自動從環境變數讀取 POSTGRES_URL）
export { sql } from "@vercel/postgres";

// 資料庫初始化腳本
export async function initializeDatabase() {
  try {
    console.log("🗄️ 開始初始化 PostgreSQL 資料庫...");

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
    console.log("✅ users 表建立完成");

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
    console.log("✅ games 表建立完成");

    // 建立 user_games 表
    await sql`
      CREATE TABLE IF NOT EXISTS user_games (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
        status VARCHAR(20) CHECK (status IN ('owned', 'wanted', '持有中', '想要交換', '已借出')) NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        notes TEXT,
        added_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, game_id)
      )
    `;
    console.log("✅ user_games 表建立完成");

    // 擴展現有 user_games 表結構（如果需要）
    try {
      await sql`ALTER TABLE user_games ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5)`;
      await sql`ALTER TABLE user_games ADD COLUMN IF NOT EXISTS notes TEXT`;
      await sql`ALTER TABLE user_games ADD COLUMN IF NOT EXISTS added_at TIMESTAMP DEFAULT NOW()`;

      // 更新 status 欄位約束以支援中文狀態
      await sql`
        ALTER TABLE user_games DROP CONSTRAINT IF EXISTS user_games_status_check;
        ALTER TABLE user_games ADD CONSTRAINT user_games_status_check 
        CHECK (status IN ('owned', 'wanted', '持有中', '想要交換', '已借出'));
      `;
      console.log("✅ user_games 表結構更新完成");
    } catch (error) {
      console.log(
        "⚠️ user_games 表結構更新跳過（可能已存在）:",
        (error as Error).message
      );
    }

    // 建立配對優化索引
    await sql`CREATE INDEX IF NOT EXISTS idx_user_games_status_game ON user_games(status, game_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_games_user_status ON user_games(user_id, status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_games_title ON games(title)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)`;

    console.log("✅ 索引建立完成");
    console.log("🎉 PostgreSQL 資料庫初始化完成！");

    return { success: true };
  } catch (error) {
    console.error("❌ 資料庫初始化失敗:", error);
    return { success: false, error };
  }
}

// 用戶相關查詢
export async function createOrUpdateUser(
  googleId: string,
  email: string,
  name?: string,
  avatarUrl?: string
) {
  // 輸入驗證
  if (!googleId || !email) {
    throw new Error('googleId 和 email 為必填欄位')
  }

  // 清理輸入資料
  const cleanGoogleId = googleId.trim()
  const cleanEmail = email.trim().toLowerCase()
  const cleanName = name?.trim() || null
  const cleanAvatarUrl = avatarUrl?.trim() || null

  // 基本格式驗證
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    console.warn('⚠️ 電子郵件格式可能不正確:', cleanEmail)
    // 不阻止建立，因為可能是特殊情況
  }

  try {
    console.log('📝 建立/更新用戶:', { 
      googleId: cleanGoogleId, 
      email: cleanEmail, 
      name: cleanName 
    })

    const result = await sql`
      INSERT INTO users (google_id, email, name, avatar_url, created_at, updated_at)
      VALUES (${cleanGoogleId}, ${cleanEmail}, ${cleanName}, ${cleanAvatarUrl}, NOW(), NOW())
      ON CONFLICT (google_id) 
      DO UPDATE SET 
        email = EXCLUDED.email,
        name = COALESCE(NULLIF(EXCLUDED.name, ''), users.name),
        avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), users.avatar_url),
        updated_at = NOW()
      RETURNING *
    `;

    if (result.rows.length === 0) {
      throw new Error('用戶建立/更新操作未返回結果')
    }

    const user = result.rows[0]
    console.log('✅ 用戶建立/更新成功:', { 
      id: user.id, 
      email: user.email, 
      name: user.name,
      isNew: user.created_at === user.updated_at 
    })

    return user
  } catch (error) {
    console.error('❌ 用戶建立/更新失敗:', {
      googleId: cleanGoogleId,
      email: cleanEmail,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    // 檢查是否是唯一約束衝突
    if (error instanceof Error && error.message.includes('unique')) {
      console.log('🔄 檢測到唯一約束衝突，嘗試查詢現有用戶')
      try {
        const existingUser = await getUserByGoogleId(cleanGoogleId)
        if (existingUser) {
          console.log('✅ 找到現有用戶，返回現有資料')
          return existingUser
        }
      } catch (queryError) {
        console.error('❌ 查詢現有用戶失敗:', queryError)
      }
    }

    throw error
  }
}

export async function getUserByGoogleId(googleId: string) {
  if (!googleId) {
    throw new Error('googleId 為必填欄位')
  }

  const cleanGoogleId = googleId.trim()
  
  try {
    console.log('🔍 查詢用戶:', cleanGoogleId)
    const result = await sql`
      SELECT * FROM users WHERE google_id = ${cleanGoogleId}
    `;
    
    const user = result.rows[0] || null
    if (user) {
      console.log('✅ 找到用戶:', { id: user.id, email: user.email })
    } else {
      console.log('⚠️ 未找到用戶:', cleanGoogleId)
    }
    
    return user
  } catch (error) {
    console.error('❌ 用戶查詢失敗:', {
      googleId: cleanGoogleId,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

// 刪除用戶及其相關資料
export async function deleteUser(userId: number) {
  try {
    console.log("🗑️ 開始刪除用戶及相關資料，用戶 ID:", userId);
    
    // 由於 user_games 表設定了 ON DELETE CASCADE，
    // 刪除用戶時會自動刪除相關的遊戲收藏記錄
    const result = await sql`
      DELETE FROM users WHERE id = ${userId}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      console.log("⚠️ 找不到要刪除的用戶:", userId);
      return null;
    }

    const deletedUser = result.rows[0];
    console.log("✅ 用戶刪除成功:", {
      id: deletedUser.id,
      email: deletedUser.email,
      name: deletedUser.name
    });

    return deletedUser;
  } catch (error) {
    console.error("❌ 用戶刪除失敗:", error);
    throw error;
  }
}

// 根據 Google ID 刪除用戶
export async function deleteUserByGoogleId(googleId: string) {
  try {
    console.log("🗑️ 根據 Google ID 刪除用戶:", googleId);
    
    // 先查找用戶
    const user = await getUserByGoogleId(googleId);
    if (!user) {
      console.log("⚠️ 找不到要刪除的用戶:", googleId);
      return null;
    }

    // 刪除用戶
    return await deleteUser(user.id);
  } catch (error) {
    console.error("❌ 根據 Google ID 刪除用戶失敗:", error);
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
    console.error("❌ 遊戲建立失敗:", error);
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
    console.error("❌ 遊戲查詢失敗:", error);
    throw error;
  }
}

// 根據標題尋找或建立遊戲
export async function findOrCreateGameByTitle(title: string) {
  try {
    // 先嘗試找到現有遊戲
    let game = await findGameByTitle(title);

    if (!game) {
      // 如果沒有找到，建立新遊戲
      const result = await sql`
        INSERT INTO games (title, publisher, is_custom)
        VALUES (${title}, 'Nintendo', false)
        RETURNING *
      `;
      game = result.rows[0];
      console.log("✅ 建立新遊戲:", title);
    }

    return game;
  } catch (error) {
    console.error("❌ 尋找或建立遊戲失敗:", error);
    throw error;
  }
}

// 用戶遊戲關聯查詢
export async function getUserGames(
  userId: number,
  status?: "owned" | "wanted" | "持有中" | "想要交換" | "已借出"
) {
  try {
    let result;
    if (status) {
      result = await sql`
        SELECT ug.*, g.title, g.publisher, g.image_url, g.custom_title, g.custom_publisher, g.is_custom
        FROM user_games ug
        JOIN games g ON ug.game_id = g.id
        WHERE ug.user_id = ${userId} AND ug.status = ${status}
        ORDER BY ug.added_at DESC, ug.created_at DESC
      `;
    } else {
      result = await sql`
        SELECT ug.*, g.title, g.publisher, g.image_url, g.custom_title, g.custom_publisher, g.is_custom
        FROM user_games ug
        JOIN games g ON ug.game_id = g.id
        WHERE ug.user_id = ${userId}
        ORDER BY ug.added_at DESC, ug.created_at DESC
      `;
    }
    return result.rows;
  } catch (error) {
    console.error("❌ 用戶遊戲查詢失敗:", error);
    throw error;
  }
}

export async function addUserGame(
  userId: number,
  gameId: number,
  status: "owned" | "wanted" | "持有中" | "想要交換" | "已借出",
  rating?: number,
  notes?: string
) {
  try {
    const result = await sql`
      INSERT INTO user_games (user_id, game_id, status, rating, notes, added_at)
      VALUES (${userId}, ${gameId}, ${status}, ${rating || null}, ${
      notes || null
    }, NOW())
      ON CONFLICT (user_id, game_id) 
      DO UPDATE SET 
        status = EXCLUDED.status, 
        rating = EXCLUDED.rating,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    console.error("❌ 用戶遊戲新增失敗:", error);
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
    console.error("❌ 用戶遊戲移除失敗:", error);
    throw error;
  }
}

// 自定義遊戲相關查詢
export async function createCustomGame(
  userId: number,
  gameData: {
    title: string;
    customTitle?: string;
    customPublisher?: string;
    publisher?: string;
    releaseDate?: string;
    imageUrl?: string;
  }
) {
  try {
    const result = await sql`
      INSERT INTO games (title, publisher, release_date, image_url, custom_title, custom_publisher, is_custom)
      VALUES (
        ${gameData.title}, 
        ${gameData.publisher || gameData.customPublisher || "未知"}, 
        ${gameData.releaseDate || null}, 
        ${gameData.imageUrl || null},
        ${gameData.customTitle || gameData.title},
        ${gameData.customPublisher || "未知"},
        true
      )
      RETURNING *
    `;

    const game = result.rows[0];

    // 同時將遊戲加入用戶收藏為「持有中」
    await addUserGame(userId, game.id, "owned");

    return game;
  } catch (error) {
    console.error("❌ 自定義遊戲建立失敗:", error);
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
    console.error("❌ 用戶自定義遊戲查詢失敗:", error);
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
      throw new Error("找不到指定的自定義遊戲或無權限刪除");
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
    console.error("❌ 自定義遊戲刪除失敗:", error);
    throw error;
  }
}

// 收藏統計查詢
export async function getUserGameStats(userId: number) {
  try {
    const result = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = '持有中' THEN 1 END) as owned_count,
        COUNT(CASE WHEN status = '想要交換' THEN 1 END) as wanted_count,
        COUNT(CASE WHEN status = '已借出' THEN 1 END) as lent_count,
        COUNT(CASE WHEN is_custom = true THEN 1 END) as custom_count
      FROM user_games ug
      JOIN games g ON ug.game_id = g.id
      WHERE ug.user_id = ${userId}
    `;

    const stats = result.rows[0];
    return {
      total: parseInt(stats.total),
      持有中: parseInt(stats.owned_count),
      想要交換: parseInt(stats.wanted_count),
      已借出: parseInt(stats.lent_count),
      customGames: parseInt(stats.custom_count),
    };
  } catch (error) {
    console.error("❌ 用戶遊戲統計查詢失敗:", error);
    throw error;
  }
}

// 更新用戶遊戲
export async function updateUserGame(
  userId: number,
  gameId: number,
  updates: {
    status?: "持有中" | "想要交換" | "已借出";
    rating?: number;
    notes?: string;
  }
) {
  try {
    // 動態建立更新查詢
    if (
      updates.status &&
      updates.rating !== undefined &&
      updates.notes !== undefined
    ) {
      const result = await sql`
        UPDATE user_games 
        SET status = ${updates.status}, rating = ${updates.rating}, notes = ${updates.notes}, updated_at = NOW()
        WHERE user_id = ${userId} AND game_id = ${gameId}
        RETURNING *
      `;
      return result.rows[0];
    } else if (updates.status && updates.rating !== undefined) {
      const result = await sql`
        UPDATE user_games 
        SET status = ${updates.status}, rating = ${updates.rating}, updated_at = NOW()
        WHERE user_id = ${userId} AND game_id = ${gameId}
        RETURNING *
      `;
      return result.rows[0];
    } else if (updates.status && updates.notes !== undefined) {
      const result = await sql`
        UPDATE user_games 
        SET status = ${updates.status}, notes = ${updates.notes}, updated_at = NOW()
        WHERE user_id = ${userId} AND game_id = ${gameId}
        RETURNING *
      `;
      return result.rows[0];
    } else if (updates.status) {
      const result = await sql`
        UPDATE user_games 
        SET status = ${updates.status}, updated_at = NOW()
        WHERE user_id = ${userId} AND game_id = ${gameId}
        RETURNING *
      `;
      return result.rows[0];
    } else if (updates.rating !== undefined && updates.notes !== undefined) {
      const result = await sql`
        UPDATE user_games 
        SET rating = ${updates.rating}, notes = ${updates.notes}, updated_at = NOW()
        WHERE user_id = ${userId} AND game_id = ${gameId}
        RETURNING *
      `;
      return result.rows[0];
    } else if (updates.rating !== undefined) {
      const result = await sql`
        UPDATE user_games 
        SET rating = ${updates.rating}, updated_at = NOW()
        WHERE user_id = ${userId} AND game_id = ${gameId}
        RETURNING *
      `;
      return result.rows[0];
    } else if (updates.notes !== undefined) {
      const result = await sql`
        UPDATE user_games 
        SET notes = ${updates.notes}, updated_at = NOW()
        WHERE user_id = ${userId} AND game_id = ${gameId}
        RETURNING *
      `;
      return result.rows[0];
    } else {
      throw new Error("沒有提供有效的更新欄位");
    }
  } catch (error) {
    console.error("❌ 用戶遊戲更新失敗:", error);
    throw error;
  }
}

// 遊戲卡交換配對查詢 - 核心功能
export async function findGameMatches(userId: number, limit = 3) {
  try {
    console.log("🎯 開始遊戲卡配對，用戶 ID:", userId);

    // 配對邏輯：找到用戶「想要交換」的遊戲，配對其他用戶「持有」的同款遊戲
    const result = await sql`
      SELECT DISTINCT 
        holder.user_id as holder_id,
        holder_user.email as holder_email,
        holder_user.name as holder_name,
        game.title as game_title,
        game.id as game_id,
        holder.created_at as holder_added_at
      FROM user_games seeker
      JOIN games game ON seeker.game_id = game.id
      JOIN user_games holder ON holder.game_id = seeker.game_id
      JOIN users holder_user ON holder.user_id = holder_user.id
      WHERE seeker.user_id = ${userId}
        AND seeker.status = '想要交換'
        AND holder.status = '持有中'
        AND holder.user_id != ${userId}
      ORDER BY holder.created_at DESC
      LIMIT ${limit}
    `;

    console.log("🎯 找到", result.rows.length, "個配對結果");

    return result.rows;
  } catch (error) {
    console.error("❌ 配對查詢失敗:", error);
    throw error;
  }
}

// 反向配對查詢：找到想要我持有遊戲的用戶
export async function findReversematches(userId: number, limit = 3) {
  try {
    console.log("🔄 開始反向配對，用戶 ID:", userId);

    // 反向邏輯：找到其他用戶「想要交換」我「持有」的遊戲
    const result = await sql`
      SELECT DISTINCT 
        seeker.user_id as seeker_id,
        seeker_user.email as seeker_email,
        seeker_user.name as seeker_name,
        game.title as game_title,
        game.id as game_id,
        seeker.created_at as seeker_added_at
      FROM user_games holder
      JOIN games game ON holder.game_id = game.id
      JOIN user_games seeker ON seeker.game_id = holder.game_id
      JOIN users seeker_user ON seeker.user_id = seeker_user.id
      WHERE holder.user_id = ${userId}
        AND holder.status = '持有中'
        AND seeker.status = '想要交換'
        AND seeker.user_id != ${userId}
      ORDER BY seeker.created_at DESC
      LIMIT ${limit}
    `;

    console.log("🔄 找到", result.rows.length, "個反向配對結果");

    return result.rows;
  } catch (error) {
    console.error("❌ 反向配對查詢失敗:", error);
    throw error;
  }
}
