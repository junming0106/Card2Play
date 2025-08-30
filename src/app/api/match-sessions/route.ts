import { NextRequest } from "next/server";
import { 
  createMatchSession, 
  getUserMatchSessions, 
  updateMatchSessionStatus 
} from "@/lib/database";
import {
  verifyAuthTokenAndGetUser,
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/utils/api";

// POST /api/match-sessions - 創建配對成功記錄
export async function POST(request: NextRequest) {
  try {
    console.log("🎯 創建配對成功記錄...");

    // 身份驗證
    const authResult = await verifyAuthTokenAndGetUser(request);
    if (!authResult.user) {
      return createErrorResponse(authResult.error || "未經授權", 401);
    }

    const body = await request.json();
    const { holderUserId, gameId, notes } = body;

    // 驗證必要參數
    if (!holderUserId || !gameId) {
      return createErrorResponse("holderUserId 和 gameId 為必填欄位", 400);
    }

    // 確保 wanterUserId 是當前用戶（配對記錄只記錄在想要用戶下）
    const wanterUserId = authResult.user.id;

    const matchSession = await createMatchSession(
      wanterUserId,
      holderUserId,
      gameId,
      notes
    );

    console.log("✅ 配對成功記錄創建完成:", matchSession.id);

    return createSuccessResponse(
      {
        matchSession,
        message: "配對成功記錄已創建"
      },
      "配對成功記錄創建成功"
    );
  } catch (error) {
    console.error("💥 創建配對成功記錄錯誤:", error);
    return createErrorResponse("創建配對記錄失敗", 500);
  }
}

// GET /api/match-sessions - 查詢用戶配對記錄
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 查詢用戶配對記錄...");

    // 身份驗證
    const authResult = await verifyAuthTokenAndGetUser(request);
    if (!authResult.user) {
      return createErrorResponse(authResult.error || "未經授權", 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const matchSessions = await getUserMatchSessions(
      authResult.user.id,
      status || undefined
    );

    console.log("✅ 找到配對記錄:", matchSessions.length, "筆");

    return createSuccessResponse(
      {
        matchSessions,
        user: {
          id: authResult.user.id,
          name: authResult.user.name,
          email: authResult.user.email,
        },
        filters: {
          status: status || "all"
        }
      },
      `找到 ${matchSessions.length} 筆配對記錄`
    );
  } catch (error) {
    console.error("💥 查詢配對記錄錯誤:", error);
    return createErrorResponse("查詢配對記錄失敗", 500);
  }
}

// PATCH /api/match-sessions - 更新配對記錄狀態
export async function PATCH(request: NextRequest) {
  try {
    console.log("🔄 更新配對記錄狀態...");

    // 身份驗證
    const authResult = await verifyAuthTokenAndGetUser(request);
    if (!authResult.user) {
      return createErrorResponse(authResult.error || "未經授權", 401);
    }

    const body = await request.json();
    const { matchSessionId, status, notes } = body;

    // 驗證必要參數
    if (!matchSessionId || !status) {
      return createErrorResponse("matchSessionId 和 status 為必填欄位", 400);
    }

    // 驗證狀態值
    if (!["pending", "completed", "cancelled"].includes(status)) {
      return createErrorResponse("無效的狀態值", 400);
    }

    const updatedSession = await updateMatchSessionStatus(
      matchSessionId,
      status,
      notes
    );

    console.log("✅ 配對記錄狀態更新成功:", updatedSession.id);

    return createSuccessResponse(
      {
        matchSession: updatedSession,
        message: `配對記錄狀態已更新為 ${status}`
      },
      "配對記錄狀態更新成功"
    );
  } catch (error) {
    console.error("💥 更新配對記錄狀態錯誤:", error);
    return createErrorResponse(
      error instanceof Error && error.message.includes("找不到")
        ? "找不到指定的配對記錄"
        : "更新配對記錄狀態失敗",
      error instanceof Error && error.message.includes("找不到") ? 404 : 500
    );
  }
}

// OPTIONS - 處理 CORS 預檢請求
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}