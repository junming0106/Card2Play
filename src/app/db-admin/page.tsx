"use client";

import React, { useState, useEffect } from "react";

interface DatabaseStatus {
  success: boolean;
  status?: string;
  existingTables?: string[];
  missingTables?: string[];
  error?: string;
}

export default function DatabaseAdminPage() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [initSecret, setInitSecret] = useState("");
  const [message, setMessage] = useState("");

  // 檢查資料庫狀態
  const checkStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/db/init');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('檢查狀態失敗:', error);
      setMessage("檢查狀態失敗");
    } finally {
      setLoading(false);
    }
  };

  // 初始化資料庫
  const initDatabase = async () => {
    if (!initSecret) {
      setMessage("請輸入初始化密鑰");
      return;
    }

    setLoading(true);
    setMessage("");
    
    try {
      const response = await fetch('/api/db/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secret: initSecret }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage("✅ 資料庫初始化成功！");
        checkStatus(); // 重新檢查狀態
      } else {
        setMessage(`❌ 初始化失敗: ${data.error}`);
      }
    } catch (error) {
      console.error('初始化失敗:', error);
      setMessage("❌ 初始化請求失敗");
    } finally {
      setLoading(false);
    }
  };

  // 頁面載入時檢查狀態
  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="min-h-screen bg-purple-300 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 標題 */}
        <header className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000000] mb-8">
          <h1 className="text-3xl font-black text-center">
            🗄️ PostgreSQL 資料庫管理
          </h1>
          <p className="text-center text-gray-600 font-bold mt-2">
            Card2Play 資料庫狀態檢查與初始化
          </p>
        </header>

        {/* 狀態顯示 */}
        <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000000] mb-6">
          <h2 className="text-xl font-black mb-4">📊 資料庫狀態</h2>
          
          {loading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
              <p className="font-bold mt-2">檢查中...</p>
            </div>
          )}

          {status && !loading && (
            <div className="space-y-4">
              <div className={`p-4 border-2 ${
                status.status === 'initialized' 
                  ? 'border-green-500 bg-green-100' 
                  : 'border-yellow-500 bg-yellow-100'
              }`}>
                <p className="font-black">
                  狀態: {status.status === 'initialized' ? '✅ 已初始化' : '⚠️ 未完成'}
                </p>
              </div>

              {status.existingTables && status.existingTables.length > 0 && (
                <div className="p-4 border-2 border-blue-500 bg-blue-100">
                  <p className="font-black mb-2">✅ 現有資料表:</p>
                  <ul className="list-disc list-inside">
                    {status.existingTables.map(table => (
                      <li key={table} className="font-bold">{table}</li>
                    ))}
                  </ul>
                </div>
              )}

              {status.missingTables && status.missingTables.length > 0 && (
                <div className="p-4 border-2 border-red-500 bg-red-100">
                  <p className="font-black mb-2">❌ 缺少資料表:</p>
                  <ul className="list-disc list-inside">
                    {status.missingTables.map(table => (
                      <li key={table} className="font-bold">{table}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <button
            onClick={checkStatus}
            disabled={loading}
            className="mt-4 bg-blue-500 text-white border-2 border-black px-4 py-2 font-black hover:bg-blue-600 disabled:opacity-50"
          >
            🔄 重新檢查
          </button>
        </div>

        {/* 初始化控制 */}
        <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000000] mb-6">
          <h2 className="text-xl font-black mb-4">🚀 資料庫初始化</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block font-black mb-2">初始化密鑰:</label>
              <input
                type="password"
                value={initSecret}
                onChange={(e) => setInitSecret(e.target.value)}
                placeholder="輸入 DB_INIT_SECRET"
                className="w-full p-3 border-2 border-black font-bold"
              />
              <p className="text-sm text-gray-600 mt-1">
                請輸入 .env.local 中的 DB_INIT_SECRET 值
              </p>
            </div>

            <button
              onClick={initDatabase}
              disabled={loading || !initSecret}
              className="bg-green-500 text-white border-2 border-black px-6 py-3 font-black hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? '初始化中...' : '🗄️ 初始化資料庫'}
            </button>
          </div>

          {message && (
            <div className={`mt-4 p-4 border-2 ${
              message.includes('✅') 
                ? 'border-green-500 bg-green-100' 
                : 'border-red-500 bg-red-100'
            }`}>
              <p className="font-black">{message}</p>
            </div>
          )}
        </div>

        {/* 使用說明 */}
        <div className="bg-gray-100 border-4 border-gray-400 p-6">
          <h2 className="text-xl font-black mb-4">📖 使用說明</h2>
          <div className="space-y-2 text-sm">
            <p className="font-bold">1. 確保已設定 Vercel PostgreSQL 連接字串</p>
            <p className="font-bold">2. 在 .env.local 中設定 DB_INIT_SECRET</p>
            <p className="font-bold">3. 點擊「初始化資料庫」建立所需資料表</p>
            <p className="font-bold">4. 完成後即可使用 PostgreSQL 配對功能</p>
          </div>
        </div>
      </div>
    </div>
  );
}