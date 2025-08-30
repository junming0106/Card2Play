import { NextRequest } from "next/server";
import { sql } from "@vercel/postgres";
import {
  verifyAuthTokenAndGetUser,
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/utils/api";

// GET /api/match-requests - 查詢發給持有者的配對請求
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 查詢持有者的配對請求...");

    // 身份驗證
    const authResult = await verifyAuthTokenAndGetUser(request);
    if (!authResult.user) {
      return createErrorResponse(authResult.error || "未經授權", 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // 查詢發給當前用戶的配對請求（作為持有者）
    let result;
    if (status) {
      result = await sql`
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
          wu.avatar_url as wanter_avatar
        FROM user_match_sessions ms
        JOIN games g ON ms.game_id = g.id
        JOIN users wu ON ms.wanter_user_id = wu.id
        WHERE ms.holder_user_id = ${authResult.user.id} AND ms.status = ${status}
        ORDER BY ms.match_date DESC
      `;
    } else {
      result = await sql`
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
          wu.avatar_url as wanter_avatar
        FROM user_match_sessions ms
        JOIN games g ON ms.game_id = g.id
        JOIN users wu ON ms.wanter_user_id = wu.id
        WHERE ms.holder_user_id = ${authResult.user.id}
        ORDER BY ms.match_date DESC
      `;
    }

    console.log("✅ 找到配對請求:", result.rows.length, "筆");

    // 統計不同狀態的數量
    const statsResult = await sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM user_match_sessions
      WHERE holder_user_id = ${authResult.user.id}
      GROUP BY status
    `;

    const stats = {
      total: 0,
      pending: 0,
      completed: 0,
      cancelled: 0
    };

    statsResult.rows.forEach(row => {
      stats[row.status as keyof typeof stats] = parseInt(row.count);
      stats.total += parseInt(row.count);
    });

    return createSuccessResponse(
      {
        matchRequests: result.rows,
        stats,
        user: {
          id: authResult.user.id,
          name: authResult.user.name,
          email: authResult.user.email,
        },
        filters: {
          status: status || "all"
        }
      },
      `找到 ${result.rows.length} 筆配對請求`
    );
  } catch (error) {
    console.error("💥 查詢配對請求錯誤:", error);
    return createErrorResponse("查詢配對請求失敗", 500);
  }
}

// OPTIONS - 處理 CORS 預檢請求
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}