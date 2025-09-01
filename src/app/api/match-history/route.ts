import { NextRequest } from "next/server";
import { sql } from "@vercel/postgres";
import {
  verifyAuthTokenAndGetUser,
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/utils/api";

// DELETE /api/match-history - 刪除配對歷史記錄中的特定項目
export async function DELETE(request: NextRequest) {
  try {
    console.log("🗑️ 刪除配對歷史記錄項目...");

    // 身份驗證
    const authResult = await verifyAuthTokenAndGetUser(request);
    if (!authResult.user) {
      return createErrorResponse(authResult.error || "未經授權", 401);
    }

    const body = await request.json();
    const { playerId, gameId } = body;

    // 驗證必要參數
    if (!playerId || !gameId) {
      return createErrorResponse("playerId 和 gameId 為必填欄位", 400);
    }

    console.log("🔍 刪除歷史記錄項目參數:", { 
      userId: authResult.user.id, 
      playerId, 
      gameId 
    });

    // 獲取用戶的配對記錄
    const result = await sql`
      SELECT last_match_games, match_history 
      FROM user_matching_sessions 
      WHERE user_id = ${authResult.user.id}
    `;

    if (result.rows.length === 0) {
      return createErrorResponse("找不到用戶的配對記錄", 404);
    }

    const session = result.rows[0];
    let updatedLastMatchGames = null;
    let updatedMatchHistory = null;
    let itemRemoved = false;

    // 從 last_match_games 中移除項目
    if (session.last_match_games) {
      try {
        let lastMatchGames = Array.isArray(session.last_match_games) 
          ? session.last_match_games 
          : JSON.parse(session.last_match_games);
        
        const originalLength = lastMatchGames.length;
        lastMatchGames = lastMatchGames.filter(
          (item: any) => !(item.playerId == playerId && item.gameId == gameId)
        );
        
        if (lastMatchGames.length < originalLength) {
          itemRemoved = true;
          updatedLastMatchGames = lastMatchGames.length > 0 ? lastMatchGames : null;
          console.log("✅ 從 last_match_games 中移除項目");
        }
      } catch (error) {
        console.error("⚠️ 解析 last_match_games 失敗:", error);
      }
    }

    // 從 match_history 中移除項目
    if (session.match_history) {
      try {
        let matchHistory = Array.isArray(session.match_history) 
          ? session.match_history 
          : JSON.parse(session.match_history);
        
        const originalLength = matchHistory.length;
        matchHistory = matchHistory.filter(
          (item: any) => !(item.playerId == playerId && item.gameId == gameId)
        );
        
        if (matchHistory.length < originalLength) {
          itemRemoved = true;
          updatedMatchHistory = matchHistory.length > 0 ? matchHistory : null;
          console.log("✅ 從 match_history 中移除項目");
        }
      } catch (error) {
        console.error("⚠️ 解析 match_history 失敗:", error);
      }
    }

    if (!itemRemoved) {
      return createErrorResponse("找不到指定的歷史記錄項目", 404);
    }

    // 更新資料庫
    const updateResult = await sql`
      UPDATE user_matching_sessions 
      SET 
        last_match_games = ${updatedLastMatchGames ? JSON.stringify(updatedLastMatchGames) : null}::jsonb,
        match_history = ${updatedMatchHistory ? JSON.stringify(updatedMatchHistory) : null}::jsonb,
        updated_at = NOW() AT TIME ZONE 'Asia/Taipei'
      WHERE user_id = ${authResult.user.id}
      RETURNING *
    `;

    console.log("✅ 配對歷史記錄項目刪除成功");

    return createSuccessResponse(
      {
        message: "歷史記錄項目已刪除",
        updatedSession: updateResult.rows[0]
      },
      "配對歷史記錄項目刪除成功"
    );
  } catch (error) {
    console.error("💥 刪除配對歷史記錄項目錯誤:", error);
    return createErrorResponse("刪除歷史記錄項目失敗", 500);
  }
}

// OPTIONS - 處理 CORS 預檢請求
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}