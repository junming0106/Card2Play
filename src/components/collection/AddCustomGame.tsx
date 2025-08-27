"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

interface AddCustomGameProps {
  onSuccess: () => void;
  disabled?: boolean;
}

export default function AddCustomGame({ onSuccess, disabled = false }: AddCustomGameProps) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gameTitle, setGameTitle] = useState("");
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
      const response = await fetch("/api/custom-games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({ title: gameTitle.trim() }),
      });

      if (response.ok) {
        onSuccess();
        setIsModalOpen(false);
        setGameTitle("");
      } else {
        const result = await response.json();
        setError(result.message || "新增失敗");
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
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-2 sm:p-4 z-[9999] overflow-y-auto">
          <div className="bg-white border-4 sm:border-8 border-black shadow-[8px_8px_0px_#000000] sm:shadow-[16px_16px_0px_#000000] max-w-lg w-full my-4 transform -rotate-1">
            <div className="p-3 sm:p-6">
              {/* 標題 */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-black">手動新增遊戲</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-red-500 text-white w-8 h-8 border-2 sm:border-4 border-black font-black hover:bg-red-600 transition-colors text-sm sm:text-base"
                  disabled={loading}
                >
                  ✕
                </button>
              </div>

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
            </div>
          </div>
        </div>
      )}
    </>
  );
}