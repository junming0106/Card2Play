"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CollectionStats, CollectionItemExtended, NintendoSwitchGame } from "@/types/collection";
import nintendoGamesData from "@/data/nintendo-switch-games.json";

// 導入組件
import GameSearch from "@/components/collection/GameSearch";
import AddCustomGame from "@/components/collection/AddCustomGame";
import GameList from "@/components/collection/GameList";
import AddGameModal from "@/components/collection/AddGameModal";

export default function CollectionPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [collections, setCollections] = useState<CollectionItemExtended[]>([]);
  const [nintendoGames] = useState<NintendoSwitchGame[]>(nintendoGamesData as NintendoSwitchGame[]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedGame, setSelectedGame] = useState<NintendoSwitchGame | null>(null);
  const [showAddGameModal, setShowAddGameModal] = useState(false);

  // 載入收藏統計
  const fetchStats = async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/collections/stats", {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (error) {
      console.error("載入統計失敗:", error);
    }
  };

  // 載入收藏列表
  const fetchCollections = async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/collections", {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setCollections(result.data);
      }
    } catch (error) {
      console.error("載入收藏列表失敗:", error);
      setError("載入收藏列表失敗");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchCollections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 自動清除錯誤訊息
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 處理選擇遊戲
  const handleSelectGame = (game: NintendoSwitchGame) => {
    setSelectedGame(game);
    setShowAddGameModal(true);
  };

  // 處理新增成功
  const handleAddSuccess = () => {
    fetchStats();
    fetchCollections();
    setShowAddGameModal(false);
    setSelectedGame(null);
  };

  // 處理更新
  const handleUpdate = () => {
    fetchStats();
    fetchCollections();
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-orange-300 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-white border-8 border-black p-8 shadow-[16px_16px_0px_#000000] transform rotate-2">
              <h2 className="text-3xl font-black mb-4">載入中...</h2>
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-orange-300 p-2 sm:p-4 lg:flex lg:items-start lg:justify-center">
        <div className="w-full max-w-6xl mx-auto lg:mt-8">
          {/* 頁面標題 */}
          <header className="bg-white border-4 sm:border-8 border-black p-4 sm:p-6 shadow-[8px_8px_0px_#000000] sm:shadow-[16px_16px_0px_#000000] mb-4 sm:mb-8 transform -rotate-1">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-black mb-2">
                🎮 我的遊戲收藏
              </h1>
              <p className="text-sm sm:text-lg font-bold text-gray-700 mb-3 sm:mb-4">
                管理您的 Nintendo Switch 遊戲收藏
              </p>
              <div className="inline-block bg-red-500 text-white px-3 sm:px-4 py-1 sm:py-2 border-2 sm:border-4 border-black font-black text-sm sm:text-base transform rotate-2">
                總共 {stats?.total || 0}/5 個遊戲
              </div>
            </div>
          </header>

          {/* 錯誤訊息 */}
          {error && (
            <div className="mb-6 bg-red-100 border-8 border-red-500 p-4 text-center transform rotate-1">
              <p className="font-black text-red-800">{error}</p>
            </div>
          )}

          {/* 統計面板 */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-8">
              <div className="bg-green-400 border-2 sm:border-4 border-black p-2 sm:p-4 text-center transform hover:scale-105 transition-transform">
                <div className="text-xl sm:text-2xl lg:text-3xl font-black">{stats.owned}</div>
                <div className="font-bold text-green-900 text-xs sm:text-sm">擁有</div>
              </div>
              <div className="bg-yellow-400 border-2 sm:border-4 border-black p-2 sm:p-4 text-center transform hover:scale-105 transition-transform">
                <div className="text-xl sm:text-2xl lg:text-3xl font-black">{stats.wanted}</div>
                <div className="font-bold text-yellow-900 text-xs sm:text-sm">想要</div>
              </div>
              <div className="bg-blue-400 border-2 sm:border-4 border-black p-2 sm:p-4 text-center transform hover:scale-105 transition-transform">
                <div className="text-xl sm:text-2xl lg:text-3xl font-black">{stats.completed}</div>
                <div className="font-bold text-blue-900 text-xs sm:text-sm">完成</div>
              </div>
              <div className="bg-purple-400 border-2 sm:border-4 border-black p-2 sm:p-4 text-center transform hover:scale-105 transition-transform">
                <div className="text-xl sm:text-2xl lg:text-3xl font-black">{stats.trading}</div>
                <div className="font-bold text-purple-900 text-xs sm:text-sm">交換</div>
              </div>
              <div className="bg-pink-400 border-2 sm:border-4 border-black p-2 sm:p-4 text-center transform hover:scale-105 transition-transform col-span-2 sm:col-span-1">
                <div className="text-xl sm:text-2xl lg:text-3xl font-black">{stats.customGames}</div>
                <div className="font-bold text-pink-900 text-xs sm:text-sm">自定義</div>
              </div>
            </div>
          )}

          {/* 新增遊戲區域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-8">
            {/* 搜尋 Nintendo Switch 遊戲 */}
            <div className="bg-cyan-400 border-4 sm:border-8 border-black p-3 sm:p-6 shadow-[4px_4px_0px_#000000] sm:shadow-[8px_8px_0px_#000000] transform rotate-1">
              <h2 className="text-lg sm:text-2xl font-black mb-3 sm:mb-4 text-center">🔍 搜尋遊戲</h2>
              <p className="font-bold text-gray-700 mb-3 sm:mb-4 text-center text-sm sm:text-base">
                從 {nintendoGames.length} 款 Nintendo Switch 遊戲中搜尋
              </p>
              <GameSearch
                games={nintendoGames}
                onSelectGame={handleSelectGame}
                disabled={loading || (stats?.total || 0) >= 5}
              />
              {(stats?.total || 0) >= 5 && (
                <div className="mt-3 bg-red-100 border-2 border-red-400 p-2 text-center">
                  <p className="text-sm font-bold text-red-800">
                    已達到收藏上限（5個遊戲）
                  </p>
                </div>
              )}
            </div>

            {/* 手動新增遊戲 */}
            <div className="bg-pink-400 border-4 sm:border-8 border-black p-3 sm:p-6 shadow-[4px_4px_0px_#000000] sm:shadow-[8px_8px_0px_#000000] transform -rotate-1">
              <h2 className="text-lg sm:text-2xl font-black mb-3 sm:mb-4 text-center">➕ 自定義遊戲</h2>
              <p className="font-bold text-gray-700 mb-3 sm:mb-4 text-center text-sm sm:text-base">
                找不到遊戲？手動新增吧！
              </p>
              <AddCustomGame
                onSuccess={handleUpdate}
                disabled={loading || (stats?.total || 0) >= 5}
              />
              {(stats?.total || 0) >= 5 && (
                <div className="mt-3 bg-red-100 border-2 border-red-400 p-2 text-center">
                  <p className="text-sm font-bold text-red-800">
                    已達到收藏上限（5個遊戲）
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 我的遊戲列表 */}
          <div className="bg-white border-4 sm:border-8 border-black p-3 sm:p-6 shadow-[8px_8px_0px_#000000] sm:shadow-[16px_16px_0px_#000000] transform rotate-1">
            <h2 className="text-2xl sm:text-3xl font-black mb-4 sm:mb-6 text-center">📚 我的遊戲列表</h2>
            <GameList
              collections={collections}
              onUpdate={handleUpdate}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* 新增遊戲彈窗 */}
      {selectedGame && (
        <AddGameModal
          game={selectedGame}
          isOpen={showAddGameModal}
          onClose={() => {
            setShowAddGameModal(false);
            setSelectedGame(null);
          }}
          onSuccess={handleAddSuccess}
        />
      )}
    </ProtectedRoute>
  );
}