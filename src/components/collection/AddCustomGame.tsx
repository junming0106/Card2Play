"use client";

import React, { useState } from "react";
import { CollectionStatus } from "@/types/collection";
import { useAuth } from "@/components/auth/AuthProvider";
import DraggableModal from "@/components/ui/DraggableModal";

interface AddCustomGameProps {
  onSuccess: () => void;
  disabled?: boolean;
}

export default function AddCustomGame({ onSuccess, disabled = false }: AddCustomGameProps) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gameTitle, setGameTitle] = useState("");
  const [status, setStatus] = useState<CollectionStatus>("持有中");
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGameTitle(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!gameTitle.trim()) {
      setError("請輸入遊戲名稱");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 直接新增到 PostgreSQL
      const response = await fetch("/api/custom-games-pg", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          customTitle: gameTitle.trim(),
          customPublisher: "自定義",
          releaseDate: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' }).split('T')[0],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ 遊戲成功新增到 PostgreSQL:", result.data.game.title);
        onSuccess();
        setIsModalOpen(false);
        setGameTitle("");
        setStatus("持有中");
        setRating(undefined);
        setNotes("");
      } else {
        const result = await response.json();
        setError(result.error || result.message || "新增失敗");
      }
    } catch (error) {
      console.error("❌ 新增遊戲錯誤:", error);
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
    <>
      {/* 新增按鈕 */}
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={disabled || loading}
        className="w-full bg-pink-500 text-white border-4 border-black p-4 font-black text-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
      >
        ➕ 手動新增遊戲
      </button>

      {/* 新增自定義遊戲彈窗 */}
      <DraggableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="🎨 手動新增遊戲"
        maxWidth="max-w-lg"
      >

              {/* 說明 */}
              <div className="bg-yellow-100 border-2 sm:border-4 border-yellow-400 p-3 sm:p-4 mb-4 sm:mb-6 transform rotate-1">
                <p className="font-bold text-yellow-800 text-sm sm:text-base">
                  🎨 找不到您的遊戲？沒問題！<br />
                  手動新增您的自定義遊戲到收藏中
                </p>
              </div>

              {/* 錯誤訊息 */}
              {error && (
                <div className="mb-4 bg-red-100 border-4 border-red-500 p-3 text-center">
                  <p className="font-black text-red-800">{error}</p>
                </div>
              )}

              {/* 新增表單 */}
              <form onSubmit={handleSubmit}>
                {/* 遊戲名稱 */}
                <div className="mb-6">
                  <label className="block font-black text-base sm:text-lg mb-2">
                    遊戲名稱 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={gameTitle}
                    onChange={handleInputChange}
                    placeholder="輸入遊戲名稱"
                    className="w-full p-2 sm:p-3 border-2 sm:border-4 border-black font-bold placeholder-gray-500 text-sm sm:text-base"
                    maxLength={100}
                    disabled={loading}
                    required
                  />
                </div>

                {/* 收藏狀態 */}
                <div className="mb-4">
                  <label className="block font-black text-base sm:text-lg mb-2">收藏狀態</label>
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
                        className={`p-2 sm:p-3 border-2 sm:border-4 border-black font-bold transition-all text-sm sm:text-base ${
                          status === option.value 
                            ? `${option.color} transform scale-105` 
                            : "bg-white hover:bg-gray-100"
                        }`}
                        disabled={loading}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 評分 */}
                <div className="mb-4">
                  <label className="block font-black text-base sm:text-lg mb-2">評分（可選）</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRating(undefined)}
                      className={`px-2 sm:px-3 py-1 sm:py-2 border-2 sm:border-4 border-black font-bold text-sm sm:text-base ${
                        rating === undefined ? "bg-gray-400" : "bg-white hover:bg-gray-100"
                      }`}
                      disabled={loading}
                    >
                      無評分
                    </button>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`px-2 sm:px-3 py-1 sm:py-2 border-2 sm:border-4 border-black font-bold text-sm sm:text-base ${
                          rating === star 
                            ? "bg-yellow-400 text-yellow-900" 
                            : "bg-white hover:bg-gray-100"
                        }`}
                        disabled={loading}
                      >
                        {star}★
                      </button>
                    ))}
                  </div>
                </div>

                {/* 備註 */}
                <div className="mb-6">
                  <label className="block font-black text-base sm:text-lg mb-2">備註（可選）</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="寫下您對這款遊戲的想法..."
                    className="w-full p-2 sm:p-3 border-2 sm:border-4 border-black font-bold placeholder-gray-500 resize-none text-sm sm:text-base"
                    rows={3}
                    maxLength={200}
                    disabled={loading}
                  />
                  <div className="text-right text-xs sm:text-sm font-bold text-gray-500 mt-1">
                    {notes.length}/200
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div className="flex gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-gray-400 border-2 sm:border-4 border-black px-3 sm:px-4 py-2 sm:py-3 font-black hover:bg-gray-500 transition-colors text-sm sm:text-base"
                    disabled={loading}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-pink-500 text-white border-2 sm:border-4 border-black px-3 sm:px-4 py-2 sm:py-3 font-black hover:bg-pink-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
                    disabled={loading || !gameTitle.trim()}
                  >
                    {loading ? "新增中..." : "新增遊戲"}
                  </button>
                </div>
              </form>
      </DraggableModal>
    </>
  );
}