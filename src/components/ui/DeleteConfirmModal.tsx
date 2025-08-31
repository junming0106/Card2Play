"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  itemName?: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
}: DeleteConfirmModalProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // 確保在客戶端渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  // 初始化彈窗位置到畫面中心
  useEffect(() => {
    if (isOpen && mounted) {
      // 使用預設寬高來計算中心位置
      const modalWidth = 400; // 大約的 modal 寬度
      const modalHeight = 300; // 大約的 modal 高度
      const centerX = Math.max(0, (window.innerWidth - modalWidth) / 2);
      const centerY = Math.max(0, (window.innerHeight - modalHeight) / 2);
      setPosition({ x: centerX, y: centerY });
    }
  }, [isOpen, mounted]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // 允許彈窗在整個螢幕範圍內拖曳，僅保留基本邊界
      const modalWidth = modalRef.current?.offsetWidth || 400;
      const modalHeight = modalRef.current?.offsetHeight || 300;

      // 允許部分超出邊界，但至少保留 50px 可見區域
      const minVisibleArea = 50;
      const maxX = window.innerWidth - minVisibleArea;
      const maxY = window.innerHeight - minVisibleArea;
      const minX = -(modalWidth - minVisibleArea);
      const minY = 0; // 頂部不能超出

      setPosition({
        x: Math.max(minX, Math.min(newX, maxX)),
        y: Math.max(minY, Math.min(newY, maxY)),
      });
    },
    [isDragging, dragStart.x, dragStart.y]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      // 全域事件監聽，確保在整個螢幕範圍內都能拖曳
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      // 防止拖曳時選取其他元素
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isOpen || !mounted) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  // 使用 Portal 將 Modal 渲染到 body 直接子元素，纞過所有容器限制
  const modalContent = (
    <div className="fixed inset-0" style={{ zIndex: 99999 }}>
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* 可拖曳的 Modal 內容 */}
      <div
        ref={modalRef}
        className="fixed bg-white border-4 border-black shadow-[8px_8px_0px_#000000] w-auto min-w-[300px] max-w-[500px]"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          userSelect: isDragging ? "none" : "auto",
          zIndex: 100000,
          pointerEvents: "auto",
        }}
      >
        {/* 拖曳標題欄 */}
        <div
          className="bg-gray-800 text-white px-4 py-2 font-black cursor-move flex justify-between items-center"
          onMouseDown={handleMouseDown}
        >
          <span>🗑️ {title}</span>
          <button
            onClick={onClose}
            className="text-white hover:text-red-300 text-xl leading-none"
            onMouseDown={(e) => e.stopPropagation()}
          >
            ×
          </button>
        </div>

        {/* Modal 內容 */}
        <div className="p-6">
          <div className="text-center">
            {/* 警告圖示 */}
            <div className="text-6xl mb-4">⚠️</div>

            {/* 訊息內容 */}
            <div className="mb-6">
              {message && (
                <p className="font-bold text-gray-700 mb-2">{message}</p>
              )}
              {itemName && (
                <p className="font-black text-lg text-red-600 bg-red-100 border-2 border-red-300 p-2 rounded">
                  「{itemName}」
                </p>
              )}
            </div>

            {/* 按鈕 */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={onClose}
                className="bg-gray-500 text-white border-2 border-black px-6 py-3 font-black hover:bg-gray-600 transition-colors"
                onMouseDown={(e) => e.stopPropagation()}
              >
                ❌ 取消
              </button>
              <button
                onClick={handleConfirm}
                className="bg-red-500 text-white border-2 border-black px-6 py-3 font-black hover:bg-red-600 transition-colors"
                onMouseDown={(e) => e.stopPropagation()}
              >
                🗑️ 確認刪除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // \u4f7f\u7528 createPortal \u5c07 modal \u6e32\u67d3\u5230 document.body
  return createPortal(modalContent, document.body);
}
