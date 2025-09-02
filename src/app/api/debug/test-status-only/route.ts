import { NextRequest } from "next/server";
import { canUserMatch } from "@/lib/database";
import { sql } from "@vercel/postgres";

// 模擬配對API的status_only邏輯
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "此 API 僅在開發環境可用",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "需要提供 userId 參數",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("🧪 測試 status_only 邏輯，用戶:", userId);

    // 檢查用戶配對權限（模擬配對API的邏輯）
    const matchPermission = await canUserMatch(parseInt(userId));

    console.log("📊 回傳配對狀態（模擬）:", {
      userId: parseInt(userId),
      matchesUsed: matchPermission.matchesUsed,
      secondsUntilReset: matchPermission.secondsUntilReset,
      canMatch: matchPermission.canMatch,
      hasRecentMatches: !!matchPermission.recentMatches,
      recentMatchesCount: matchPermission.recentMatches
        ? matchPermission.recentMatches.length
        : 0,
      lastMatchAt: matchPermission.lastMatchAt,
      sessionExpired: matchPermission.sessionExpired,
      hasRecentMatchesFlag: matchPermission.hasRecentMatches,
    });

    // 檢查並處理歷史記錄的時效性（複製配對API的邏輯）
    let displayMatches: any[] = [];
    let isHistoryValid = false;
    let historyExpireTime = null;
    let historyRemainingMinutes = 0;

    // 信任 PostgreSQL 的時間檢查邏輯，直接使用 hasRecentMatches
    if (
      matchPermission.recentMatches &&
      Array.isArray(matchPermission.recentMatches) &&
      matchPermission.hasRecentMatches
    ) {
      const lastMatchTime = new Date(matchPermission.lastMatchAt);
      const now = new Date();

      console.log("⏰ 使用資料庫時間檢查結果:", {
        lastMatchTime: lastMatchTime.toISOString(),
        currentTime: now.toISOString(),
        hasRecentMatches: matchPermission.hasRecentMatches,
        recentMatchesLength: matchPermission.recentMatches.length,
        userId: parseInt(userId),
      });

      isHistoryValid = true;
      displayMatches = matchPermission.recentMatches;
      historyExpireTime = new Date(lastMatchTime.getTime() + 60 * 60 * 1000); // 配對時間 + 1小時
      historyRemainingMinutes = Math.max(
        0,
        Math.ceil((historyExpireTime.getTime() - now.getTime()) / (60 * 1000))
      );

      // 如果歷史記錄已過期，清空顯示的記錄
      if (historyRemainingMinutes <= 0) {
        displayMatches = [];
        isHistoryValid = false;
      }

      console.log("✅ 歷史記錄有效（基於資料庫檢查）:", {
        lastMatchTime: lastMatchTime.toISOString(),
        expireTime: historyExpireTime.toISOString(),
        remainingMinutes: historyRemainingMinutes,
        matchCount: displayMatches.length,
      });
    } else {
      console.log("⏰ 無有效的歷史記錄:", {
        hasRecentMatches: !!matchPermission.recentMatches,
        hasRecentMatchesFlag: matchPermission.hasRecentMatches,
        lastMatchAt: matchPermission.lastMatchAt,
        userId: parseInt(userId),
      });
    }

    const summary =
      displayMatches.length > 0
        ? {
            total: displayMatches.length,
            seeking: displayMatches.filter((m) => m.matchType === "seeking")
              .length,
            offering: displayMatches.filter((m) => m.matchType === "offering")
              .length,
          }
        : {
            total: 0,
            seeking: 0,
            offering: 0,
          };

    const result = {
      success: true,
      data: {
        matches: displayMatches,
        rateLimited: !matchPermission.canMatch,
        matchesUsed: matchPermission.matchesUsed,
        matchesRemaining: matchPermission.matchesRemaining,
        secondsUntilReset: matchPermission.secondsUntilReset,
        recentMatches: isHistoryValid ? matchPermission.recentMatches : null,
        summary: summary,
        historyInfo: isHistoryValid
          ? {
              isHistorical: true,
              lastMatchAt: matchPermission.lastMatchAt,
              expireTime: historyExpireTime?.toISOString(),
              remainingMinutes: historyRemainingMinutes,
            }
          : null,
      },
      message: isHistoryValid
        ? `顯示歷史配對結果 (${displayMatches.length} 個)，剩餘 ${historyRemainingMinutes} 分鐘有效`
        : displayMatches.length > 0
        ? `配對狀態已更新，顯示 ${displayMatches.length} 個配對結果`
        : "配對狀態已更新，沒有歷史記錄",
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("💥 測試 status_only 邏輯錯誤:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "測試失敗",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
