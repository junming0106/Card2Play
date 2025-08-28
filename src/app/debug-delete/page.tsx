"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function DebugDeletePage() {
  const { user, loading } = useAuth();
  const [gameId, setGameId] = useState('custom_1756302904616_e4zhjm11l');
  const [testResult, setTestResult] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    if (user) {
      user.getIdToken().then(setToken);
    }
  }, [user]);

  const testDeleteAPI = async () => {
    if (!user || !token) {
      setTestResult('❌ 用戶未登入或 token 未取得');
      return;
    }

    try {
      setTestResult('🔄 測試中...');
      
      console.log('🧪 開始測試刪除 API');
      console.log('📋 遊戲 ID:', gameId);
      console.log('🎫 Token 長度:', token.length);
      console.log('👤 用戶 UID:', user.uid);
      console.log('📧 用戶 Email:', user.email);

      const response = await fetch(`/api/custom-games?gameId=${gameId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      console.log('📥 API 回應:', result);
      console.log('📊 回應狀態:', response.status);

      if (response.ok) {
        setTestResult(`✅ 刪除成功！\n${JSON.stringify(result, null, 2)}`);
      } else {
        setTestResult(`❌ 刪除失敗 (${response.status})\n${JSON.stringify(result, null, 2)}`);
      }

    } catch (error) {
      console.error('💥 測試錯誤:', error);
      setTestResult(`💥 測試錯誤: ${error}`);
    }
  };

  const testTokenValidation = async () => {
    if (!token) {
      setTestResult('❌ 沒有 token 可測試');
      return;
    }

    try {
      setTestResult('🔄 驗證 Token 中...');

      // 測試任何需要身份驗證的 API
      const response = await fetch('/api/users/sync', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        setTestResult(`✅ Token 有效！\n${JSON.stringify(result, null, 2)}`);
      } else {
        setTestResult(`❌ Token 無效 (${response.status})\n${JSON.stringify(result, null, 2)}`);
      }

    } catch (error) {
      setTestResult(`💥 Token 驗證錯誤: ${error}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-purple-300 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-300 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 標題 */}
        <header className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000000] mb-8">
          <h1 className="text-3xl font-black text-center">
            🛠️ 自定義遊戲刪除除錯工具
          </h1>
          <p className="text-center text-gray-600 font-bold mt-2">
            診斷刪除功能問題
          </p>
        </header>

        {/* 用戶狀態 */}
        <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000000] mb-6">
          <h2 className="text-xl font-black mb-4">👤 用戶狀態</h2>
          
          {user ? (
            <div className="space-y-2 text-sm font-bold">
              <p><span className="text-green-600">✅</span> 已登入</p>
              <p><strong>UID:</strong> {user.uid}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Email Verified:</strong> {user.emailVerified ? '✅' : '❌'}</p>
              <p><strong>Token 長度:</strong> {token ? token.length : '未取得'}</p>
              <p><strong>Token 前20字:</strong> {token ? token.substring(0, 20) : '未取得'}</p>
            </div>
          ) : (
            <p className="text-red-600 font-bold">❌ 未登入</p>
          )}
        </div>

        {/* 測試控制 */}
        <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000000] mb-6">
          <h2 className="text-xl font-black mb-4">🧪 測試控制</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block font-black mb-2">要刪除的遊戲 ID:</label>
              <input
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                className="w-full p-3 border-2 border-black font-mono text-sm"
                placeholder="輸入自定義遊戲 ID"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={testTokenValidation}
                disabled={!user || !token}
                className="bg-blue-500 text-white border-2 border-black px-4 py-2 font-black hover:bg-blue-600 disabled:opacity-50"
              >
                🔐 測試 Token 有效性
              </button>
              
              <button
                onClick={testDeleteAPI}
                disabled={!user || !token || !gameId}
                className="bg-red-500 text-white border-2 border-black px-4 py-2 font-black hover:bg-red-600 disabled:opacity-50"
              >
                🗑️ 測試刪除 API
              </button>
            </div>
          </div>
        </div>

        {/* 測試結果 */}
        {testResult && (
          <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000000] mb-6">
            <h2 className="text-xl font-black mb-4">📊 測試結果</h2>
            <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap">
              {testResult}
            </pre>
          </div>
        )}

        {/* 使用說明 */}
        <div className="bg-gray-100 border-4 border-gray-400 p-6">
          <h2 className="text-xl font-black mb-4">📖 使用說明</h2>
          <div className="space-y-2 text-sm font-bold">
            <p>1. 確保已透過 Google 登入</p>
            <p>2. 輸入要測試的自定義遊戲 ID</p>
            <p>3. 先測試 Token 有效性</p>
            <p>4. 再測試刪除 API</p>
            <p>5. 查看控制台日誌獲得更多詳情</p>
          </div>
        </div>
      </div>
    </div>
  );
}