"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { sendVerificationEmail, reloadUser } from "@/lib/firebase/auth";

export default function VerifyEmailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // 自動清除訊息
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage("");
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  // 檢查用戶是否已登入
  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    // 如果已經驗證，直接跳轉到 dashboard
    if (user.emailVerified) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleResendEmail = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    const { error } = await sendVerificationEmail();

    if (error) {
      setError("重新發送失敗，請稍後再試");
    } else {
      setMessage("驗證郵件已重新發送，請檢查您的信箱");
    }

    setLoading(false);
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    const { error } = await reloadUser();

    if (error) {
      setError("檢查失敗，請稍後再試");
    } else if (user?.emailVerified) {
      setMessage("驗證成功！即將跳轉到首頁...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } else {
      setMessage("郵件尚未驗證，請檢查您的信箱");
    }

    setLoading(false);
  };

  if (!user) {
    return null; // 避免閃爍
  }

  return (
    <div className="min-h-screen bg-green-300 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border-8 border-black p-6 shadow-[16px_16px_0px_#000000] transform rotate-1">
        <header className="text-center mb-6 bg-yellow-400 border-4 border-black p-4 transform -rotate-2">
          <h2 className="text-2xl font-black text-black">📧 驗證您的電子郵件</h2>
        </header>

        <div className="space-y-4 mb-6">
          <div className="bg-blue-100 border-4 border-blue-500 p-4">
            <h3 className="font-black text-blue-800 mb-2">驗證郵件已發送</h3>
            <p className="font-bold text-blue-700 text-sm">
              我們已發送驗證郵件到：
              <br />
              <span className="text-red-600">{user.email}</span>
            </p>
          </div>

          <div className="bg-orange-100 border-4 border-orange-500 p-4">
            <h3 className="font-black text-orange-800 mb-2">📋 驗證步驟</h3>
            <ol className="font-bold text-orange-700 text-sm space-y-1">
              <li>1. 檢查您的電子郵件信箱</li>
              <li>2. 找到來自 Firebase 的驗證郵件</li>
              <li>3. 點擊郵件中的驗證連結</li>
              <li>4. 回到此頁面點擊「檢查驗證狀態」</li>
            </ol>
          </div>
        </div>

        {message && (
          <div className="mb-4 bg-green-100 border-4 border-green-500 p-3 text-center">
            <p className="font-black text-green-800">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-100 border-4 border-red-500 p-3 text-center">
            <p className="font-black text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleCheckVerification}
            disabled={loading}
            className="btn-brutalist w-full bg-green-500 text-white text-lg py-3 disabled:opacity-50"
          >
            {loading ? "檢查中..." : "🔍 檢查驗證狀態"}
          </button>

          <button
            onClick={handleResendEmail}
            disabled={loading}
            className="w-full bg-yellow-400 text-black border-4 border-black font-bold text-lg py-3 hover:bg-orange-400 transform hover:scale-105 transition-all duration-100 disabled:opacity-50"
          >
            {loading ? "發送中..." : "📨 重新發送驗證郵件"}
          </button>

          <div className="text-center">
            <button
              onClick={() => router.push("/login")}
              className="bg-gray-400 text-black border-4 border-black px-6 py-2 font-bold hover:bg-gray-500 transform hover:scale-105 transition-all duration-100"
            >
              ← 回到登入頁面
            </button>
          </div>
        </div>

        <div className="mt-6 text-center bg-red-100 border-4 border-red-500 p-3">
          <p className="font-bold text-red-800 text-sm">
            ⚠️ 沒有收到郵件？請檢查垃圾郵件資料夾
          </p>
        </div>
      </div>
    </div>
  );
}