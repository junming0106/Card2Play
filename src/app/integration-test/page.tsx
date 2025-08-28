"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

interface TestResult {
  step: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
}

export default function IntegrationTestPage() {
  const { user, loading } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const updateLastResult = (status: 'success' | 'error', message: string, data?: any) => {
    setTestResults(prev => {
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      if (lastIndex >= 0) {
        updated[lastIndex] = {
          ...updated[lastIndex],
          status,
          message,
          data
        };
      }
      return updated;
    });
  };

  const runIntegrationTest = async () => {
    if (!user) {
      alert('請先登入再進行測試');
      return;
    }

    setTesting(true);
    setTestResults([]);

    try {
      // 步驟 1：檢查用戶同步狀態
      addTestResult({
        step: '1. 檢查用戶同步狀態',
        status: 'pending',
        message: '檢查中...'
      });

      const idToken = await user.getIdToken();
      const syncCheckResponse = await fetch('/api/users/sync', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      const syncCheckResult = await syncCheckResponse.json();
      
      if (syncCheckResponse.ok) {
        updateLastResult('success', '用戶同步狀態檢查成功', syncCheckResult.data);
      } else {
        updateLastResult('error', `同步狀態檢查失敗: ${syncCheckResult.error}`, syncCheckResult);
        return;
      }

      // 步驟 2：如果未同步，執行同步
      if (!syncCheckResult.data?.synced) {
        addTestResult({
          step: '2. 執行用戶同步',
          status: 'pending',
          message: '同步中...'
        });

        const syncResponse = await fetch('/api/users/sync', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        });

        const syncResult = await syncResponse.json();

        if (syncResponse.ok) {
          updateLastResult('success', '用戶同步成功', syncResult.data);
        } else {
          updateLastResult('error', `用戶同步失敗: ${syncResult.error}`, syncResult);
          return;
        }
      } else {
        addTestResult({
          step: '2. 用戶已同步',
          status: 'success',
          message: '用戶已存在於 PostgreSQL'
        });
      }

      // 步驟 3：測試配對功能
      addTestResult({
        step: '3. 測試 PostgreSQL 配對功能',
        status: 'pending',
        message: '執行配對查詢...'
      });

      const matchResponse = await fetch('/api/matching-pg', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      const matchResult = await matchResponse.json();

      if (matchResponse.ok) {
        updateLastResult('success', 
          `配對查詢成功，找到 ${matchResult.data?.matches?.length || 0} 個配對`, 
          matchResult.data
        );
      } else {
        updateLastResult('error', `配對查詢失敗: ${matchResult.error}`, matchResult);
      }

      // 步驟 4：性能測試總結
      addTestResult({
        step: '4. 整合測試完成',
        status: 'success',
        message: 'Google OAuth + PostgreSQL 整合測試成功！'
      });

    } catch (error) {
      console.error('整合測試錯誤:', error);
      updateLastResult('error', `測試過程發生錯誤: ${error}`, null);
    } finally {
      setTesting(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
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
      <div className="max-w-6xl mx-auto">
        {/* 標題 */}
        <header className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000000] mb-8">
          <h1 className="text-3xl font-black text-center">
            🔗 Google OAuth + PostgreSQL 整合測試
          </h1>
          <p className="text-center text-gray-600 font-bold mt-2">
            端到端功能驗證
          </p>
        </header>

        {/* 用戶狀態 */}
        <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000000] mb-6">
          <h2 className="text-xl font-black mb-4">👤 當前用戶狀態</h2>
          
          {user ? (
            <div className="bg-green-100 border-2 border-green-500 p-4">
              <h3 className="font-black text-green-800 mb-2">✅ 已登入</h3>
              <div className="text-sm font-bold space-y-1">
                <p><strong>UID:</strong> {user.uid}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Name:</strong> {user.displayName}</p>
                <p><strong>Email Verified:</strong> {user.emailVerified ? '✅' : '❌'}</p>
              </div>
            </div>
          ) : (
            <div className="bg-red-100 border-2 border-red-500 p-4">
              <h3 className="font-black text-red-800 mb-2">❌ 未登入</h3>
              <p className="font-bold">請先登入再進行整合測試</p>
            </div>
          )}
        </div>

        {/* 測試控制 */}
        <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000000] mb-6">
          <h2 className="text-xl font-black mb-4">🧪 整合測試控制</h2>
          
          <div className="flex gap-4">
            <button
              onClick={runIntegrationTest}
              disabled={!user || testing}
              className="bg-blue-500 text-white border-2 border-black px-6 py-3 font-black hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? '🔄 測試中...' : '🚀 開始整合測試'}
            </button>
            
            <button
              onClick={clearResults}
              disabled={testing}
              className="bg-gray-500 text-white border-2 border-black px-6 py-3 font-black hover:bg-gray-600 disabled:opacity-50"
            >
              🗑️ 清除結果
            </button>
          </div>
        </div>

        {/* 測試結果 */}
        {testResults.length > 0 && (
          <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000000] mb-6">
            <h2 className="text-xl font-black mb-4">📊 測試結果</h2>
            
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 border-2 ${
                    result.status === 'success'
                      ? 'border-green-500 bg-green-100'
                      : result.status === 'error'
                      ? 'border-red-500 bg-red-100'
                      : 'border-yellow-500 bg-yellow-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-black">
                      {result.status === 'success' ? '✅' : 
                       result.status === 'error' ? '❌' : '⏳'} {result.step}
                    </h3>
                  </div>
                  
                  <p className="font-bold text-sm mb-2">{result.message}</p>
                  
                  {result.data && (
                    <details className="mt-2">
                      <summary className="font-bold text-xs cursor-pointer">查看詳細資料</summary>
                      <pre className="text-xs bg-gray-800 text-green-400 p-2 mt-1 rounded overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 測試步驟說明 */}
        <div className="bg-gray-100 border-4 border-gray-400 p-6">
          <h2 className="text-xl font-black mb-4">📋 測試步驟說明</h2>
          <div className="space-y-2 text-sm font-bold">
            <p>1. 檢查 Google 用戶是否已同步到 PostgreSQL</p>
            <p>2. 如果未同步，自動執行同步操作</p>
            <p>3. 使用真實的 PostgreSQL 用戶 ID 執行配對查詢</p>
            <p>4. 驗證整個 Google → Firebase → PostgreSQL 流程</p>
          </div>
        </div>
      </div>
    </div>
  );
}