"use client";

import React, { useState } from "react";
import { CollectionItemExtended, CollectionStatus } from "@/types/collection";
import { useAuth } from "@/components/auth/AuthProvider";

interface EditGameModalProps {
  game: CollectionItemExtended;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditGameModal({
  game,
  isOpen,
  onClose,
  onSuccess,
}: EditGameModalProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<CollectionStatus>(game.status);
  const [rating, setRating] = useState<number | undefined>(game.rating);
  const [notes, setNotes] = useState(game.notes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/collections?gameId=${game.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          status,
          rating: rating || null,
          notes: notes.trim() || null,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const result = await response.json();
        setError(result.message || "更新失敗");
      }
    } catch (error) {
      setError("網路錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  // 自動清除錯誤訊息
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-2 sm:p-4 z-[9999] overflow-y-auto">
      <div className="bg-white border-4 sm:border-8 border-black shadow-[8px_8px_0px_#000000] sm:shadow-[16px_16px_0px_#000000] max-w-md w-full my-4 transform -rotate-1">
        <div className="p-6">
          {/* 標題 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black">編輯遊戲</h2>
            <button
              onClick={onClose}
              className="bg-red-500 text-white w-8 h-8 border-4 border-black font-black hover:bg-red-600 transition-colors"
              disabled={loading}
            >
              ✕
            </button>
          </div>

          {/* 遊戲資訊 */}
          <div className="bg-gray-100 border-4 border-gray-400 p-4 mb-6 transform rotate-1">
            <div className="font-black text-lg mb-2">{game.gameTitle}</div>
            <div className="flex gap-2 text-sm font-bold text-gray-600">
              {game.isCustomGame && (
                <>
                  <span className="bg-orange-200 border border-orange-400 px-2 py-1 text-xs text-orange-800">
                    🎨 自定義遊戲
                  </span>
                </>
              )}
              <span>新增於 {new Date(game.addedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="mb-4 bg-red-100 border-4 border-red-500 p-3 text-center">
              <p className="font-black text-red-800">{error}</p>
            </div>
          )}

          {/* 編輯表單 */}
          <form onSubmit={handleSubmit}>
            {/* 收藏狀態 */}
            <div className="mb-4">
              <label className="block font-black text-lg mb-2">收藏狀態</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "持有中", label: "持有中", color: "bg-green-400" },
                  { value: "想要交換", label: "想要交換", color: "bg-yellow-400" },
                  { value: "已借出", label: "已借出", color: "bg-blue-400" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value as CollectionStatus)}
                    className={`p-3 border-4 border-black font-bold transition-all ${
                      status === option.value
                        ? `${option.color} transform scale-105`
                        : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 評分 */}
            <div className="mb-4">
              <label className="block font-black text-lg mb-2">評分</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setRating(undefined)}
                  className={`px-3 py-2 border-4 border-black font-bold ${
                    rating === undefined
                      ? "bg-gray-400"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  無評分
                </button>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`px-3 py-2 border-4 border-black font-bold ${
                      rating === star
                        ? "bg-yellow-400 text-yellow-900"
                        : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    {star}★
                  </button>
                ))}
              </div>
            </div>

            {/* 備註 */}
            <div className="mb-6">
              <label className="block font-black text-lg mb-2">備註</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="寫下您對這款遊戲的想法..."
                className="w-full p-3 border-4 border-black font-bold placeholder-gray-500 resize-none"
                rows={3}
                maxLength={200}
                disabled={loading}
              />
              <div className="text-right text-sm font-bold text-gray-500 mt-1">
                {notes.length}/200
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-400 border-4 border-black px-4 py-3 font-black hover:bg-gray-500 transition-colors"
                disabled={loading}
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-500 text-white border-4 border-black px-4 py-3 font-black hover:bg-blue-600 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "更新中..." : "更新收藏"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
