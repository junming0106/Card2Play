"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { signOutUser } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await signOutUser();
    if (!error) {
      router.push("/login");
    }
  };

  return (
    <main className="min-h-screen bg-yellow-300 p-8 flex items-center justify-center">
      <div className="max-w-6xl mx-auto text-center">
        <header className="text-center mb-16 bg-red-500 border-8 border-black p-8 shadow-[12px_12px_0px_#000000]">
          <h1 className="text-6xl font-black text-white mb-4 transform -rotate-2">
            CARD2PLAY
          </h1>
          <p className="text-2xl font-bold text-black bg-white border-4 border-black p-4 inline-block transform rotate-1">
            NINTENDO SWITCH 遊戲卡片收藏與交易平台
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="card-brutalist bg-cyan-400 transform rotate-2 hover:rotate-0 transition-transform duration-100 text-center">
            <h2
              className="text-3xl font-black mb-4"
              style={{ textShadow: "3px 3px 1px #fbe020" }}
            >
              我的卡片
            </h2>
            <p className="text-lg font-bold text-black mb-6">
              管理你的 NINTENDO SWITCH 遊戲卡
            </p>
            <Link href="/dashboard" className="btn-brutalist inline-block">
              編輯卡包
            </Link>
          </div>

          <div className="card-brutalist bg-purple-400 transform -rotate-1 hover:rotate-0 transition-transform duration-100 text-center">
            <h2
              className="text-3xl font-black mb-4"
              style={{ textShadow: "3px 3px 1px #fbe020" }}
            >
              交換通知
            </h2>
            <p className="text-lg font-bold text-black mb-6">
              查看你的卡片有誰想要交換呢？！
            </p>
            <Link href="/dashboard" className="btn-brutalist inline-block">
              查看清單
            </Link>
          </div>

          <div className="card-brutalist bg-green-400 transform rotate-1 hover:rotate-0 transition-transform duration-100 text-center">
            <h2
              className="text-3xl font-black mb-4"
              style={{ textShadow: "3px 3px 1px #fbe020" }}
            >
              交換大廳
            </h2>
            <p className="text-lg font-bold text-black mb-6">
              選擇你想交換的遊戲卡吧！
            </p>
            <Link href="/dashboard" className="btn-brutalist inline-block">
              進入大廳
            </Link>
          </div>
        </div>

        <section className="bg-black text-white border-8 border-red-500 p-8 shadow-[8px_8px_0px_#ff0000] mb-8">
          {user ? (
            // 已登入用戶顯示歡迎信息和登出按鈕
            <>
              <h2 className="text-4xl font-black mb-6 text-center">
                歡迎回來！
              </h2>
              <div className="text-center mb-6">
                <p className="text-xl font-bold text-yellow-400 mb-2">
                  👋 {user.displayName || user.email}
                </p>
                <p className="text-lg font-bold text-white">
                  準備好管理您的遊戲收藏了嗎？
                </p>
              </div>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Link
                  href="/collection"
                  className="bg-green-400 text-black border-4 border-white px-8 py-4 font-black text-xl hover:bg-green-500 transform hover:scale-105 transition-all duration-100 inline-block text-center"
                >
                  🎮 進入收藏
                </Link>
                <button
                  onClick={handleSignOut}
                  className="bg-red-400 text-white border-4 border-yellow-400 px-8 py-4 font-black text-xl hover:bg-red-500 transform hover:scale-105 transition-all duration-100"
                >
                  🚪 登出
                </button>
              </div>
            </>
          ) : (
            // 未登入用戶顯示註冊和登入按鈕
            <>
              <h2 className="text-4xl font-black mb-6 text-center">
                立即開始！
              </h2>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="bg-yellow-400 text-black border-4 border-white px-8 py-4 font-black text-xl hover:bg-red-500 hover:text-white transform hover:scale-105 transition-all duration-100 inline-block text-center"
                >
                  免費註冊
                </Link>
                <Link
                  href="/login"
                  className="bg-white text-black border-4 border-yellow-400 px-8 py-4 font-black text-xl hover:bg-yellow-400 transform hover:scale-105 transition-all duration-100 inline-block text-center"
                >
                  立即登入
                </Link>
              </div>
            </>
          )}
        </section>

        <footer className="text-center bg-red-500 border-4 border-black p-6">
          <p className="text-2xl font-black text-white">
            © 2025 CARD2PLAY - 讓交換遊戲更簡單粗暴，暢玩遊戲順便交交朋友！
          </p>
        </footer>
      </div>
    </main>
  );
}
