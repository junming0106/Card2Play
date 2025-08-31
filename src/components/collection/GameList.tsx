"use client";

import React, { useState } from "react";
import { CollectionItemExtended } from "@/types/collection";
import { useAuth } from "@/components/auth/AuthProvider";
import EditGameModal from "./EditGameModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

interface GameListProps {
  collections: CollectionItemExtended[];
  onUpdate: () => void;
  loading?: boolean;
}

export default function GameList({
  collections,
  onUpdate,
  loading = false,
}: GameListProps) {
  const { user } = useAuth();
  const [editingGame, setEditingGame] = useState<CollectionItemExtended | null>(
    null
  );
  const [deletingGameId, setDeletingGameId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, gameId?: string, gameName?: string, isCustomGame?: boolean}>({isOpen: false});

  const getStatusColor = (status: string) => {
    switch (status) {
      case "持有中":
        return "bg-green-400 text-green-900";
      case "想要交換":
        return "bg-yellow-400 text-yellow-900";
      case "已借出":
        return "bg-blue-400 text-blue-900";
      default:
        return "bg-gray-400 text-gray-900";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "持有中":
        return "持有中";
      case "想要交換":
        return "想要交換";
      case "已借出":
        return "已借出";
      default:
        return "未知";
    }
  };

  const openDeleteModal = (gameId: string, gameName: string, isCustomGame: boolean) => {
    setDeleteModal({ isOpen: true, gameId, gameName, isCustomGame });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false });
  };

  const handleDeleteConfirm = async () => {
    if (!user || !deleteModal.gameId) return;

    const { gameId, gameName, isCustomGame } = deleteModal;
    setDeletingGameId(gameId);

    try {
      // 統一使用 collections API 來刪除，因為所有遊戲（包括自定義遊戲）都存在收藏中
      console.log('🗑️ 開始從收藏中移除遊戲:', gameId, '(自定義:', isCustomGame, ')');
      
      const response = await fetch(`/api/collections?gameId=${gameId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 遊戲移除成功:', result);
        onUpdate();
      } else {
        const errorResult = await response.json();
        console.error('❌ 遊戲移除失敗:', errorResult);
      }
    } catch (error) {
      console.error('💥 刪除錯誤:', error);
    } finally {
      setDeletingGameId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-12">
        <div className="bg-gray-100 border-4 border-gray-400 p-8 transform rotate-1">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
          <h3 className="text-2xl font-black text-gray-600">載入中...</h3>
        </div>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="text-center p-12">
        <div className="bg-gray-100 border-4 border-gray-400 p-8 transform -rotate-2">
          <h3 className="text-2xl font-black text-gray-600 mb-4">
            還沒有收藏任何遊戲
          </h3>
          <p className="font-bold text-gray-500">
            開始搜尋或新增您的第一款遊戲吧！
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {collections.map((item) => (
          <div
            key={item.id}
            className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000000] transform hover:scale-105 transition-transform"
          >
            {/* 遊戲標題 */}
            <h3 className="font-black text-lg mb-2 line-clamp-2">
              {item.gameTitle}
            </h3>

            {/* 狀態標籤 */}
            <div
              className={`inline-block px-3 py-1 border-2 border-black font-bold text-sm mb-3 ${getStatusColor(
                item.status
              )}`}
            >
              {getStatusText(item.status)}
            </div>

            {/* 評分 */}
            {item.rating && (
              <div className="flex items-center mb-2">
                <span className="font-bold text-sm mr-2">評分:</span>
                <div className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className={`text-lg ${
                        i < item.rating! ? "text-yellow-500" : "text-gray-300"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 備註 */}
            {item.notes && (
              <p className="text-sm font-bold text-gray-600 mb-3 line-clamp-2">
                💬 {item.notes}
              </p>
            )}

            {/* 自定義遊戲標記 */}
            {item.isCustomGame && (
              <div className="bg-orange-200 border-2 border-orange-400 px-2 py-1 text-xs font-bold text-orange-800 mb-3">
                手動新增
              </div>
            )}

            {/* 新增時間 */}
            <div className="text-xs font-bold text-gray-500 mb-4">
              新增於 {new Date(item.addedAt).toLocaleDateString()}
            </div>

            {/* 操作按鈕 */}
            <div className="flex gap-2">
              <button
                onClick={() => setEditingGame(item)}
                className="flex-1 bg-blue-400 border-2 border-black px-3 py-1 font-bold text-sm hover:bg-blue-500 transition-colors"
                disabled={deletingGameId === item.id}
              >
                編輯
              </button>
              <button
                onClick={() => openDeleteModal(item.id, item.gameTitle, item.isCustomGame)}
                className="flex-1 bg-red-400 border-2 border-black px-3 py-1 font-bold text-sm hover:bg-red-500 transition-colors disabled:opacity-50"
                disabled={deletingGameId === item.id}
              >
                {deletingGameId === item.id ? "刪除中..." : "刪除"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 編輯遊戲彈窗 */}
      {editingGame && (
        <EditGameModal
          game={editingGame}
          isOpen={true}
          onClose={() => setEditingGame(null)}
          onSuccess={() => {
            setEditingGame(null);
            onUpdate();
          }}
        />
      )}

      {/* 刪除確認 Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        title={deleteModal.isCustomGame ? "確認刪除自定義遊戲" : "確認移除遊戲"}
        message={deleteModal.isCustomGame ? "這個動作無法復原，確定要刪除這個自定義遊戲嗎？" : "確定要從收藏中移除這個遊戲嗎？"}
        itemName={deleteModal.gameName}
      />
    </>
  );
}
