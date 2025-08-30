import { NextRequest } from "next/server";
import { sql } from "@vercel/postgres";
import {
  verifyAuthTokenAndGetUser,
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/utils/api";

// GET /api/match-sessions/[id] - 查詢特定配對記錄詳情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("🔍 查詢特定配對記錄詳情:", params.id);

    // 身份驗證
    const authResult = await verifyAuthTokenAndGetUser(request);
    if (!authResult.user) {
      return createErrorResponse(authResult.error || "未經授權", 401);
    }

    const matchSessionId = parseInt(params.id);
    if (isNaN(matchSessionId)) {
      return createErrorResponse("無效的配對記錄 ID", 400);
    }

    // 查詢配對記錄詳情，確保用戶有權限查看
    const result = await sql`
      SELECT 
        ms.*,
        g.title as game_title,
        g.publisher as game_publisher,
        g.image_url as game_image,
        g.custom_title,
        g.custom_publisher,
        g.is_custom,
        wu.name as wanter_name,
        wu.email as wanter_email,
        wu.avatar_url as wanter_avatar,
        hu.name as holder_name,
        hu.email as holder_email,
        hu.avatar_url as holder_avatar
      FROM user_match_sessions ms
      JOIN games g ON ms.game_id = g.id
      JOIN users wu ON ms.wanter_user_id = wu.id
      JOIN users hu ON ms.holder_user_id = hu.id
      WHERE ms.id = ${matchSessionId}
        AND (ms.wanter_user_id = ${authResult.user.id} OR ms.holder_user_id = ${authResult.user.id})
    `;

    if (result.rows.length === 0) {
      return createErrorResponse("找不到配對記錄或無權限查看", 404);
    }

    const matchSession = result.rows[0];

    console.log("✅ 找到配對記錄詳情:", {
      id: matchSession.id,
      gameTitle: matchSession.game_title,
      status: matchSession.status
    });

    return createSuccessResponse(
      {
        matchSession,
        userRole: matchSession.wanter_user_id === authResult.user.id ? "wanter" : "holder"
      },
      "配對記錄詳情查詢成功"
    );
  } catch (error) {
    console.error("💥 查詢配對記錄詳情錯誤:", error);
    return createErrorResponse("查詢配對記錄詳情失敗", 500);
  }
}

// DELETE /api/match-sessions/[id] - 刪除配對記錄（取消配對）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("🗑️ 刪除配對記錄:", params.id);

    // 身份驗證
    const authResult = await verifyAuthTokenAndGetUser(request);
    if (!authResult.user) {
      return createErrorResponse(authResult.error || "未經授權", 401);
    }

    const matchSessionId = parseInt(params.id);
    if (isNaN(matchSessionId)) {
      return createErrorResponse("無效的配對記錄 ID", 400);
    }

    // 檢查用戶是否有權限刪除（只有想要方可以刪除）
    const checkResult = await sql`
      SELECT * FROM user_match_sessions
      WHERE id = ${matchSessionId} AND wanter_user_id = ${authResult.user.id}
    `;

    if (checkResult.rows.length === 0) {
      return createErrorResponse("找不到配對記錄或無權限刪除", 404);
    }

    // 刪除配對記錄
    const result = await sql`
      DELETE FROM user_match_sessions
      WHERE id = ${matchSessionId}
      RETURNING *
    `;

    const deletedSession = result.rows[0];
    console.log("✅ 配對記錄刪除成功:", deletedSession.id);

    return createSuccessResponse(
      {
        deletedSession,
        message: "配對記錄已刪除"
      },
      "配對記錄刪除成功"
    );
  } catch (error) {
    console.error("💥 刪除配對記錄錯誤:", error);
    return createErrorResponse("刪除配對記錄失敗", 500);
  }
}

// OPTIONS - 處理 CORS 預檢請求
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}