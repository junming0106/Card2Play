"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

interface MatchResult {
  playerId: string;
  playerEmail: string;
  gameTitle: string;
  matchedGame: string; // 用戶想要交換的遊戲
}

export default function HallPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [error, setError] = useState("");

  const fetchMatches = async () => {
    if (!user || refreshCount >= 3) {
      console.log('❌ 配對請求被阻止:', { user: !!user, refreshCount });
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log('🎯 開始配對請求...');
      console.log('👤 用戶狀態:', { 
        uid: user.uid, 
        email: user.email, 
        emailVerified: user.emailVerified 
      });
      
      if (!user.emailVerified) {
        console.log('❌ 用戶電子郵件未驗證');
        setError("請先驗證您的電子郵件");
        return;
      }
      
      const idToken = await user.getIdToken();
      console.log('🎫 取得 Token，長度:', idToken.length);
      console.log('🎫 Token 前20字:', idToken.substring(0, 20));
      
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      };
      console.log('📤 請求 Headers:', headers);
      
      const response = await fetch("/api/matching", {
        method: "GET",
        headers: headers,
      });

      console.log('📥 配對回應狀態:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 配對成功:', result);
        setMatches(result.data || []);
        // 只有成功時才增加次數
        setRefreshCount(prev => prev + 1);
      } else {
        const result = await response.json();
        console.log('❌ 配對失敗:', result);
        setError(result.error || result.message || "配對失敗");
        // 配對失敗不增加次數
      }
    } catch (error) {
      console.error('💥 配對錯誤:', error);
      setError("網路錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  // 移除自動執行配對，讓用戶手動點擊開始
  // useEffect(() => {
  //   if (user) {
  //     fetchMatches();
  //   }
  // }, [user]);

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
                配對次數: {refreshCount}/3
              </div>
            </div>
          </header>

          {/* 錯誤訊息 */}
          {error && (
            <div className="mb-4 bg-red-100 border-4 border-red-500 p-3 text-center">
              <p className="font-black text-red-800">{error}</p>
            </div>
          )}

          {/* 刷新按鈕 */}
          {refreshCount < 3 && (
            <div className="mb-6 text-center">
              <button
                onClick={fetchMatches}
                disabled={loading}
                className="bg-green-500 text-white border-4 border-black px-6 py-3 font-black text-lg hover:bg-green-600 transition-colors shadow-[4px_4px_0px_#000000] transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_#000000] disabled:opacity-50"
              >
                {loading ? "配對中..." : refreshCount === 0 ? "🎯 開始配對" : "🔄 重新配對"}
              </button>
            </div>
          )}

          {/* 配對結果 */}
          {matches.length > 0 ? (
            <div className="bg-white border-4 sm:border-8 border-black p-4 sm:p-6 shadow-[8px_8px_0px_#000000] transform rotate-1">
              <h2 className="text-xl sm:text-2xl font-black mb-4 text-center">
                🎮 找到 {matches.length} 個配對！
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.map((match, index) => (
                  <div
                    key={`${match.playerId}-${index}`}
                    className="bg-yellow-100 border-4 border-yellow-500 p-4 transform -rotate-1 hover:rotate-0 transition-transform"
                  >
                    <div className="text-center">
                      <h3 className="text-lg font-black mb-2">
                        玩家 #{index + 1}
                      </h3>
                      <p className="font-bold text-sm mb-2 text-gray-600">
                        {match.playerEmail}
                      </p>
                      <div className="bg-green-200 border-2 border-green-500 p-2 mb-2">
                        <p className="font-black text-xs">對方持有：</p>
                        <p className="font-bold text-sm">{match.gameTitle}</p>
                      </div>
                      <div className="bg-blue-200 border-2 border-blue-500 p-2">
                        <p className="font-black text-xs">你想要：</p>
                        <p className="font-bold text-sm">{match.matchedGame}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border-4 sm:border-8 border-black p-8 text-center shadow-[8px_8px_0px_#000000] transform -rotate-1">
              <h2 className="text-2xl font-black text-gray-600 mb-4">
                {refreshCount === 0 ? "點擊上方按鈕開始配對" : "目前沒有找到配對"}
              </h2>
              <p className="font-bold text-gray-500">
                {refreshCount === 0 
                  ? "我們會幫你尋找想要交換的遊戲夥伴" 
                  : refreshCount < 3 
                    ? "可以再次刷新尋找更多配對"
                    : "今日配對次數已用完，明日再試"
                }
              </p>
            </div>
          )}

          {/* 說明區域 */}
          <div className="mt-8 bg-gray-100 border-4 border-gray-400 p-4 transform rotate-1">
            <h3 className="text-lg font-black mb-2">💡 配對說明</h3>
            <ul className="font-bold text-sm text-gray-700 list-disc list-inside space-y-1">
              <li>系統會尋找持有你「想要交換」遊戲的其他玩家</li>
              <li>每次配對最多顯示 3 個結果</li>
              <li>每日最多可以配對 3 次</li>
              <li>找到配對後可以聯繫對方進行交換</li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}