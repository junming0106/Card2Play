"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { signOutUser } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 初始化顯示名稱
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
    }
  }, [user]);

  const handleSignOut = async () => {
    const { error } = await signOutUser();
    if (!error) {
      router.push("/login");
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !displayName.trim()) return;

    setLoading(true);
    setMessage("");

    try {
      // 使用 Firebase Auth 的 updateProfile 方法
      const { updateProfile } = await import('firebase/auth');
      await updateProfile(user, {
        displayName: displayName.trim(),
      });

      setMessage("個人資料更新成功！");
      setIsEditing(false);

      // 清除成功訊息
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("更新個人資料錯誤:", error);
      setMessage("更新失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setDisplayName(user?.displayName || "");
    setIsEditing(false);
    setMessage("");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-purple-300 flex flex-col items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          {/* 回首頁按鈕 */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center bg-red-500 text-white border-4 border-black px-4 py-2 font-black text-sm sm:text-base hover:bg-red-600 transition-colors shadow-[4px_4px_0px_#000000] transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_#000000]"
            >
              🏠 回首頁
            </Link>
          </div>

          <header className="bg-white border-8 border-black p-6 shadow-[16px_16px_0px_#000000] mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-black text-black mb-2">
                  歡迎來到 CARD2PLAY！
                </h1>
                <p className="text-xl font-bold text-black">
                  嗨，{user?.displayName || user?.email}！
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="btn-brutalist bg-red-500 text-white hover:bg-yellow-400 hover:text-black"
              >
                登出
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card-brutalist bg-yellow-400">
              <h3 className="text-2xl font-black mb-4">🎮 我的卡片</h3>
              <p className="font-bold">管理你的遊戲收藏清單</p>
              <button
                onClick={() => router.push("/collection")}
                className="btn-brutalist mt-4 bg-green-500 text-white"
              >
                查看收藏
              </button>
            </div>

            <div className="card-brutalist bg-pink-400">
              <h3 className="text-2xl font-black mb-4">🔔 交換通知</h3>
              <p className="font-bold">查看交換請求和通知</p>
              <button
                onClick={() => router.push("/notifications")}
                className="btn-brutalist mt-4 bg-orange-500 text-white"
              >
                查看通知
              </button>
            </div>

            <div className="card-brutalist bg-cyan-400">
              <h3 className="text-2xl font-black mb-4">🎯 交換大廳</h3>
              <p className="font-bold">尋找想要交換的遊戲夥伴</p>
              <button
                onClick={() => router.push("/hall")}
                className="btn-brutalist mt-4 bg-blue-500 text-white"
              >
                開始配對
              </button>
            </div>
          </div>

          <div className="mt-8 bg-white border-8 border-black p-6 shadow-[16px_16px_0px_#000000]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-3xl font-black">👤 個人資料</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-500 text-white border-4 border-black px-4 py-2 font-black hover:bg-blue-600 transition-colors shadow-[4px_4px_0px_#000000] transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_#000000]"
                >
                  ✏️ 編輯
                </button>
              )}
            </div>

            {/* 訊息顯示 */}
            {message && (
              <div
                className={`mb-4 p-3 border-4 font-black text-center ${
                  message.includes("成功")
                    ? "bg-green-100 border-green-500 text-green-800"
                    : "bg-red-100 border-red-500 text-red-800"
                }`}
              >
                {message}
              </div>
            )}

            <div className="space-y-4 font-bold">
              <div>
                <span className="text-red-500 block mb-2">📧 EMAIL:</span>
                <div className="bg-gray-100 border-4 border-gray-300 p-6">
                  {user?.email}
                </div>
              </div>

              <div>
                <span className="text-blue-500 block mb-2">👤 顯示名稱:</span>
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full p-3 border-4 border-black font-bold text-lg focus:outline-none focus:border-blue-500"
                      placeholder="輸入顯示名稱"
                      maxLength={50}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleUpdateProfile}
                        disabled={loading || !displayName.trim()}
                        className="bg-green-500 text-white border-4 border-black px-4 py-2 font-black hover:bg-green-600 transition-colors shadow-[4px_4px_0px_#000000] disabled:opacity-50"
                      >
                        {loading ? "更新中..." : "✅ 儲存"}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={loading}
                        className="bg-gray-500 text-white border-4 border-black px-4 py-2 font-black hover:bg-gray-600 transition-colors shadow-[4px_4px_0px_#000000] disabled:opacity-50"
                      >
                        ❌ 取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 border-4 border-gray-300 p-6">
                    {user?.displayName || "未設定"}
                  </div>
                )}
              </div>

              <div>
                <span className="text-purple-500 block mb-2">🔐 驗證狀態:</span>
                <div
                  className={`border-4 p-3 ${
                    user?.emailVerified
                      ? "bg-green-100 border-green-500 text-green-800"
                      : "bg-red-100 border-red-500 text-red-800"
                  }`}
                >
                  {user?.emailVerified ? "✅ 已驗證" : "❌ 未驗證"}
                </div>
              </div>

              <div>
                <span className="text-orange-500 block mb-2">📅 註冊時間:</span>
                <div className="bg-gray-100 border-4 border-gray-300 p-6">
                  {user?.metadata?.creationTime
                    ? new Date(user.metadata.creationTime).toLocaleString(
                        "zh-TW"
                      )
                    : "未知"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
