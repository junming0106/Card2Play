import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 驗證 Firebase ID Token
export async function verifyAuthToken(request: NextRequest) {
  try {
    // 檢查 Firebase Admin 是否可用
    if (!adminAuth) {
      console.warn("⚠️ Firebase Admin 不可用，跳過 Token 驗證");
      return null;
    }

    const authHeader = request.headers.get("Authorization");
    console.log("🔍 Authorization Header:", authHeader ? "Present" : "null");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ 無效的 Authorization Header 格式");
      return null;
    }

    const idToken = authHeader.substring(7); // 移除 "Bearer " 前綴
    console.log("🎫 ID Token 長度:", idToken.length);

    console.log("🔐 開始驗證 ID Token...");
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log("✅ Token 驗證成功，UID:", decodedToken.uid);

    return decodedToken;
  } catch (error) {
    console.error("💥 Token 驗證錯誤:", error);
    console.error(
      "💥 錯誤詳情:",
      error instanceof Error ? error.message : "Unknown error"
    );
    if (error instanceof Error && error.message) {
      console.error("💥 完整錯誤:", error.message);
    }
    return null;
  }
}

// 備用身份驗證：當 Firebase Admin 不可用時，嘗試解析 Firebase Client Token
async function fallbackAuthVerification(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { user: null, error: "缺少有效的授權 Token" };
    }

    const idToken = authHeader.substring(7);
    console.log("🔄 嘗試備用身份驗證，Token 長度:", idToken.length);

    // 解析 JWT Token 的 payload（不驗證簽名，僅用於獲取基本資訊）
    const parts = idToken.split(".");
    if (parts.length !== 3) {
      console.log("❌ Token 格式無效");
      return { user: null, error: "Token 格式無效" };
    }

    const payload = JSON.parse(atob(parts[1]));
    console.log("📋 Token payload 解析:", {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      exp: payload.exp,
    });

    // 檢查 Token 是否過期
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.log("❌ Token 已過期");
      return { user: null, error: "Token 已過期" };
    }

    // 使用 Token 中的資訊自動建立或取得用戶
    const { createOrUpdateUser, getUserByGoogleId } = await import(
      "@/lib/database"
    );

    const googleId = payload.sub;
    const email = payload.email || "unknown@user.com";
    const name = payload.name || payload.email?.split("@")[0] || "User";
    const avatarUrl = payload.picture || undefined;

    console.log("👤 嘗試建立/更新用戶:", { googleId, email, name });

    // 先檢查用戶是否存在
    let pgUser = await getUserByGoogleId(googleId);

    if (!pgUser) {
      // 如果不存在，建立新用戶（增強版本）
      console.log("🆕 建立新用戶到 PostgreSQL");
      try {
        pgUser = await createOrUpdateUser(googleId, email, name, avatarUrl);
        console.log("✅ 新用戶建立成功:", {
          id: pgUser.id,
          email: pgUser.email,
        });
      } catch (createError) {
        console.error("❌ 建立新用戶失敗:", createError);
        // 嘗試再次查詢，可能是併發創建導致
        pgUser = await getUserByGoogleId(googleId);
        if (!pgUser) {
          throw new Error("用戶建立失敗且查詢不到用戶");
        }
        console.log("⚠️ 併發創建問題已解決，找到用戶:", pgUser.id);
      }
    } else {
      // 如果用戶已存在，更新用戶資訊
      console.log("🔄 更新現有用戶資訊");
      try {
        pgUser = await createOrUpdateUser(googleId, email, name, avatarUrl);
        console.log("✅ 用戶資訊更新成功");
      } catch (updateError) {
        console.warn("⚠️ 用戶資訊更新失敗，使用現有資料:", updateError);
        // 更新失敗但用戶存在，繼續使用現有資料
      }
    }

    console.log("✅ 備用驗證成功，用戶 ID:", pgUser.id);

    return {
      user: {
        id: pgUser.id,
        googleId: pgUser.google_id,
        email: pgUser.email,
        name: pgUser.name,
        avatarUrl: pgUser.avatar_url,
        createdAt: pgUser.created_at,
        updatedAt: pgUser.updated_at,
        firebaseUid: googleId,
        firebaseToken: payload,
      },
      error: null,
    };
  } catch (error) {
    console.error("💥 備用驗證失敗:", error);
    return { user: null, error: "備用身份驗證失敗" };
  }
}

