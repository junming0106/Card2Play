# Card2Play 專案需求文件 (PRD)

## 專案概述

Card2Play 是一個 Next.js 全端遊戲卡片收藏與交易平台，整合 Firebase 後端服務，讓用戶可以管理 Nintendo Switch 遊戲收藏、進行交易，並獲得個人化的遊戲推薦。

## 開發流程

1. 建立 Git 倉庫（GitHub）
2. 設定 Next.js 全端專案結構
3. 配置 Firebase 服務（Authentication、Firestore、Storage）
4. 建立 .env.local 與環境變數
5. 實作核心功能模組

## 核心功能

### 功能 1: 遊戲資料管理系統

- **描述**: 整合現有的 Nintendo 遊戲爬取功能，建立完整的遊戲資料庫
- **輸入**: Nintendo 官方 API 資料、用戶手動新增的遊戲資訊
- **輸出**: Firestore 結構化遊戲資料庫、遊戲搜尋與篩選功能
- **業務規則**:
  - 自動去重遊戲資料
  - 支援多語言遊戲標題
  - 使用 Next.js API Routes 定期同步

### 功能 2: 個人收藏管理

- **描述**: 用戶可以建立與管理個人遊戲收藏清單
- **輸入**: Firebase Auth 用戶選擇的遊戲、收藏狀態
- **輸出**: 個人化收藏清單、統計分析
- **業務規則**:
  - Firebase Security Rules 權限控制
  - 即時同步收藏狀態
  - 收藏統計與成就系統

### 功能 3: 遊戲交易市集

- **描述**: 用戶間的遊戲交易與交換平台
- **輸入**: 交易物品資訊、價格、交易條件
- **輸出**: 交易媒合、交易記錄、評價系統
- **業務規則**:
  - Firebase Cloud Functions 處理交易邏輯
  - 安全的交易流程
  - 即時通知系統

### 功能 4: 智慧推薦系統

- **描述**: 基於用戶收藏與偏好的遊戲推薦
- **輸入**: Firestore 用戶收藏記錄、評分資料
- **輸出**: 個人化推薦清單、相似用戶推薦
- **業務規則**:
  - 使用 Firebase ML 或外部 AI API
  - Next.js 增量靜態再生 (ISR) 快取推薦

## 技術棧

- **全端框架**: Next.js 14 (App Router)
- **前端技術**: React 18 + TypeScript + Tailwind CSS
- **後端服務**: Firebase (Authentication、Firestore、Storage、Functions)
- **部署平台**: Vercel (前端) + Firebase Hosting
- **狀態管理**: Zustand 或 React Context API
- **UI 框架**: brutalism web design
- **表單處理**: React Hook Form + Zod
- **圖片優化**: Next.js Image

## 系統架構

```
Card2Play/
├── public/                      # 靜態資源
│   ├── icons/
│   ├── images/
│   └── favicon.ico
│
├── src/                        # 主要程式碼
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 認證相關頁面群組
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/       # 主要功能頁面群組
│   │   │   ├── games/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── collection/
│   │   │   │   └── page.tsx
│   │   │   ├── trading/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   └── profile/
│   │   │       └── page.tsx
│   │   ├── api/               # Next.js API Routes
│   │   │   ├── games/
│   │   │   │   ├── route.ts   # GET, POST /api/games
│   │   │   │   ├── sync/
│   │   │   │   │   └── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── collections/
│   │   │   │   └── route.ts
│   │   │   ├── trading/
│   │   │   │   └── route.ts
│   │   │   └── recommendations/
│   │   │       └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx         # 根布局
│   │   ├── page.tsx           # 首頁
│   │   ├── loading.tsx        # 全局載入頁面
│   │   └── error.tsx          # 全局錯誤頁面
│   │
│   ├── components/            # 可重用組件
│   │   ├── ui/               # shadcn/ui 組件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── AuthProvider.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── games/
│   │   │   ├── GameCard.tsx
│   │   │   ├── GameGrid.tsx
│   │   │   ├── GameSearch.tsx
│   │   │   └── GameFilter.tsx
│   │   ├── collection/
│   │   │   ├── CollectionGrid.tsx
│   │   │   ├── CollectionStats.tsx
│   │   │   └── AddToCollection.tsx
│   │   ├── trading/
│   │   │   ├── TradeCard.tsx
│   │   │   ├── TradeForm.tsx
│   │   │   └── TradeChat.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── Modal.tsx
│   │       └── Toast.tsx
│   │
│   ├── lib/                   # 核心函式庫
│   │   ├── firebase/
│   │   │   ├── config.ts      # Firebase 初始化設定
│   │   │   ├── auth.ts        # 認證相關函數
│   │   │   ├── firestore.ts   # Firestore 操作
│   │   │   ├── storage.ts     # Storage 操作
│   │   │   └── admin.ts       # 後端專用 Admin SDK
│   │   ├── utils/
│   │   │   ├── cn.ts          # className 合併工具
│   │   │   ├── constants.ts   # 常數定義
│   │   │   ├── helpers.ts     # 輔助函數
│   │   │   ├── validation.ts  # Zod 驗證 schemas
│   │   │   └── formatting.ts  # 格式化函數
│   │   ├── hooks/             # 自定義 React Hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useFirestore.ts
│   │   │   ├── useCollection.ts
│   │   │   └── useTrading.ts
│   │   └── stores/            # Zustand stores
│   │       ├── authStore.ts
│   │       ├── gamesStore.ts
│   │       └── collectionStore.ts
│   │
│   ├── types/                 # TypeScript 型別定義
│   │   ├── auth.ts
│   │   ├── game.ts
│   │   ├── collection.ts
│   │   ├── trading.ts
│   │   └── api.ts
│   │
│   └── scripts/              # 工具腳本
│       ├── seed-games.ts     # 初始化遊戲資料
│       └── sync-nintendo.ts  # 同步 Nintendo 資料
│
├── firebase/                 # Firebase 配置
│   ├── firestore.rules      # Firestore 安全規則
│   ├── storage.rules        # Storage 安全規則
│   ├── firebase.json        # Firebase 專案設定
│   └── functions/           # Cloud Functions
│       ├── src/
│       │   ├── index.ts
│       │   ├── games.ts
│       │   ├── trading.ts
│       │   └── notifications.ts
│       ├── package.json
│       └── tsconfig.json
│
├── docs/
│   ├── API.md
│   ├── FIREBASE_SETUP.md
│   ├── DEPLOYMENT.md
│   └── SECURITY.md
│
├── .env.local.example       # 環境變數範例
├── .env.local              # 本地環境變數
├── .gitignore
├── next.config.js          # Next.js 設定
├── tailwind.config.js      # Tailwind CSS 設定
├── tsconfig.json           # TypeScript 設定
├── package.json
└── README.md
```

