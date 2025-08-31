"use client";

import React, { useState } from "react";
import { NintendoSwitchGame, CollectionStatus } from "@/types/collection";
import { useAuth } from "@/components/auth/AuthProvider";
import DraggableModal from "@/components/ui/DraggableModal";

interface AddGameModalProps {
  game: NintendoSwitchGame;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddGameModal({ game, isOpen, onClose, onSuccess }: AddGameModalProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<CollectionStatus>("持有中");
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🎮 開始新增遊戲流程...');
    console.log('👤 用戶狀態:', user ? `已登入 (${user.uid})` : '未登入');
    
    if (!user) {
      console.log('❌ 用戶未登入，無法繼續');
      setError("請先登入才能新增遊戲");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const idToken = await user.getIdToken();
      console.log('🎫 取得 ID Token，長度:', idToken.length);
      console.log('📤 準備發送請求資料:', {
        gameTitle: game,
        status,
        rating: rating || null,
        notes: notes.trim() || null,
        isCustomGame: false,
      });

      const response = await fetch("/api/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          gameTitle: game,
          status,
          rating: rating || null,
          notes: notes.trim() || null,
          isCustomGame: false,
        }),
      });

      console.log('📥 收到回應狀態:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ 新增成功:', result);
        onSuccess();
        onClose();
        // 重置表單
        setStatus("持有中");
        setRating(undefined);
        setNotes("");
      } else {
        const result = await response.json();
        console.log('❌ 新增失敗:', result);
        setError(result.error || result.message || "新增失敗");
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

  return (
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      title="➕ 新增遊戲"
      maxWidth="max-w-md"
    >

          {/* 遊戲資訊 */}
          <div className="bg-gray-100 border-4 border-gray-400 p-4 mb-6 transform -rotate-1">
            <div className="font-black text-lg mb-2">
              {game}
            </div>
            <div className="text-sm font-bold text-gray-600">
              Nintendo Switch 遊戲
            </div>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="mb-4 bg-red-100 border-4 border-red-500 p-3 text-center">
              <p className="font-black text-red-800">{error}</p>
            </div>
          )}

          {/* 新增表單 */}
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
              <label className="block font-black text-lg mb-2">評分（可選）</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRating(undefined)}
                  className={`px-3 py-2 border-4 border-black font-bold ${
                    rating === undefined ? "bg-gray-400" : "bg-white hover:bg-gray-100"
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
              <label className="block font-black text-lg mb-2">備註（可選）</label>
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
                className="flex-1 bg-green-500 text-white border-4 border-black px-4 py-3 font-black hover:bg-green-600 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "新增中..." : "新增到收藏"}
              </button>
            </div>
          </form>
    </DraggableModal>
  );
}