"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import DraggableModal from "@/components/ui/DraggableModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

interface MatchResult {
  playerId: number;
  playerEmail: string;
  playerName: string;
  gameTitle: string;
  gameId: number;
  matchType: "seeking" | "offering";
  addedAt: string;
  sessionId?: number; // 如果有 sessionId 表示這是配對成功記錄
  status?: string; // 配對成功記錄的狀態
  notes?: string; // 配對成功記錄的備註
  isHistoryRecord?: boolean; // 如果是配對歷史記錄（來自 last_match_games）
}

interface MatchingStatus {
  matches: MatchResult[];
  rateLimited: boolean;
  matchesUsed: number;
  matchesRemaining: number;
  secondsUntilReset: number;
  nextResetTime: string;
  recentMatches: MatchResult[] | null;
  historyInfo?: {
    isHistorical: boolean;
    lastMatchAt: string;
    expireTime: string;
    remainingMinutes: number;
  } | null;
}

export default function HallPage() {
  const { user } = useAuth();
  const [matchingStatus, setMatchingStatus] = useState<MatchingStatus | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [showNoWantGameModal, setShowNoWantGameModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    sessionId?: number;
    gameName?: string;
    gameId?: number;
  }>({ isOpen: false });
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(
    null
  );

  // 初始載入用戶配對狀態
  React.useEffect(() => {
    if (user && user.emailVerified) {
      console.log("🚀 頁面載入，自動獲取配對狀態...");
      fetchMatchingStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 倒數計時器 - 每秒更新
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [countdown]);

  // 格式化倒數時間
  const formatCountdown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 檢查用戶是否有「想要交換」的遊戲
  const checkUserHasWantToTradeGames = async () => {
    if (!user) return false;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/collections-pg", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        const collections = result.data || [];

        // 檢查是否有狀態為「想要交換」的遊戲
        const hasWantToTradeGames = collections.some(
          (game: any) => game.status === "想要交換"
        );
        console.log("🔍 檢查用戶遊戲狀態:", {
          totalGames: collections.length,
          hasWantToTradeGames,
          wantToTradeCount: collections.filter(
            (game: any) => game.status === "想要交換"
          ).length,
        });

        return hasWantToTradeGames;
      } else {
        console.error("❌ 獲取用戶收藏失敗:", response.status);
        return false;
      }
    } catch (error) {
      console.error("💥 檢查用戶遊戲收藏錯誤:", error);
      return false;
    }
  };

  // 專門獲取歷史紀錄資料
  const fetchMatchingStatusForHistory = async () => {
    if (!user) return;

    try {
      const idToken = await user.getIdToken();
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      };

      const response = await fetch("/api/matching-pg?status_only=true", {
        method: "GET",
        headers: headers,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ 獲取歷史紀錄狀態:", result);

        // 只更新 recentMatches 和 historyInfo，保持其他狀態不變
        setMatchingStatus((prevStatus) => ({
          ...prevStatus!,
          recentMatches: result.data?.recentMatches || null,
          historyInfo: result.data?.historyInfo || null,
        }));
      } else {
        console.log("❌ 獲取歷史紀錄失敗");
      }
    } catch (error) {
      console.error("💥 獲取歷史紀錄錯誤:", error);
    }
  };

  // 獲取配對狀態（不進行新配對）
  const fetchMatchingStatus = async () => {
    if (!user) {
      console.log("❌ 用戶未登入");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("📊 獲取配對狀態...");

      if (!user.emailVerified) {
        console.log("❌ 用戶電子郵件未驗證");
        setError("請先驗證您的電子郵件");
        return;
      }

      const idToken = await user.getIdToken();
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      };

      // 使用 HEAD 方法或特殊參數來只獲取狀態而不進行配對
      const response = await fetch("/api/matching-pg?status_only=true", {
        method: "GET",
        headers: headers,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ 配對狀態:", result);

        const status: MatchingStatus = {
          matches: result.data?.matches || [],
          rateLimited: result.data?.rateLimited || false,
          matchesUsed: result.data?.matchesUsed || 0,
          matchesRemaining: result.data?.matchesRemaining || 0,
          secondsUntilReset: result.data?.secondsUntilReset || 0,
          nextResetTime: result.data?.nextResetTime || "",
          recentMatches: result.data?.recentMatches || null,
          historyInfo: result.data?.historyInfo || null,
        };

        setMatchingStatus(status);

        // 記錄歷史記錄信息
        if (status.historyInfo?.isHistorical) {
          console.log("📋 載入歷史記錄:", {
            matchCount: status.matches.length,
            lastMatchAt: status.historyInfo.lastMatchAt,
            remainingMinutes: status.historyInfo.remainingMinutes,
          });
        }

        // 設定倒數計時器 - 只有配對餘額不滿3時才開始倒數
        if (status.secondsUntilReset > 0 && status.matchesRemaining < 3) {
          setCountdown(status.secondsUntilReset);
        } else {
          setCountdown(0); // 重置倒數計時器
        }
      } else {
        const result = await response.json();
        console.log("❌ 獲取狀態失敗:", result);
        setError(result.error || result.message || "獲取狀態失敗");
      }
    } catch (error) {
      console.error("💥 獲取狀態錯誤:", error);
      setError("網路錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    if (!user) {
      console.log("❌ 用戶未登入");
      return;
    }

    // 先檢查用戶是否有「想要交換」的遊戲
    console.log("🔍 檢查用戶是否有想要交換的遊戲...");
    const hasWantToTradeGames = await checkUserHasWantToTradeGames();

    if (!hasWantToTradeGames) {
      console.log("⚠️ 用戶沒有想要交換的遊戲，顯示提醒");
      setShowNoWantGameModal(true);
      return;
    }

    console.log("✅ 用戶有想要交換的遊戲，繼續配對流程");
    setLoading(true);
    setError("");

    try {
      console.log("🎯 開始配對請求...");
      console.log("👤 用戶狀態:", {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
      });

      if (!user.emailVerified) {
        console.log("❌ 用戶電子郵件未驗證");
        setError("請先驗證您的電子郵件");
        return;
      }

      const idToken = await user.getIdToken();
      console.log("🎫 取得 Token，長度:", idToken.length);

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      };

      const response = await fetch("/api/matching-pg", {
        method: "GET",
        headers: headers,
      });

      console.log("📥 配對回應狀態:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("✅ 配對回應:", result);

        const status: MatchingStatus = {
          matches: result.data?.matches || [],
          rateLimited: result.data?.rateLimited || false,
          matchesUsed: result.data?.matchesUsed || 0,
          matchesRemaining: result.data?.matchesRemaining || 0,
          secondsUntilReset: result.data?.secondsUntilReset || 0,
          nextResetTime: result.data?.nextResetTime || "",
          recentMatches: result.data?.recentMatches || null,
          historyInfo: result.data?.historyInfo || null,
        };

        setMatchingStatus(status);

        // 設定倒數計時器 - 只有配對餘額不滿3時才開始倒數
        if (status.secondsUntilReset > 0 && status.matchesRemaining < 3) {
          setCountdown(status.secondsUntilReset);
        } else {
          setCountdown(0); // 重置倒數計時器
        }

        // 配對完成後，額外調用 status_only API 來獲取完整的歷史紀錄資料
        await fetchMatchingStatusForHistory();
      } else {
        const result = await response.json();
        console.log("❌ 配對失敗:", result);
        setError(result.error || result.message || "配對失敗");
      }
    } catch (error) {
      console.error("💥 配對錯誤:", error);
      setError("網路錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  // 創建配對成功記錄
  const createMatchRecord = async (match: MatchResult) => {
    if (!user) return null;

    try {
      console.log("🎯 創建配對成功記錄:", match);

      const idToken = await user.getIdToken();
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      };

      const response = await fetch("/api/match-sessions", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          holderUserId: match.playerId,
          gameId: match.gameId,
          notes: `配對遊戲: ${match.gameTitle}`,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ 配對記錄創建成功:", result);
        const createdSession = result.data.matchSession;

        // 立即更新當前 match 物件的 sessionId
        if (matchingStatus) {
          const updatedMatches = matchingStatus.matches.map((m) =>
            m.playerId === match.playerId && m.gameId === match.gameId
              ? { ...m, sessionId: createdSession.id }
              : m
          );

          setMatchingStatus({
            ...matchingStatus,
            matches: updatedMatches,
          });
        }

        // 也重新獲取最新狀態以更新歷史記錄
        setTimeout(async () => {
          await fetchMatchingStatus();
        }, 100);

        return createdSession;
      } else {
        const result = await response.json();
        console.log("❌ 配對記錄創建失敗:", result);
        return null;
      }
    } catch (error) {
      console.error("💥 創建配對記錄錯誤:", error);
      return null;
    }
  };

  // 關閉刪除 Modal
  const closeDeleteModal = () => {
    console.log("🚪 關閉刪除 Modal");
    setDeleteModal({ isOpen: false });
  };

  // 刪除配對歷史記錄項目
  const deleteMatchHistory = async (playerId: number, gameId: number) => {
    if (!user || !playerId || !gameId) {
      console.error("❌ 無效的用戶或參數");
      return false;
    }

    setDeletingSessionId(playerId); // 使用 playerId 作為loading標識

    try {
      console.log("🗑️ 開始刪除配對歷史記錄:", { playerId, gameId });

      const idToken = await user.getIdToken();
      const response = await fetch("/api/match-history", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId,
          gameId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("✅ 配對歷史記錄刪除成功:", result);

        // 立即更新介面，移除已刪除的項目
        if (matchingStatus) {
          const updatedMatches = matchingStatus.matches.filter(
            (match) => !(match.playerId === playerId && match.gameId === gameId)
          );
          const updatedRecentMatches =
            matchingStatus.recentMatches?.filter(
              (match) =>
                !(match.playerId === playerId && match.gameId === gameId)
            ) || null;

          setMatchingStatus({
            ...matchingStatus,
            matches: updatedMatches,
            recentMatches: updatedRecentMatches,
          });
        }

        // 同時也重新獲取最新狀態以確保數據一致性
        setTimeout(async () => {
          await fetchMatchingStatus();
        }, 100);

        return true;
      } else {
        console.error("❌ 刪除配對歷史記錄失敗:", result);
        alert(`刪除失敗：${result.error || "請稍後再試"}`);
        return false;
      }
    } catch (error) {
      console.error("💥 刪除配對歷史記錄錯誤:", error);
      alert("網路錯誤，請稍後再試");
      return false;
    } finally {
      setDeletingSessionId(null);
    }
  };

  // 打開刪除確認 Modal（統一使用歷史記錄刪除）
  const openDeleteModal = (
    playerId: number | undefined,
    gameName: string,
    gameId: number
  ) => {
    if (!playerId || !gameId) {
      console.error("❌ 無效的刪除參數:", { playerId, gameId });
      alert("無法刪除：參數錯誤");
      return;
    }

    console.log("🗑️ 打開歷史記錄刪除 Modal:", { playerId, gameId, gameName });
    setDeleteModal({
      isOpen: true,
      sessionId: playerId, // 使用 playerId 作為標識符
      gameName,
      gameId,
    });
  };

  // 處理刪除確認（統一使用歷史記錄刪除）
  const handleDeleteConfirm = async () => {
    if (!deleteModal.sessionId || !deleteModal.gameId) {
      console.error("❌ 無效的 Modal 狀態");
      return;
    }

    const success = await deleteMatchHistory(
      deleteModal.sessionId,
      deleteModal.gameId
    );
    if (success) {
      console.log("✅ 歷史記錄刪除成功，關閉 Modal");
      closeDeleteModal();
    } else {
      console.log("❌ 歷史記錄刪除失敗，保持 Modal 開啟");
    }
  };

  // 發送交換通知
  const sendTradeNotification = async (match: MatchResult) => {
    if (!user) {
      console.error("❌ 用戶未登入");
      return false;
    }

    try {
      console.log("📧 發送交換通知:", match);

      const idToken = await user.getIdToken();
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: match.playerId,
          gameId: match.gameId,
          gameTitle: match.gameTitle,
          message: `${user.displayName || user.email} 想要與你交換「${
            match.gameTitle
          }」`,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("✅ 交換通知發送成功:", result);
        alert(
          `✅ 交換邀請已發送給 ${match.playerName}！對方會在通知中收到您的邀請。`
        );
        return true;
      } else {
        console.error("❌ 交換通知發送失敗:", result);
        alert(`❌ 發送失敗：${result.error || "請稍後再試"}`);
        return false;
      }
    } catch (error) {
      console.error("💥 發送交換通知錯誤:", error);
      alert("❌ 網路錯誤，請稍後再試");
      return false;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-purple-300 flex items-center justify-center px-2 sm:px-4 py-8 sm:py-12">
        <div className="w-full max-w-6xl mx-auto">
          {/* 回首頁按鈕 */}
          <div className="mb-4 sm:mb-6">
            <Link
              href="/"
              className="inline-flex items-center bg-red-500 text-white border-4 border-black px-4 py-2 font-black text-sm sm:text-base hover:bg-red-600 transition-colors shadow-[4px_4px_0px_#000000] transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_#000000]"
            >
              🏠 回首頁
            </Link>
          </div>

          {/* 頁面標題 */}
          <header className="bg-white border-4 sm:border-8 border-black p-4 sm:p-6 shadow-[8px_8px_0px_#000000] sm:shadow-[16px_16px_0px_#000000] !mb-5 sm:!mb-10 transform -rotate-1">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-black mb-2">
                🎯 交換大廳
              </h1>
              <p className="text-sm sm:text-lg font-bold text-gray-700 mb-3 sm:mb-4">
                尋找想要交換的遊戲夥伴
              </p>
              <div className="inline-block bg-purple-500 text-white px-3 sm:px-4 py-1 sm:py-2 border-2 sm:border-4 border-black font-black text-sm sm:text-base transform rotate-2">
                配對次數: {matchingStatus?.matchesUsed || 0}/3
              </div>

              {/* 倒數計時器 - 只有配對餘額不滿3時才顯示 */}
              {matchingStatus &&
                countdown > 0 &&
                matchingStatus.matchesRemaining < 3 && (
                  <div className="mt-2 inline-block bg-red-500 text-white px-3 py-1 border-2 border-black font-bold text-sm transform -rotate-1">
                    🕐 重置倒數: {formatCountdown(countdown)}
                  </div>
                )}
            </div>
          </header>

          {/* 錯誤訊息 */}
          {error && (
            <div className="mb-4 bg-red-100 border-4 border-red-500 p-3 text-center">
              <p className="font-black text-red-800">{error}</p>
            </div>
          )}

          {/* 刷新按鈕 */}
          {(!matchingStatus || matchingStatus.matchesRemaining > 0) && (
            <div className="mb-6 text-center">
              <button
                onClick={fetchMatches}
                disabled={loading || matchingStatus?.rateLimited || false}
                className="bg-green-500 text-white border-4 border-black px-6 py-3 font-black text-lg hover:bg-green-600 transition-colors shadow-[4px_4px_0px_#000000] transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_#000000] disabled:opacity-50"
              >
                {loading
                  ? "配對中..."
                  : !matchingStatus
                  ? "🎯 開始配對"
                  : "🔄 重新配對"}
              </button>

              {matchingStatus && matchingStatus.matchesRemaining > 0 && (
                <p className="mt-2 font-bold text-gray-700 text-sm">
                  剩餘 {matchingStatus.matchesRemaining} 次配對機會
                </p>
              )}
            </div>
          )}

          {/* 配對用完提示 */}
          {matchingStatus?.rateLimited &&
            matchingStatus.matchesRemaining < 3 && (
              <div className="mb-6 bg-orange-100 border-4 border-orange-500 p-4 text-center transform rotate-1">
                <h3 className="text-lg font-black text-orange-800 mb-2">
                  🚫 配對次數已用完
                </h3>
                <p className="font-bold text-orange-700">
                  {countdown > 0
                    ? `${formatCountdown(countdown)} 後重置`
                    : "即將重置..."}
                </p>
              </div>
            )}

          {/* 歷史記錄即將過期提示 */}
          {matchingStatus?.historyInfo?.isHistorical &&
            matchingStatus.historyInfo.remainingMinutes <= 10 &&
            matchingStatus.historyInfo.remainingMinutes > 0 && (
              <div className="mb-6 bg-yellow-100 border-4 border-yellow-500 p-4 text-center transform -rotate-1">
                <h3 className="text-lg font-black text-yellow-800 mb-2">
                  ⚠️ 歷史記錄即將過期
                </h3>
                <p className="font-bold text-yellow-700">
                  配對記錄將在 {matchingStatus.historyInfo.remainingMinutes}{" "}
                  分鐘後清除
                </p>
              </div>
            )}

          {/* 配對結果 */}
          {matchingStatus && matchingStatus.matches.length > 0 ? (
            <div className="bg-white border-4 sm:border-8 border-black p-4 sm:p-6 shadow-[8px_8px_0px_#000000] transform rotate-1">
              <h2 className="text-xl sm:text-2xl font-black mb-4 text-center">
                {matchingStatus.rateLimited
                  ? "🎮 之前配對結果"
                  : `🎮 找到 ${matchingStatus.matches.length} 個配對！`}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchingStatus.matches.map((match, index) => (
                  <div
                    key={`${match.playerId}-${match.gameId}-${index}`}
                    className={`p-4 shadow-[4px_4px_0px_#000000] transform hover:scale-105 transition-transform ${
                      match.sessionId
                        ? "bg-green-50 border-4 border-green-500" // 配對成功記錄用綠色邊框
                        : "bg-white border-4 border-black" // 普通配對結果用黑色邊框
                    }`}
                  >
                    {/* 配對成功標識 */}
                    {match.sessionId && (
                      <div className="inline-block px-2 py-1 bg-green-500 text-white border-2 border-black font-bold text-xs mb-2 transform -rotate-1">
                        ✅ 已發起交換
                      </div>
                    )}

                    {/* 遊戲標題 */}
                    <h3 className="font-black text-lg mb-2 line-clamp-2">
                      {match.gameTitle}
                    </h3>

                    {/* 配對狀態標籤 */}
                    <div
                      className={`inline-block px-3 py-1 border-2 border-black font-bold text-sm mb-3 ${
                        match.matchType === "seeking"
                          ? "bg-green-400 text-green-900"
                          : "bg-blue-400 text-blue-900"
                      }`}
                    >
                      {match.matchType === "seeking"
                        ? "🔍 想要的遊戲"
                        : "🎁 持有的遊戲"}
                    </div>

                    {/* 玩家資訊 */}
                    <div className="mb-3">
                      <p className="font-bold text-sm text-gray-600 mb-1">
                        👤 用戶: {match.playerName}
                      </p>
                      <p className="text-sm font-bold text-gray-600">
                        📧 {match.playerEmail}
                      </p>
                    </div>

                    {/* 配對說明 */}
                    <div className="text-xs font-bold text-gray-500 mb-4">
                      {match.matchType === "seeking"
                        ? "🎯 對方持有你想要的遊戲"
                        : "💎 對方想要你持有的遊戲"}
                    </div>

                    {/* 操作按鈕 */}
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          const success = await sendTradeNotification(match);
                          if (success) {
                            console.log(
                              "✅ 通知發送成功，可以選擇同時開啟郵件"
                            );
                            // 可選：同時開啟郵件作為備選方式
                            // window.open(`mailto:${match.playerEmail}?subject=遊戲交換：${match.gameTitle}&body=您好，我想要與您交換「${match.gameTitle}」這款遊戲。`);
                          }
                        }}
                        className="flex-1 bg-blue-400 border-2 border-black px-3 py-1 font-bold text-sm hover:bg-blue-500 transition-colors shadow-[2px_2px_0px_#000000] transform hover:translate-x-0.5 hover:translate-y-0.5"
                      >
                        📧 發送交換邀請
                      </button>

                      {/* 刪除按鈕 - 統一使用歷史記錄刪除方式 */}
                      <button
                        onClick={() =>
                          openDeleteModal(
                            match.playerId,
                            match.gameTitle,
                            match.gameId
                          )
                        }
                        className="flex-1 bg-red-400 border-2 border-black px-3 py-1 font-bold text-sm hover:bg-red-500 transition-colors shadow-[2px_2px_0px_#000000] transform hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-50"
                        disabled={deletingSessionId === match.playerId}
                      >
                        {deletingSessionId === match.playerId
                          ? "刪除中..."
                          : "❌ 刪除"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border-4 sm:border-8 border-black p-8 text-center shadow-[8px_8px_0px_#000000] transform -rotate-1">
              <h2 className="text-2xl font-black text-gray-600 mb-4">
                {!matchingStatus
                  ? "點擊上方按鈕開始配對"
                  : matchingStatus.rateLimited
                  ? "配對次數已用完"
                  : "目前沒有找到配對"}
              </h2>
              <p className="font-bold text-gray-500">
                {!matchingStatus
                  ? "我們會幫你尋找想要交換的遊戲夥伴"
                  : matchingStatus.rateLimited &&
                    matchingStatus.matchesRemaining < 3
                  ? `${formatCountdown(countdown)} 後可再次配對`
                  : matchingStatus.matchesRemaining > 0
                  ? "可以再次刷新尋找更多配對"
                  : matchingStatus.matchesRemaining === 3
                  ? "配對餘額已滿，隨時可以配對"
                  : "配對次數已用完"}
              </p>
            </div>
          )}

          {/* 配對歷史記錄（60分鐘內） */}
          {matchingStatus?.recentMatches &&
            matchingStatus.recentMatches.length > 0 && (
              <div className="mt-8 bg-yellow-100 border-4 border-yellow-500 p-4 sm:p-6 transform -rotate-1">
                <h3 className="text-xl font-black mb-4 text-yellow-800 text-center">
                  📋 配對歷史紀錄 (1小時內)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matchingStatus.recentMatches
                    .slice(0, 9)
                    .map((match, index) => (
                      <div
                        key={`recent-${match.playerId}-${match.gameId}-${index}`}
                        className={`p-4 shadow-[4px_4px_0px_#000000] transform hover:scale-105 transition-transform ${
                          match.sessionId
                            ? "bg-green-50 border-4 border-green-500" // 配對成功記錄
                            : match.isHistoryRecord
                            ? "bg-orange-50 border-4 border-orange-500" // 配對歷史記錄
                            : "bg-white border-4 border-yellow-600" // 普通配對記錄
                        }`}
                      >
                        {/* 記錄類型標識 */}
                        {match.sessionId && (
                          <div className="inline-block px-2 py-1 bg-green-500 text-white border-2 border-black font-bold text-xs mb-2 transform -rotate-1">
                            ✅ 已發起交換
                          </div>
                        )}
                        {match.isHistoryRecord && !match.sessionId && (
                          <div className="inline-block px-2 py-1 bg-orange-500 text-white border-2 border-black font-bold text-xs mb-2 transform -rotate-1">
                            📋 配對歷史
                          </div>
                        )}

                        {/* 遊戲標題 */}
                        <h4 className="font-black text-base mb-2 line-clamp-2">
                          {match.gameTitle}
                        </h4>

                        {/* 配對狀態標籤 */}
                        <div
                          className={`inline-block px-2 py-1 border-2 border-black font-bold text-xs mb-2 ${
                            match.matchType === "seeking"
                              ? "bg-green-400 text-green-900"
                              : "bg-blue-400 text-blue-900"
                          }`}
                        >
                          {match.matchType === "seeking"
                            ? "🔍 想要的遊戲"
                            : "🎁 持有的遊戲"}
                        </div>

                        {/* 玩家資訊 */}
                        <div className="mb-3">
                          <p className="font-bold text-xs text-gray-600 mb-1">
                            👤 {match.playerName}
                          </p>
                          <p className="text-xs font-medium text-gray-500">
                            📧 {match.playerEmail}
                          </p>
                        </div>

                        {/* 操作按鈕 */}
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              const success = await sendTradeNotification(
                                match
                              );
                              if (success) {
                                console.log("✅ 歷史記錄區域通知發送成功");
                              }
                            }}
                            className="flex-1 bg-blue-400 border-2 border-black px-2 py-1 font-bold text-xs hover:bg-blue-500 transition-colors shadow-[2px_2px_0px_#000000] transform hover:translate-x-0.5 hover:translate-y-0.5"
                          >
                            📧 發送交換邀請
                          </button>

                          {match.sessionId ? (
                            // 配對成功記錄 - 追蹤按鈕
                            <button
                              onClick={() => {
                                const message = `您好！我們之前已經配對成功「${match.gameTitle}」這款遊戲，想確認一下交換進度。`;
                                window.open(
                                  `mailto:${
                                    match.playerEmail
                                  }?subject=遊戲交換進度確認：${
                                    match.gameTitle
                                  }&body=${encodeURIComponent(message)}`
                                );
                              }}
                              className="flex-1 bg-yellow-400 border-2 border-black px-2 py-1 font-bold text-xs hover:bg-yellow-500 transition-colors shadow-[2px_2px_0px_#000000] transform hover:translate-x-0.5 hover:translate-y-0.5"
                            >
                              📞 追蹤
                            </button>
                          ) : match.isHistoryRecord ? (
                            // 配對歷史記錄 - 刪除按鈕
                            <button
                              onClick={() =>
                                openDeleteModal(
                                  match.playerId,
                                  match.gameTitle,
                                  match.gameId
                                )
                              }
                              className="flex-1 bg-red-400 border-2 border-black px-2 py-1 font-bold text-xs hover:bg-red-500 transition-colors shadow-[2px_2px_0px_#000000] transform hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-50"
                              disabled={deletingSessionId === match.playerId}
                            >
                              {deletingSessionId === match.playerId
                                ? "刪除中..."
                                : "❌ 刪除"}
                            </button>
                          ) : (
                            // 新配對結果 - 交換按鈕
                            <button
                              onClick={async () => {
                                console.log("🔄 點擊交換按鈕:", match);
                                const createdSession = await createMatchRecord(
                                  match
                                );

                                if (createdSession) {
                                  console.log(
                                    "✅ 配對記錄創建成功，sessionId:",
                                    createdSession.id
                                  );
                                  const message = `您好！我想要交換「${match.gameTitle}」這款遊戲，請問您有興趣嗎？我們可以討論交換的細節。`;
                                  window.open(
                                    `mailto:${
                                      match.playerEmail
                                    }?subject=遊戲交換提議：${
                                      match.gameTitle
                                    }&body=${encodeURIComponent(message)}`
                                  );
                                } else {
                                  console.error("❌ 配對記錄創建失敗");
                                  alert("創建配對記錄失敗，請稍後再試");
                                }
                              }}
                              className="flex-1 bg-green-400 border-2 border-black px-2 py-1 font-bold text-xs hover:bg-green-500 transition-colors shadow-[2px_2px_0px_#000000] transform hover:translate-x-0.5 hover:translate-y-0.5"
                            >
                              🔄 交換
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                {/* 記錄統計 */}
                <div className="mt-4 text-center">
                  <p className="font-bold text-yellow-700 text-sm">
                    📊 共找到 {matchingStatus.recentMatches.length} 筆配對記錄
                    {matchingStatus.recentMatches.length > 9 &&
                      " (顯示最新 9 筆)"}
                  </p>
                </div>
              </div>
            )}

          {/* 說明區域 */}
          <div className="mt-8 bg-gray-100 border-4 border-gray-400 p-4 transform rotate-1">
            <h3 className="text-lg font-black mb-2">💡 配對說明</h3>
            <ul className="font-bold text-sm text-gray-700 list-disc list-inside space-y-1">
              <li>系統會尋找持有你「想要交換」遊戲的其他玩家</li>
              <li>每次配對最多顯示 3 個結果</li>
              <li>每 3 小時最多可以配對 3 次</li>
              <li>最近配對記錄會保存 1 小時</li>
              <li>找到配對後可以聯繫對方進行交換</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 沒有想要交換遊戲的提醒Modal */}
      <DraggableModal
        isOpen={showNoWantGameModal}
        onClose={() => setShowNoWantGameModal(false)}
        title="🎮 找不到可配對的遊戲"
        maxWidth="max-w-md"
        showCloseButton={false}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">🎮</div>
          <p className="font-bold text-gray-600 mb-6 leading-relaxed">
            您尚未有「想要交換」標籤的遊戲，
            <br />
            請至我的卡片新增想要交換的遊戲。
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/collection"
              className="bg-blue-500 text-white border-2 border-black px-6 py-2 font-black hover:bg-blue-600 transition-colors shadow-[4px_4px_0px_#000000] transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_#000000]"
              onClick={() => setShowNoWantGameModal(false)}
            >
              🃏 前往我的卡片
            </Link>
            <button
              onClick={() => setShowNoWantGameModal(false)}
              className="bg-gray-500 text-white border-2 border-black px-6 py-2 font-black hover:bg-gray-600 transition-colors shadow-[4px_4px_0px_#000000] transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_#000000]"
            >
              關閉
            </button>
          </div>
        </div>
      </DraggableModal>

      {/* 刪除配對記錄確認 Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        title="確認刪除配對記錄"
        message="刪除後，此配對記錄將不會出現在配對歷史中。這個動作無法復原。"
        itemName={deleteModal.gameName}
      />
    </ProtectedRoute>
  );
}
