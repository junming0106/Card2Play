"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// 暫時的通知資料類型（未來可以從 API 取得）
interface Notification {
  id: string;
  type: 'trade_request' | 'trade_accepted' | 'trade_declined' | 'system';
  title: string;
  message: string;
  fromUser?: string;
  gameTitle?: string;
  timestamp: string;
  isRead: boolean;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'trade_request',
      title: '交換請求',
      message: '有人想要與你交換「薩爾達傳說 曠野之息」',
      fromUser: 'test@example.com',
      gameTitle: '薩爾達傳說 曠野之息',
      timestamp: '2025-08-28T10:30:00Z',
      isRead: false
    },
    {
      id: '2',
      type: 'trade_accepted',
      title: '交換成功',
      message: '你的交換請求已被接受！',
      fromUser: 'user@test.com',
      gameTitle: '超級瑪利歐 奧德賽',
      timestamp: '2025-08-27T15:20:00Z',
      isRead: true
    },
    {
      id: '3',
      type: 'system',
      title: '系統通知',
      message: '歡迎使用 CARD2PLAY 交換平台！',
      timestamp: '2025-08-26T09:00:00Z',
      isRead: true
    }
  ]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'trade_request':
        return '🤝';
      case 'trade_accepted':
        return '✅';
      case 'trade_declined':
        return '❌';
      case 'system':
        return '🔔';
      default:
        return '📧';
    }
  };

  const getNotificationColor = (type: Notification['type'], isRead: boolean) => {
    if (!isRead) {
      switch (type) {
        case 'trade_request':
          return 'bg-yellow-100 border-yellow-500';
        case 'trade_accepted':
          return 'bg-green-100 border-green-500';
        case 'trade_declined':
          return 'bg-red-100 border-red-500';
        case 'system':
          return 'bg-blue-100 border-blue-500';
        default:
          return 'bg-gray-100 border-gray-500';
      }
    }
    return 'bg-gray-50 border-gray-300';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} 分鐘前`;
    } else if (diffHours < 24) {
      return `${diffHours} 小時前`;
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    } else {
      return date.toLocaleDateString('zh-TW');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-purple-300 flex items-center justify-center px-2 sm:px-4 py-8 sm:py-12">
        <div className="w-full max-w-4xl mx-auto">
          {/* 回首頁按鈕 */}
          <div className="mb-4 sm:mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center bg-red-500 text-white border-4 border-black px-4 py-2 font-black text-sm sm:text-base hover:bg-red-600 transition-colors shadow-[4px_4px_0px_#000000] transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_#000000]"
            >
              🏠 回控制台
            </Link>
          </div>

          {/* 頁面標題 */}
          <header className="bg-white border-4 sm:border-8 border-black p-4 sm:p-6 shadow-[8px_8px_0px_#000000] sm:shadow-[16px_16px_0px_#000000] mb-5 sm:mb-8 transform -rotate-1">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-black mb-2">
                🔔 交換通知
              </h1>
              <p className="text-sm sm:text-lg font-bold text-gray-700 mb-2">
                查看你的交換請求和通知
              </p>
              {unreadCount > 0 && (
                <div className="inline-block bg-red-500 text-white px-3 sm:px-4 py-1 sm:py-2 border-2 sm:border-4 border-black font-black text-sm sm:text-base transform rotate-2">
                  {unreadCount} 則未讀
                </div>
              )}
            </div>
          </header>

          {/* 通知列表 */}
          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-4 border-black p-4 shadow-[4px_4px_0px_#000000] transform hover:scale-105 transition-transform ${getNotificationColor(notification.type, notification.isRead)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-black text-lg">
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <span className="bg-red-500 text-white px-2 py-1 text-xs font-black border-2 border-black">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-gray-700 mb-2">
                          {notification.message}
                        </p>
                        {notification.fromUser && (
                          <p className="text-sm font-bold text-gray-600 mb-1">
                            👤 來自: {notification.fromUser}
                          </p>
                        )}
                        {notification.gameTitle && (
                          <p className="text-sm font-bold text-gray-600 mb-1">
                            🎮 遊戲: {notification.gameTitle}
                          </p>
                        )}
                        <p className="text-xs font-bold text-gray-500">
                          🕐 {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                    
                    {/* 動作按鈕 */}
                    {notification.type === 'trade_request' && !notification.isRead && (
                      <div className="flex flex-col space-y-2 ml-4">
                        <button className="bg-green-500 text-white border-2 border-black px-3 py-1 font-bold text-sm hover:bg-green-600 transition-colors">
                          接受
                        </button>
                        <button className="bg-red-500 text-white border-2 border-black px-3 py-1 font-bold text-sm hover:bg-red-600 transition-colors">
                          拒絕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border-4 border-black p-8 text-center shadow-[8px_8px_0px_#000000] transform -rotate-1">
                <h2 className="text-2xl font-black text-gray-600 mb-4">
                  目前沒有任何通知
                </h2>
                <p className="font-bold text-gray-500">
                  開始交換遊戲後，相關通知會出現在這裡
                </p>
              </div>
            )}
          </div>

          {/* 說明區域 */}
          <div className="mt-8 bg-gray-100 border-4 border-gray-400 p-4 transform rotate-1">
            <h3 className="text-lg font-black mb-2">💡 通知說明</h3>
            <ul className="font-bold text-sm text-gray-700 list-disc list-inside space-y-1">
              <li>🤝 交換請求：其他玩家想與你交換遊戲</li>
              <li>✅ 交換成功：你的交換請求被接受</li>
              <li>❌ 交換被拒：你的交換請求被拒絕</li>
              <li>🔔 系統通知：平台重要訊息通知</li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}