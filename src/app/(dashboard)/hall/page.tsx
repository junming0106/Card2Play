"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

interface MatchResult {
  playerId: number;
  playerEmail: string;
  playerName: string;
  gameTitle: string;
  gameId: number;
  matchType: 'seeking' | 'offering';
  addedAt: string;
}

interface MatchingStatus {
  matches: MatchResult[];
  rateLimited: boolean;
  matchesUsed: number;
  matchesRemaining: number;
  secondsUntilReset: number;
  nextResetTime: string;
  recentMatches: MatchResult[] | null;
}

export default function HallPage() {
  const { user } = useAuth();
  const [matchingStatus, setMatchingStatus] = useState<MatchingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  // 初始載入用戶配對狀態
  React.useEffect(() => {
    if (user && user.emailVerified) {
      console.log('🚀 頁面載入，自動獲取配對狀態...');
      fetchMatchingStatus();
    }
  }, [user]);

  // 倒數計時器 - 每秒更新
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [countdown]);

  // 格式化倒數時間
  const formatCountdown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
          nextResetTime: result.data?.nextResetTime || '',
          recentMatches: result.data?.recentMatches || null
        };
        
        setMatchingStatus(status);
        
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
          nextResetTime: result.data?.nextResetTime || '',
          recentMatches: result.data?.recentMatches || null
        };
        
        setMatchingStatus(status);
        
        // 設定倒數計時器 - 只有配對餘額不滿3時才開始倒數
        if (status.secondsUntilReset > 0 && status.matchesRemaining < 3) {
          setCountdown(status.secondsUntilReset);
        } else {
          setCountdown(0); // 重置倒數計時器
        }
        
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
              {matchingStatus && countdown > 0 && matchingStatus.matchesRemaining < 3 && (
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
                disabled={loading || (matchingStatus?.rateLimited || false)}
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
          {matchingStatus?.rateLimited && matchingStatus.matchesRemaining < 3 && (
            <div className="mb-6 bg-orange-100 border-4 border-orange-500 p-4 text-center transform rotate-1">
              <h3 className="text-lg font-black text-orange-800 mb-2">🚫 配對次數已用完</h3>
              <p className="font-bold text-orange-700">
                {countdown > 0 ? `${formatCountdown(countdown)} 後重置` : '即將重置...'}
              </p>
            </div>
          )}

          {/* 配對結果 */}
          {matchingStatus && matchingStatus.matches.length > 0 ? (
            <div className="bg-white border-4 sm:border-8 border-black p-4 sm:p-6 shadow-[8px_8px_0px_#000000] transform rotate-1">
              <h2 className="text-xl sm:text-2xl font-black mb-4 text-center">
                🎮 {matchingStatus.rateLimited ? '之前配對結果' : `找到 ${matchingStatus.matches.length} 個配對！`}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchingStatus.matches.map((match, index) => (
                  <div
                    key={`${match.playerId}-${match.gameId}-${index}`}
                    className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000000] transform hover:scale-105 transition-transform"
                  >
                    {/* 遊戲標題 */}
                    <h3 className="font-black text-lg mb-2 line-clamp-2">
                      {match.gameTitle}
                    </h3>

                    {/* 配對狀態標籤 */}
                    <div className={`inline-block px-3 py-1 border-2 border-black font-bold text-sm mb-3 ${
                      match.matchType === 'seeking' 
                        ? 'bg-green-400 text-green-900' 
                        : 'bg-blue-400 text-blue-900'
                    }`}>
                      {match.matchType === 'seeking' ? '🔍 想要的遊戲' : '🎁 持有的遊戲'}
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
                      {match.matchType === 'seeking' 
                        ? '🎯 對方持有你想要的遊戲' 
                        : '💎 對方想要你持有的遊戲'}
                    </div>

                    {/* 操作按鈕 */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => window.open(`mailto:${match.playerEmail}?subject=遊戲交換：${match.gameTitle}&body=您好，我對您的「${match.gameTitle}」遊戲有興趣，想討論交換的可能性。`)}
                        className="flex-1 bg-blue-400 border-2 border-black px-3 py-1 font-bold text-sm hover:bg-blue-500 transition-colors shadow-[2px_2px_0px_#000000] transform hover:translate-x-0.5 hover:translate-y-0.5"
                      >
                        📧 聯繫
                      </button>
                      <button 
                        onClick={() => {
                          const message = `您好！我想要交換「${match.gameTitle}」這款遊戲，請問您有興趣嗎？我們可以討論交換的細節。`;
                          window.open(`mailto:${match.playerEmail}?subject=遊戲交換提議：${match.gameTitle}&body=${encodeURIComponent(message)}`);
                        }}
                        className="flex-1 bg-green-400 border-2 border-black px-3 py-1 font-bold text-sm hover:bg-green-500 transition-colors shadow-[2px_2px_0px_#000000] transform hover:translate-x-0.5 hover:translate-y-0.5"
                      >
                        🔄 交換
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
                  : matchingStatus.rateLimited && matchingStatus.matchesRemaining < 3
                  ? `${formatCountdown(countdown)} 後可再次配對`
                  : matchingStatus.matchesRemaining > 0
                  ? "可以再次刷新尋找更多配對"
                  : matchingStatus.matchesRemaining === 3
                  ? "配對餘額已滿，隨時可以配對"
                  : "配對次數已用完"}
              </p>
            </div>
          )}
          
          {/* 最近配對記錄（60分鐘內） */}
          {matchingStatus?.recentMatches && matchingStatus.recentMatches.length > 0 && (
            <div className="mt-8 bg-yellow-100 border-4 border-yellow-500 p-4 sm:p-6 transform -rotate-1">
              <h3 className="text-xl font-black mb-4 text-yellow-800 text-center">
                📋 配對歷史記錄 (60分鐘內)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchingStatus.recentMatches.slice(0, 9).map((match, index) => (
                  <div 
                    key={`recent-${match.playerId}-${match.gameId}-${index}`} 
                    className="bg-white border-4 border-yellow-600 p-4 shadow-[4px_4px_0px_#000000] transform hover:scale-105 transition-transform"
                  >
                    {/* 遊戲標題 */}
                    <h4 className="font-black text-base mb-2 line-clamp-2">
                      {match.gameTitle}
                    </h4>

                    {/* 配對狀態標籤 */}
                    <div className={`inline-block px-2 py-1 border-2 border-black font-bold text-xs mb-2 ${
                      match.matchType === 'seeking' 
                        ? 'bg-green-400 text-green-900' 
                        : 'bg-blue-400 text-blue-900'
                    }`}>
                      {match.matchType === 'seeking' ? '🔍 想要的遊戲' : '🎁 持有的遊戲'}
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
                        onClick={() => window.open(`mailto:${match.playerEmail}?subject=遊戲交換：${match.gameTitle}&body=您好，我對您的「${match.gameTitle}」遊戲有興趣，想討論交換的可能性。`)}
                        className="flex-1 bg-blue-400 border-2 border-black px-2 py-1 font-bold text-xs hover:bg-blue-500 transition-colors shadow-[2px_2px_0px_#000000] transform hover:translate-x-0.5 hover:translate-y-0.5"
                      >
                        📧 聯繫
                      </button>
                      <button 
                        onClick={() => {
                          const message = `您好！我想要交換「${match.gameTitle}」這款遊戲，請問您有興趣嗎？我們可以討論交換的細節。`;
                          window.open(`mailto:${match.playerEmail}?subject=遊戲交換提議：${match.gameTitle}&body=${encodeURIComponent(message)}`);
                        }}
                        className="flex-1 bg-green-400 border-2 border-black px-2 py-1 font-bold text-xs hover:bg-green-500 transition-colors shadow-[2px_2px_0px_#000000] transform hover:translate-x-0.5 hover:translate-y-0.5"
                      >
                        🔄 交換
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 記錄統計 */}
              <div className="mt-4 text-center">
                <p className="font-bold text-yellow-700 text-sm">
                  📊 共找到 {matchingStatus.recentMatches.length} 筆配對記錄
                  {matchingStatus.recentMatches.length > 9 && ' (顯示最新 9 筆)'}
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
              <li>最近配對記錄會保存 60 分鐘</li>
              <li>找到配對後可以聯繫對方進行交換</li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
