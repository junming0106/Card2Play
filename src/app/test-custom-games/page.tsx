"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function TestCustomGamesPage() {
  const { user, loading } = useAuth();
  const [customGames, setCustomGames] = useState([]);
  const [gameTitle, setGameTitle] = useState('');
  const [gamePublisher, setGamePublisher] = useState('');
  const [testResult, setTestResult] = useState('');

  const fetchCustomGames = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/custom-games-pg', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setCustomGames(result.data?.games || []);
        console.log('✅ 取得自定義遊戲:', result);
      } else {
        const error = await response.json();
        console.error('❌ 取得自定義遊戲失敗:', error);
      }
    } catch (error) {
      console.error('💥 請求錯誤:', error);
    }
  };

  const createCustomGame = async () => {
    if (!user || !gameTitle.trim()) {
      setTestResult('請先登入並輸入遊戲標題');
      return;
    }

    try {
      setTestResult('🔄 建立中...');
      
      const token = await user.getIdToken();
      const response = await fetch('/api/custom-games-pg', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customTitle: gameTitle.trim(),
          customPublisher: gamePublisher.trim() || '未知',
          releaseDate: new Date().toISOString().split('T')[0]
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setTestResult(`✅ 建立成功！遊戲 ID: ${result.data.game.id}`);
        setGameTitle('');
        setGamePublisher('');
        fetchCustomGames(); // 重新載入列表
      } else {
        setTestResult(`❌ 建立失敗: ${result.error}`);
      }

    } catch (error) {
      setTestResult(`💥 建立錯誤: ${error}`);
    }
  };

  const deleteCustomGame = async (gameId: number, title: string) => {
    if (!user || !confirm(`確定要刪除「${title}」嗎？`)) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/custom-games-pg?gameId=${gameId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ 成功刪除「${title}」`);
        fetchCustomGames(); // 重新載入列表
      } else {
        alert(`❌ 刪除失敗: ${result.error}`);
      }

    } catch (error) {
      alert(`💥 刪除錯誤: ${error}`);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCustomGames();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-purple-300 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-300 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 標題 */}
        <header className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000000] mb-8">
          <h1 className="text-3xl font-black text-center">
            🎮 PostgreSQL 自定義遊戲測試
          </h1>
          <p className="text-center text-gray-600 font-bold mt-2">
            測試新的 PostgreSQL 自定義遊戲功能
          </p>
        </header>

        {/* 登入狀態 */}
        {!user && (
          <div className="bg-red-100 border-4 border-red-500 p-4 mb-6 text-center">
            <p className="font-black text-red-800">❌ 請先登入</p>
          </div>
        )}

        {user && (
          <>
            {/* 新增自定義遊戲 */}
            <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000000] mb-6">
              <h2 className="text-xl font-black mb-4">➕ 新增自定義遊戲</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block font-black mb-2">遊戲標題 *</label>
                  <input
                    type="text"
                    value={gameTitle}
                    onChange={(e) => setGameTitle(e.target.value)}
                    className="w-full p-3 border-2 border-black font-bold"
                    placeholder="輸入遊戲標題..."
                  />
                </div>

                <div>
                  <label className="block font-black mb-2">發行商</label>
                  <input
                    type="text"
                    value={gamePublisher}
                    onChange={(e) => setGamePublisher(e.target.value)}
                    className="w-full p-3 border-2 border-black font-bold"
                    placeholder="輸入發行商（選填）..."
                  />
                </div>

                <button
                  onClick={createCustomGame}
                  disabled={!gameTitle.trim()}
                  className="bg-green-500 text-white border-2 border-black px-6 py-3 font-black hover:bg-green-600 disabled:opacity-50"
                >
                  🎮 建立遊戲
                </button>
              </div>

              {testResult && (
                <div className="mt-4 p-3 bg-gray-100 border-2 border-gray-400">
                  <p className="font-bold">{testResult}</p>
                </div>
              )}
            </div>

            {/* 自定義遊戲列表 */}
            <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000000] mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-black">📋 我的自定義遊戲</h2>
                <button
                  onClick={fetchCustomGames}
                  className="bg-blue-500 text-white border-2 border-black px-4 py-2 font-black hover:bg-blue-600"
                >
                  🔄 重新載入
                </button>
              </div>

              {customGames.length === 0 ? (
                <p className="text-gray-600 font-bold text-center py-8">
                  目前沒有自定義遊戲
                </p>
              ) : (
                <div className="space-y-4">
                  {customGames.map((game: any) => (
                    <div
                      key={game.id}
                      className="border-2 border-gray-300 p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-black text-lg">{game.title}</h3>
                          <p className="font-bold text-sm text-gray-600">
                            發行商: {game.publisher}
                          </p>
                          <p className="font-bold text-sm text-gray-600">
                            狀態: {game.status === 'owned' ? '持有中' : game.status === 'wanted' ? '想要交換' : game.status}
                          </p>
                          <p className="font-bold text-xs text-gray-500">
                            ID: {game.id} | 建立時間: {new Date(game.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => deleteCustomGame(game.id, game.title)}
                          className="bg-red-500 text-white border-2 border-black px-3 py-1 font-black hover:bg-red-600"
                        >
                          🗑️ 刪除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 說明 */}
            <div className="bg-gray-100 border-4 border-gray-400 p-6">
              <h2 className="text-xl font-black mb-4">📝 功能說明</h2>
              <div className="space-y-2 text-sm font-bold">
                <p>🆕 這是使用 PostgreSQL 的新版自定義遊戲功能</p>
                <p>🔢 新的遊戲使用數字 ID（如：1, 2, 3...）</p>
                <p>🔤 舊的 Firestore 遊戲使用字串 ID（如：custom_123...）</p>
                <p>⚡ PostgreSQL 版本效能更好，支援複雜查詢</p>
                <p>🎯 新建立的遊戲會自動加入「持有中」狀態</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}