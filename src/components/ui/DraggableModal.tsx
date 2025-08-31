"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface DraggableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
}

export default function DraggableModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-[500px]",
  showCloseButton = true,
}: DraggableModalProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isPositioned, setIsPositioned] = useState(false);

  // 確保在客戶端渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  // 置中彈窗的函數
  const centerModal = useCallback(() => {
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      const centerX = Math.max(0, (window.innerWidth - rect.width) / 2);
      const centerY = Math.max(0, (window.innerHeight - rect.height) / 2);
      setPosition({ x: centerX, y: centerY });
      setIsPositioned(true);
    }
  }, []);

  // 初始化彈窗位置到畫面中心
  useEffect(() => {
    if (isOpen && mounted) {
      setIsPositioned(false);
      // 延遲讓 DOM 渲染完成
      const timer = setTimeout(centerModal, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, mounted, centerModal]);

  // 使用 ResizeObserver 監聽 modal 尺寸變化並重新置中
  useEffect(() => {
    if (!modalRef.current || !isOpen) return;

    const resizeObserver = new ResizeObserver(() => {
      if (isPositioned) {
        centerModal();
      }
    });

    resizeObserver.observe(modalRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isOpen, centerModal, isPositioned]);

  // 監聽視窗大小變化，重新置中
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      if (isPositioned && modalRef.current) {
        centerModal();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, centerModal, isPositioned]);

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
      const modalWidth = modalRef.current?.offsetWidth || 500;
      const modalHeight = modalRef.current?.offsetHeight || 400;

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

  // 使用 Portal 將 Modal 渲染到 body 直接子元素，繞過所有容器限制
  const modalContent = (
    <div className="fixed inset-0" style={{ zIndex: 99999 }}>
      {/* 半透明背景遮罩 */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* 可拖曳的 Modal 內容 */}
      <div
        ref={modalRef}
        className={`fixed bg-white border-4 border-black shadow-[8px_8px_0px_#000000] w-auto min-w-[300px] ${maxWidth}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          userSelect: isDragging ? "none" : "auto",
          zIndex: 100000,
          pointerEvents: "auto",
          // 初始狀態先隱藏，等位置計算完成後再顯示
          visibility: isPositioned ? 'visible' : 'hidden',
        }}
      >
        {/* 拖曳標題欄 */}
        <div
          className="bg-gray-800 text-white px-4 py-2 font-black cursor-move flex justify-between items-center"
          onMouseDown={handleMouseDown}
        >
          <span>{title}</span>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-white hover:text-red-300 text-xl leading-none"
              onMouseDown={(e) => e.stopPropagation()}
            >
              ×
            </button>
          )}
        </div>

        {/* Modal 內容 */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );

  // 使用 createPortal 將 modal 渲染到 document.body
  return createPortal(modalContent, document.body);
}
