import { NextRequest } from "next/server";
import { sql } from "@vercel/postgres";
import {
  verifyAuthTokenAndGetUser,
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/utils/api";

// POST /api/notifications - 創建交換通知
export async function POST(request: NextRequest) {
  try {
    console.log("📧 創建交換通知...");

    // 身份驗證
    const authResult = await verifyAuthTokenAndGetUser(request);
    if (!authResult.user) {
      return createErrorResponse(authResult.error || "未經授權", 401);
    }

    const body = await request.json();
    const { targetUserId, gameId, gameTitle, message } = body;

    // 驗證必要參數
    if (!targetUserId || !gameId || !gameTitle) {
      return createErrorResponse(
        "targetUserId, gameId 和 gameTitle 為必填欄位",
        400
      );
    }

    console.log("📧 創建交換通知參數:", {
      fromUserId: authResult.user.id,
      fromUserName: authResult.user.name,
      fromUserEmail: authResult.user.email,
      targetUserId,
      gameId,
      gameTitle,
      message,
    });

    // 確保通知表存在
    await sql`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id SERIAL PRIMARY KEY,
        target_user_id INTEGER NOT NULL,
        from_user_id INTEGER NOT NULL,
        from_user_name VARCHAR(255) NOT NULL,
        from_user_email VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'trade_request',
        game_id INTEGER,
        game_title VARCHAR(255),
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT (NOW()),
        updated_at TIMESTAMP DEFAULT (NOW())
      )
    `;

    // 插入通知記錄
    const result = await sql`
      INSERT INTO user_notifications (
        target_user_id,
        from_user_id, 
        from_user_name,
        from_user_email,
        type,
        game_id,
        game_title,
        message,
        created_at,
        updated_at
      ) VALUES (
        ${targetUserId},
        ${authResult.user.id},
        ${authResult.user.name},
        ${authResult.user.email},
        'trade_request',
        ${gameId},
        ${gameTitle},
        ${message || `${authResult.user.name} 想要與你交換「${gameTitle}」`},
        NOW(),
        NOW()
      )
      RETURNING *, 
        created_at AT TIME ZONE 'Asia/Taipei' as created_at_tw,
        updated_at AT TIME ZONE 'Asia/Taipei' as updated_at_tw
    `;

    const notification = result.rows[0];
    console.log("✅ 交換通知創建成功:", notification.id);

    // 同時在對方的 match_history 中記錄（如果需要的話）
    try {
      // 獲取台北當前時間
      const taipeiTimeResult = await sql`SELECT NOW() as taipei_time`;
      const taipeiTime = taipeiTimeResult.rows[0].taipei_time;

      // 獲取目標用戶的 matching session
      const sessionResult = await sql`
        SELECT * FROM user_matching_sessions 
        WHERE user_id = ${targetUserId}
      `;

      if (sessionResult.rows.length > 0) {
        const session = sessionResult.rows[0];
        let currentHistory = [];

        // 解析現有的 match_history
        if (session.match_history) {
          try {
            currentHistory = Array.isArray(session.match_history)
              ? session.match_history
              : JSON.parse(session.match_history);
          } catch (e) {
            console.warn("解析 match_history 失敗:", e);
            currentHistory = [];
          }
        }

        // 添加新的交換邀請記錄
        const newTradeRequest = {
          gameId: parseInt(gameId),
          playerId: authResult.user.id,
          gameTitle,
          matchType: "seeking",
          matchedAt: taipeiTime,
          playerName: authResult.user.name,
          playerEmail: authResult.user.email,
          isTradeRequest: true, // 標記為交換邀請
          notificationId: notification.id, // 關聯通知ID
        };

        currentHistory.unshift(newTradeRequest); // 添加到最前面

        // 限制歷史記錄數量（保留最新100筆）
        if (currentHistory.length > 100) {
          currentHistory = currentHistory.slice(0, 100);
        }

        // 更新 match_history
        await sql`
          UPDATE user_matching_sessions 
          SET 
            match_history = ${JSON.stringify(currentHistory)}::jsonb,
            updated_at = NOW()
          WHERE user_id = ${targetUserId}
        `;

        console.log("✅ 同步更新目標用戶的 match_history");
      } else {
        // 如果目標用戶還沒有 matching session，創建一個
        await sql`
          INSERT INTO user_matching_sessions (
            user_id, 
            session_start, 
            matches_used, 
            match_history
          ) VALUES (
            ${targetUserId},
            NOW(),
            0,
            ${JSON.stringify([
              {
                gameId: parseInt(gameId),
                playerId: authResult.user.id,
                gameTitle,
                matchType: "seeking",
                matchedAt: taipeiTime,
                playerName: authResult.user.name,
                playerEmail: authResult.user.email,
                isTradeRequest: true,
                notificationId: notification.id,
              },
            ])}::jsonb
          )
          ON CONFLICT (user_id) DO UPDATE SET
            match_history = ${JSON.stringify([
              {
                gameId: parseInt(gameId),
                playerId: authResult.user.id,
                gameTitle,
                matchType: "seeking",
                matchedAt: taipeiTime,
                playerName: authResult.user.name,
                playerEmail: authResult.user.email,
                isTradeRequest: true,
                notificationId: notification.id,
              },
            ])}::jsonb,
            updated_at = NOW()
        `;

        console.log("✅ 創建目標用戶的 matching session 並添加交換邀請");
      }
    } catch (historyError) {
      console.error(
        "⚠️ 更新 match_history 失敗，但通知創建成功:",
        historyError
      );
    }

    return createSuccessResponse(
      {
        notification,
        message: "交換通知已發送",
      },
      "交換通知創建成功"
    );
  } catch (error) {
    console.error("💥 創建交換通知錯誤:", error);
    return createErrorResponse("創建交換通知失敗", 500);
  }
}

// GET /api/notifications - 獲取用戶通知列表
export async function GET(request: NextRequest) {
  try {
    console.log("📋 獲取用戶通知列表...");

    // 身份驗證
    const authResult = await verifyAuthTokenAndGetUser(request);
    if (!authResult.user) {
      return createErrorResponse(authResult.error || "未經授權", 401);
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread_only") === "true";

    // 構建查詢
    let result;
    if (unreadOnly) {
      result = await sql`
        SELECT *,
          created_at AT TIME ZONE 'Asia/Taipei' as created_at_tw,
          updated_at AT TIME ZONE 'Asia/Taipei' as updated_at_tw
        FROM user_notifications 
        WHERE target_user_id = ${authResult.user.id} AND is_read = FALSE
        ORDER BY created_at DESC
        LIMIT 50
      `;
    } else {
      result = await sql`
        SELECT *,
          created_at AT TIME ZONE 'Asia/Taipei' as created_at_tw,
          updated_at AT TIME ZONE 'Asia/Taipei' as updated_at_tw
        FROM user_notifications 
        WHERE target_user_id = ${authResult.user.id}
        ORDER BY created_at DESC
        LIMIT 50
      `;
    }
    const notifications = result.rows;

    console.log("✅ 找到通知記錄:", notifications.length, "筆");

    return createSuccessResponse(
      {
        notifications,
        unreadCount: notifications.filter((n) => !n.is_read).length,
        user: {
          id: authResult.user.id,
          name: authResult.user.name,
          email: authResult.user.email,
        },
      },
      `找到 ${notifications.length} 筆通知記錄`
    );
  } catch (error) {
    console.error("💥 獲取通知列表錯誤:", error);
    return createErrorResponse("獲取通知列表失敗", 500);
  }
}

// OPTIONS - 處理 CORS 預檢請求
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
