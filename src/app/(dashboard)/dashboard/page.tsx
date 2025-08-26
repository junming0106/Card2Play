"use client";

import React from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { signOutUser } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await signOutUser();
    if (!error) {
      router.push("/login");
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-purple-300 flex flex-col items-center justify-center p-4">
        <div className="max-w-4xl w-full">
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
              <h3 className="text-2xl font-black mb-4">我的收藏</h3>
              <p className="font-bold">管理你的遊戲收藏清單</p>
              <button 
                onClick={() => router.push('/collection')}
                className="btn-brutalist mt-4 bg-green-500 text-white"
              >
                查看收藏
              </button>
            </div>

            <div className="card-brutalist bg-cyan-400">
              <h3 className="text-2xl font-black mb-4">遊戲瀏覽</h3>
              <p className="font-bold">探索 Nintendo Switch 遊戲</p>
              <button className="btn-brutalist mt-4 bg-blue-500 text-white">
                瀏覽遊戲
              </button>
            </div>

            <div className="card-brutalist bg-pink-400">
              <h3 className="text-2xl font-black mb-4">交易中心</h3>
              <p className="font-bold">與其他玩家交易遊戲</p>
              <button className="btn-brutalist mt-4 bg-orange-500 text-white">
                開始交易
              </button>
            </div>
          </div>

          <div className="mt-8 bg-white border-8 border-black p-6 shadow-[16px_16px_0px_#000000]">
            <h2 className="text-3xl font-black mb-4">用戶資訊</h2>
            <div className="space-y-2 font-bold">
              <p>
                <span className="text-red-500">EMAIL:</span> {user?.email}
              </p>
              <p>
                <span className="text-blue-500">名稱:</span>{" "}
                {user?.displayName || "未設定"}
              </p>
              <p>
                <span className="text-purple-500">驗證狀態:</span>{" "}
                <span className={user?.emailVerified ? "text-green-600" : "text-red-600"}>
                  {user?.emailVerified ? "✅ 已驗證" : "❌ 未驗證"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