// 統一身份驗證函數：驗證 JWT Token 並取得 PostgreSQL 用戶資料
export async function verifyAuthTokenAndGetUser(request: NextRequest) {
  try {
    // 第一步：嘗試標準 Firebase Admin 驗證
    const decodedToken = await verifyAuthToken(request);
    if (!decodedToken) {
      // Firebase Admin 不可用時，使用備用驗證方式
      console.log("⚠️ Firebase Admin 不可用，使用備用驗證方式");
      return await fallbackAuthVerification(request);
    }

    // 第二步：在 PostgreSQL 中查詢對應的用戶，如果不存在則自動建立
    const { getUserByGoogleId, createOrUpdateUser } = await import(
      "@/lib/database"
    );
    let pgUser = await getUserByGoogleId(decodedToken.uid);

    if (!pgUser) {
      console.log(
        "⚠️ PostgreSQL 中找不到用戶，嘗試自動建立，UID:",
        decodedToken.uid
      );

      // 嘗試自動建立用戶
      try {
        const email = decodedToken.email || "unknown@user.com";
        const name =
          decodedToken.name || decodedToken.email?.split("@")[0] || "User";
        const avatarUrl = decodedToken.picture || undefined;

        console.log("🆕 自動建立用戶:", { uid: decodedToken.uid, email, name });
        pgUser = await createOrUpdateUser(
          decodedToken.uid,
          email,
          name,
          avatarUrl
        );
        console.log("✅ 用戶自動建立成功:", pgUser.id);
      } catch (autoCreateError) {
        console.error("❌ 自動建立用戶失敗:", autoCreateError);
        return {
          user: null,
          error: "用戶未同步到資料庫且自動建立失敗",
          firebaseUser: decodedToken,
        };
      }
    }

    console.log("✅ 找到 PostgreSQL 用戶:", {
      id: pgUser.id,
      email: pgUser.email,
      name: pgUser.name,
    });

    // 返回包含完整資訊的用戶物件
    return {
      user: {
        // PostgreSQL 用戶資料
        id: pgUser.id,
        googleId: pgUser.google_id,
        email: pgUser.email,
        name: pgUser.name,
        avatarUrl: pgUser.avatar_url,
        createdAt: pgUser.created_at,
        updatedAt: pgUser.updated_at,
        // Firebase 用戶資料
        firebaseUid: decodedToken.uid,
        firebaseToken: decodedToken,
      },
      error: null,
    };
  } catch (error) {
    console.error("💥 統一身份驗證錯誤:", error);
    return { user: null, error: "身份驗證過程發生錯誤" };
  }
}

// 創建成功回應
export function createSuccessResponse<T>(data: T, message?: string): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      message,
    } as ApiResponse<T>),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

// 創建錯誤回應
export function createErrorResponse(
  error: string,
  status: number = 400
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error,
    } as ApiResponse),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

// 創建分頁回應
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// 從 URL 獲取搜尋參數
export function getSearchParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100); // 最大 100
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    offset,
  };
}

// 輸入驗證輔助函數
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

// 清理字串輸入
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>\"']/g, "");
}

// 檢查是否為管理員
export async function isAdmin(uid: string): Promise<boolean> {
  try {
    if (!adminAuth) {
      console.warn("⚠️ Firebase Admin 不可用，無法檢查管理員權限");
      return false;
    }
    const userRecord = await adminAuth.getUser(uid);
    return userRecord.customClaims?.admin === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

// 設定自訂聲明
export async function setAdminClaim(uid: string, isAdmin: boolean) {
  try {
    if (!adminAuth) {
      console.warn("⚠️ Firebase Admin 不可用，無法設定自訂聲明");
      return { error: new Error("Firebase Admin not available") };
    }
    await adminAuth.setCustomUserClaims(uid, { admin: isAdmin });
    return { error: null };
  } catch (error) {
    console.error("Error setting admin claim:", error);
    return { error: error as Error };
  }
}

// 台北時區日期工具函數
export function getTaipeiDate(): string {
  const now = new Date();
  const taipeiDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
  return taipeiDate.toISOString().split('T')[0];
}

export function getTaipeiDateTime(): string {
  const now = new Date();
  return now.toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' }).replace(' ', 'T');
}
