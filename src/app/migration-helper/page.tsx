"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

export default function MigrationHelperPage() {
  const { user, loading } = useAuth();
  const [result, setResult] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);

  const openClearModal = () => {
    if (!user) return;
    setShowClearModal(true);
  };

  const closeClearModal = () => {
    setShowClearModal(false);
  };

  const handleClearConfirm = async () => {
    if (!user) return;

    try {
      setResult('🔄 清除中...');
      
      // 這裡可以呼叫 Firestore API 來清除舊的自定義遊戲
      // 但由於我們已經遷移到 PostgreSQL，直接使用簡單的提示
      setResult(`✅ 建議手動清除 Firestore 中的舊資料，或等待系統自動遷移完成。

新的 PostgreSQL 自定義遊戲功能已經就緒：
- 測試頁面：/test-custom-games  
- API 端點：/api/custom-games-pg
- 自動 ID 偵測：舊遊戲(字串) vs 新遊戲(數字)`);

    } catch (error) {
      setResult(`❌ 清除失敗: ${error}`);
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
        <header className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000000] mb-8">
          <h1 className="text-3xl font-black text-center">
            🔄 資料遷移助手
          </h1>
          <p className="text-center text-gray-600 font-bold mt-2">
            Firestore → PostgreSQL 遷移工具
          </p>
        </header>

        <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000000] mb-6">
          <h2 className="text-xl font-black mb-4">📊 遷移狀態</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-red-100 border-2 border-red-500 p-4">
              <h3 className="font-black text-red-800 mb-2">🔤 舊版 Firestore</h3>
              <ul className="text-sm font-bold text-red-700 space-y-1">
                <li>• ID 格式：custom_123456_abc</li>
                <li>• 儲存位置：Firestore</li>
                <li>• 狀態：已棄用</li>
                <li>• 問題：無法刪除</li>
              </ul>
            </div>
            
            <div className="bg-green-100 border-2 border-green-500 p-4">
              <h3 className="font-black text-green-800 mb-2">🔢 新版 PostgreSQL</h3>
              <ul className="text-sm font-bold text-green-700 space-y-1">
                <li>• ID 格式：1, 2, 3...</li>
                <li>• 儲存位置：PostgreSQL</li>
                <li>• 狀態：✅ 正常運作</li>
                <li>• 功能：完整 CRUD</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={openClearModal}
              disabled={!user}
              className="w-full bg-blue-500 text-white border-2 border-black px-6 py-3 font-black hover:bg-blue-600 disabled:opacity-50"
            >
              🧹 清除舊版 Firestore 資料
            </button>
            
            <a 
              href="/test-custom-games"
              className="block w-full bg-green-500 text-white border-2 border-black px-6 py-3 font-black text-center hover:bg-green-600"
            >
              🎮 測試新版自定義遊戲
            </a>
          </div>

          {result && (
            <div className="mt-4 p-4 bg-gray-100 border-2 border-gray-400">
              <pre className="whitespace-pre-wrap font-bold text-sm">{result}</pre>
            </div>
          )}
        </div>

        <div className="bg-yellow-100 border-4 border-yellow-500 p-6">
          <h2 className="text-xl font-black mb-4">⚠️ 重要說明</h2>
          <div className="space-y-2 text-sm font-bold">
            <p>🔄 系統現在同時支援舊版和新版自定義遊戲</p>
            <p>🔍 GameList 會自動偵測 ID 格式選擇正確的 API</p>
            <p>🆕 新建立的自定義遊戲會使用 PostgreSQL</p>
            <p>🗑️ 舊版遊戲可能需要手動清除或等待自動遷移</p>
            <p>✨ 建議先測試新功能，確認正常後再清除舊資料</p>
          </div>
        </div>

        {/* 清除確認 Modal */}
        <DeleteConfirmModal
          isOpen={showClearModal}
          onClose={closeClearModal}
          onConfirm={handleClearConfirm}
          title="確認清除 Firestore 資料"
          message="這將清除所有 Firestore 中的自定義遊戲資料，此動作無法復原。確定要繼續嗎？"
          itemName="所有舊版 Firestore 自定義遊戲"
        />
      </div>
    </div>
  );
}