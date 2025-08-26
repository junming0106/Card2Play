'use client'

import Link from 'next/link'

export default function Home() {
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
              遊戲收藏
            </h2>
            <p className="text-lg font-bold text-black mb-6">
              管理你的 NINTENDO SWITCH 遊戲收藏
            </p>
            <Link href="/dashboard" className="btn-brutalist inline-block">開始收藏</Link>
          </div>

          <div className="card-brutalist bg-purple-400 transform -rotate-1 hover:rotate-0 transition-transform duration-100 text-center">
            <h2
              className="text-3xl font-black mb-4"
              style={{ textShadow: "3px 3px 1px #fbe020" }}
            >
              交易市集
            </h2>
            <p className="text-lg font-bold text-black mb-6">
              與其他玩家交易遊戲卡片
            </p>
            <Link href="/dashboard" className="btn-brutalist inline-block">進入市集</Link>
          </div>

          <div className="card-brutalist bg-green-400 transform rotate-1 hover:rotate-0 transition-transform duration-100 text-center">
            <h2
              className="text-3xl font-black mb-4"
              style={{ textShadow: "3px 3px 1px #fbe020" }}
            >
              智慧推薦
            </h2>
            <p className="text-lg font-bold text-black mb-6">
              基於你的偏好推薦新遊戲
            </p>
            <Link href="/dashboard" className="btn-brutalist inline-block">探索遊戲</Link>
          </div>
        </div>

        <section className="bg-black text-white border-8 border-red-500 p-8 shadow-[8px_8px_0px_#ff0000] mb-8">
          <h2 className="text-4xl font-black mb-6 text-center">立即開始！</h2>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-yellow-400 text-black border-4 border-white px-8 py-4 font-black text-xl hover:bg-red-500 hover:text-white transform hover:scale-105 transition-all duration-100 inline-block text-center">
              免費註冊
            </Link>
            <Link href="/login" className="bg-white text-black border-4 border-yellow-400 px-8 py-4 font-black text-xl hover:bg-yellow-400 transform hover:scale-105 transition-all duration-100 inline-block text-center">
              立即登入
            </Link>
          </div>
        </section>

        <footer className="text-center bg-red-500 border-4 border-black p-6">
          <p className="text-2xl font-black text-white">
            © 2024 CARD2PLAY - 讓遊戲交易更簡單粗暴！
          </p>
        </footer>
      </div>
    </main>
  );
}
