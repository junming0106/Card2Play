import { NextRequest } from "next/server";
import { sql } from "@vercel/postgres";
import {
  verifyAuthTokenAndGetUser,
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/utils/api";

// PATCH /api/notifications/[id] - 更新通知狀態（接受/拒絕/已讀）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    console.log("🔄 更新通知狀態:", resolvedParams.id);

    // 身份驗證
    const authResult = await verifyAuthTokenAndGetUser(request);
    if (!authResult.user) {
      return createErrorResponse(authResult.error || "未經授權", 401);
    }

    const notificationId = parseInt(resolvedParams.id);
    if (isNaN(notificationId)) {
      return createErrorResponse("無效的通知 ID", 400);
    }

    const body = await request.json();
    const { action, is_read } = body; // action: 'accept' | 'decline' | 'read'

    // 檢查通知是否存在且用戶有權限操作
    const checkResult = await sql`
      SELECT *
      FROM user_notifications
      WHERE id = ${notificationId} AND target_user_id = ${authResult.user.id}
    `;

    if (checkResult.rows.length === 0) {
      return createErrorResponse("找不到通知或無權限操作", 404);
    }

    const notification = checkResult.rows[0];
    console.log("📋 找到通知:", notification);

    let updateData: any = {
      updated_at: 'NOW() AT TIME ZONE \'Asia/Taipei\''
    };
    let responseMessage = "";

    // 處理不同的操作
    if (action === 'accept') {
      // 接受交換請求
      updateData.is_read = true;
      responseMessage = "交換請求已接受";
      
      // TODO: 這裡可以添加額外的邏輯，比如創建交換記錄、發送回覆通知等
      console.log("✅ 用戶接受了交換請求:", {
        notificationId,
        fromUserId: notification.from_user_id,
        gameTitle: notification.game_title,
        targetUserId: authResult.user.id
      });

      // 可以選擇發送回覆通知給原始發送者
      try {
        await sql`
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
            ${notification.from_user_id},
            ${authResult.user.id},
            ${authResult.user.name},
            ${authResult.user.email},
            'trade_accepted',
            ${notification.game_id},
            ${notification.game_title},
            ${'你的交換請求已被' + authResult.user.name + '接受！'},
            NOW() AT TIME ZONE 'Asia/Taipei',
            NOW() AT TIME ZONE 'Asia/Taipei'
          )
        `;
        console.log("✅ 已發送接受通知給原始發送者");
      } catch (replyError) {
        console.error("⚠️ 發送回覆通知失敗:", replyError);
      }

    } else if (action === 'decline') {
      // 拒絕交換請求
      updateData.is_read = true;
      responseMessage = "交換請求已拒絕";
      
      console.log("❌ 用戶拒絕了交換請求:", {
        notificationId,
        fromUserId: notification.from_user_id,
        gameTitle: notification.game_title,
        targetUserId: authResult.user.id
      });

      // 發送拒絕通知給原始發送者
      try {
        await sql`
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
            ${notification.from_user_id},
            ${authResult.user.id},
            ${authResult.user.name},
            ${authResult.user.email},
            'trade_declined',
            ${notification.game_id},
            ${notification.game_title},
            ${'你的交換請求被' + authResult.user.name + '拒絕了'},
            NOW() AT TIME ZONE 'Asia/Taipei',
            NOW() AT TIME ZONE 'Asia/Taipei'
          )
        `;
        console.log("📤 已發送拒絕通知給原始發送者");
      } catch (replyError) {
        console.error("⚠️ 發送回覆通知失敗:", replyError);
      }

    } else if (typeof is_read === 'boolean') {
      // 只更新已讀狀態
      updateData.is_read = is_read;
      responseMessage = is_read ? "通知已標記為已讀" : "通知已標記為未讀";
      
    } else {
      return createErrorResponse("無效的操作", 400);
    }

    // 更新通知
    const result = await sql`
      UPDATE user_notifications 
      SET 
        is_read = ${updateData.is_read !== undefined ? updateData.is_read : notification.is_read},
        updated_at = NOW() AT TIME ZONE 'Asia/Taipei'
      WHERE id = ${notificationId}
      RETURNING *
    `;

    const updatedNotification = result.rows[0];
    console.log("✅ 通知狀態更新成功:", updatedNotification.id);

    return createSuccessResponse(
      {
        notification: updatedNotification,
        message: responseMessage
      },
      responseMessage
    );
  } catch (error) {
    console.error("💥 更新通知狀態錯誤:", error);
    return createErrorResponse("更新通知狀態失敗", 500);
  }
}

// DELETE /api/notifications/[id] - 刪除通知
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    console.log("🗑️ 刪除通知:", resolvedParams.id);

    // 身份驗證
    const authResult = await verifyAuthTokenAndGetUser(request);
    if (!authResult.user) {
      return createErrorResponse(authResult.error || "未經授權", 401);
    }

    const notificationId = parseInt(resolvedParams.id);
    if (isNaN(notificationId)) {
      return createErrorResponse("無效的通知 ID", 400);
    }

    // 檢查並刪除通知
    const result = await sql`
      DELETE FROM user_notifications
      WHERE id = ${notificationId} AND target_user_id = ${authResult.user.id}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return createErrorResponse("找不到通知或無權限刪除", 404);
    }

    const deletedNotification = result.rows[0];
    console.log("✅ 通知刪除成功:", deletedNotification.id);

    return createSuccessResponse(
      {
        notification: deletedNotification,
        message: "通知已刪除"
      },
      "通知刪除成功"
    );
  } catch (error) {
    console.error("💥 刪除通知錯誤:", error);
    return createErrorResponse("刪除通知失敗", 500);
  }
}

// OPTIONS - 處理 CORS 預檢請求
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}