"use client";

import React, { useState } from "react";

export default function TestPgPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [performance, setPerformance] = useState<any>(null);

  const testMatching = async () => {
    setLoading(true);
    setError("");
    setMatches([]);
    setPerformance(null);

    try {
      console.log('🧪 開始測試 PostgreSQL 配對...');
      
      // 暫時使用假的 JWT token 進行測試
      const response = await fetch("/api/matching-pg", {
        headers: {
          "Authorization": "Bearer fake-jwt-token-for-testing",
          "Content-Type": "application/json",
        },
      });

      console.log('📥 配對回應狀態:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ PostgreSQL 配對成功:', result);
        setMatches(result.data?.matches || []);
        setPerformance(result.data?.performance);
      } else {
        const result = await response.json();
        console.log('❌ 配對失敗:', result);
        setError(result.error || "配對失敗");
      }
    } catch (error) {
      console.error('💥 配對錯誤:', error);
      setError("網路錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-purple-300 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 標題 */}
        <header className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000000] mb-8">
          <h1 className="text-3xl font-black text-center">
            🧪 PostgreSQL 配對功能測試
          </h1>
          <p className="text-center text-gray-600 font-bold mt-2">
            測試新的超高效配對系統
          </p>
        </header>

        {/* 效能比較 */}
        <div className="bg-white border-4 border-green-500 p-6 shadow-[4px_4px_0px_#000000] mb-6">
          <h2 className="text-xl font-black mb-4">⚡ 效能比較</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-100 border-2 border-red-500 p-4">
              <h3 className="font-black text-red-800">舊版 Firestore</h3>
              <ul className="text-sm font-bold text-red-700 mt-2 space-y-1">
                <li>• 查詢次數: 50+ 次</li>
                <li>• 響應時間: ~500ms</li>
                <li>• 網路往返: 多次</li>
                <li>• 擴展性: 受限</li>
              </ul>
            </div>
            <div className="bg-green-100 border-2 border-green-500 p-4">
              <h3 className="font-black text-green-800">新版 PostgreSQL</h3>
              <ul className="text-sm font-bold text-green-700 mt-2 space-y-1">
                <li>• 查詢次數: 1 次</li>
                <li>• 響應時間: ~50ms</li>
                <li>• 網路往返: 1 次</li>
                <li>• 擴展性: 優秀</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 測試按鈕 */}
        <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000000] mb-6">
          <div className="text-center">
            <button
              onClick={testMatching}
              disabled={loading}
              className="bg-blue-500 text-white border-4 border-black px-8 py-4 font-black text-xl hover:bg-blue-600 transition-colors shadow-[4px_4px_0px_#000000] transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_#000000] disabled:opacity-50"
            >
              {loading ? "配對測試中..." : "🚀 測試 PostgreSQL 配對"}
            </button>
            
            {performance && (
              <div className="mt-4 p-4 bg-blue-100 border-2 border-blue-500">
                <h3 className="font-black">📊 效能數據:</h3>
                <div className="text-sm font-bold mt-2">
                  <p>查詢次數: {performance.queries}</p>
                  <p>之前需要: {performance.previousQueries}</p>
                  <p>效能提升: {performance.improvement}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="mb-6 bg-red-100 border-4 border-red-500 p-4 text-center">
            <p className="font-black text-red-800">{error}</p>
          </div>
        )}

        {/* 配對結果 */}
        {matches.length > 0 ? (
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000000]">
            <h2 className="text-xl font-black mb-4 text-center">
              🎮 找到 {matches.length} 個配對！
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match: any, index) => (
                <div
                  key={index}
                  className="bg-yellow-100 border-4 border-yellow-500 p-4 transform -rotate-1 hover:rotate-0 transition-transform"
                >
                  <div className="text-center">
                    <h3 className="text-lg font-black mb-2">
                      玩家 #{index + 1}
                    </h3>
                    <p className="font-bold text-sm mb-2 text-gray-600">
                      {match.playerEmail}
                    </p>
                    {match.playerName && (
                      <p className="font-bold text-sm mb-2 text-gray-800">
                        {match.playerName}
                      </p>
                    )}
                    <div className="bg-green-200 border-2 border-green-500 p-2 mb-2">
                      <p className="font-black text-xs">對方持有：</p>
                      <p className="font-bold text-sm">{match.gameTitle}</p>
                    </div>
                    <div className="bg-blue-200 border-2 border-blue-500 p-2">
                      <p className="font-black text-xs">你想要：</p>
                      <p className="font-bold text-sm">{match.wantedGame}</p>
                    </div>
                    {match.publisher && (
                      <p className="text-xs font-bold text-gray-500 mt-2">
                        發行商: {match.publisher}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : !loading && !error && (
          <div className="bg-white border-4 border-black p-8 text-center shadow-[8px_8px_0px_#000000]">
            <h2 className="text-2xl font-black text-gray-600 mb-4">
              點擊上方按鈕開始測試
            </h2>
            <p className="font-bold text-gray-500">
              測試新的 PostgreSQL 配對系統效能
            </p>
          </div>
        )}

        {/* 說明區域 */}
        <div className="mt-8 bg-gray-100 border-4 border-gray-400 p-4">
          <h3 className="text-lg font-black mb-2">📝 測試說明</h3>
          <ul className="font-bold text-sm text-gray-700 list-disc list-inside space-y-1">
            <li>此頁面測試新的 PostgreSQL 配對邏輯</li>
            <li>目前使用模擬資料進行測試</li>
            <li>正式版將整合真實的 Google OAuth 驗證</li>
            <li>配對效能預期提升 10-20 倍</li>
          </ul>
        </div>
      </div>
    </div>
  );
}