## Firebase 設定

### Firestore 資料結構:

```
users/                       # 用戶集合
  {userId}/
    - email: string
    - displayName: string
    - photoURL: string
    - createdAt: timestamp
    - updatedAt: timestamp

games/                       # 遊戲集合
  {gameId}/
    - title: string
    - titleCn: string
    - releaseDate: string
    - publisher: string
    - platform: string
    - media: string
    - rating: string
    - thumbImg: string
    - createdAt: timestamp

collections/                 # 用戶收藏集合
  {userId}/
    games/                   # 子集合
      {gameId}/
        - status: string     # owned, wanted, completed
        - rating: number
        - notes: string
        - addedAt: timestamp

trades/                      # 交易集合
  {tradeId}/
    - sellerId: string
    - buyerId: string
    - gameId: string
    - price: number
    - status: string         # pending, accepted, completed, cancelled
    - createdAt: timestamp
    - updatedAt: timestamp
```

## 安全性要求

### Firebase Security Rules:

```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用戶只能存取自己的資料
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // 遊戲資料公開讀取，只有管理員可寫入
    match /games/{gameId} {
      allow read: if true;
      allow write: if request.auth != null &&
                   request.auth.token.admin == true;
    }

    // 個人收藏只有本人可存取
    match /collections/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Next.js 安全實作:

- API Routes 中驗證 Firebase ID Token
- 伺服器端組件使用 Firebase Admin SDK
- 客戶端組件使用 Firebase Client SDK
- 環境變數安全管理
- CSP (Content Security Policy) 設定

## 效能優化

### Next.js 特性:

- App Router 自動程式碼分割
- Server Components 減少客戶端 JavaScript
- 增量靜態再生 (ISR) 快取遊戲資料
- Image 組件自動圖片最佳化
- 字型最佳化

### Firebase 最佳化:

- Firestore 複合索引設定
- 分頁查詢降低讀取成本
- Firebase Storage 圖片 CDN
- Cloud Functions 冷啟動最佳化

## SEO 優化

- 伺服器端渲染遊戲詳細頁面
- 動態 Metadata API 設定 meta tags
- 結構化資料 (JSON-LD)
- sitemap.xml 自動生成
- robots.txt 設定

## 部署架構

- **前端**: Vercel 自動部署
- **後端**: Firebase Functions
- **資料庫**: Firebase Firestore
- **CDN**: Firebase Storage + Vercel Edge Network
- **監控**: Vercel Analytics + Firebase Performance

## 開發階段

1. **專案設定**: Next.js 初始化 + Firebase 配置
2. **認證系統**: Firebase Authentication 整合
3. **資料管理**: Firestore CRUD 操作
4. **核心功能**: 遊戲管理與收藏系統
5. **交易功能**: 用戶間交易系統
6. **優化部署**: 效能優化與正式上線
