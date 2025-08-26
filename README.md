# Card2Play

Nintendo Switch 遊戲卡片收藏與交易平台

## 🎮 專案概述

Card2Play 是一個使用 Next.js 14 + Firebase 開發的全端遊戲收藏平台，讓用戶可以：

- 📚 管理 Nintendo Switch 遊戲收藏
- 💰 與其他玩家交易遊戲
- 🤖 獲得個人化遊戲推薦
- 📊 追蹤遊戲統計與成就

## 🛠 技術棧

### 前端
- **Next.js 14** - App Router
- **React 18** - UI 框架
- **TypeScript** - 類型安全
- **Tailwind CSS** - 樣式框架
- **Firebase SDK** - 前端服務

### 後端
- **Next.js API Routes** - 後端邏輯
- **Firebase Admin SDK** - 伺服器端 Firebase
- **Firebase Authentication** - 用戶認證
- **Firebase Firestore** - NoSQL 資料庫
- **Firebase Storage** - 檔案儲存

### 部署
- **Vercel** - 前端部署
- **Firebase Functions** - 後端函數
- **Firebase Hosting** - 靜態資源

## 📦 安裝與設定

### 1. 複製專案
```bash
git clone https://github.com/yourusername/card2play.git
cd card2play
```

### 2. 安裝依賴
```bash
npm install
```

### 3. 設定環境變數
複製 `.env.local.example` 為 `.env.local` 並填入 Firebase 配置：

```bash
cp .env.local.example .env.local
```

填入以下變數：
```env
# Firebase 配置
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. Firebase 設定

1. 在 [Firebase Console](https://console.firebase.google.com/) 建立新專案
2. 啟用 Authentication (Email/Password + Google)
3. 建立 Firestore 資料庫
4. 啟用 Storage
5. 下載服務帳戶私鑰並配置環境變數

### 5. 部署 Firebase 規則
```bash
cd firebase
firebase login
firebase init
firebase deploy --only firestore:rules,storage:rules
```

## 🚀 開發

### 啟動開發伺服器
```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000) 查看結果。

### 建置專案
```bash
npm run build
```

### 類型檢查
```bash
npm run type-check
```

### 程式碼檢查
```bash
npm run lint
```

## 📁 專案結構

```
card2play/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 認證頁面群組
│   │   ├── (dashboard)/       # 主要功能頁面
│   │   ├── api/               # API Routes
│   │   ├── globals.css        # 全局樣式
│   │   ├── layout.tsx         # 根布局
│   │   └── page.tsx           # 首頁
│   ├── components/            # React 組件
│   │   ├── auth/             # 認證組件
│   │   ├── games/            # 遊戲組件
│   │   ├── collection/       # 收藏組件
│   │   └── layout/           # 布局組件
│   ├── lib/                  # 核心函式庫
│   │   ├── firebase/         # Firebase 配置
│   │   ├── utils/            # 工具函數
│   │   ├── hooks/            # 自定義 Hooks
│   │   └── stores/           # 狀態管理
│   └── types/                # TypeScript 類型
├── firebase/                 # Firebase 配置
│   ├── firestore.rules      # Firestore 安全規則
│   ├── storage.rules        # Storage 安全規則
│   └── firebase.json        # Firebase 專案設定
├── public/                   # 靜態資源
└── docs/                     # 文檔
```

## 🔒 安全性

### Firebase Security Rules
- **Firestore**: 用戶只能存取自己的資料
- **Storage**: 檔案存取權限控制
- **Authentication**: 多重認證方式

### API 安全
- Firebase ID Token 驗證
- 請求率限制
- 輸入驗證與過濾
- CORS 配置

## 🧪 測試

```bash
# 單元測試 (TODO: 設定測試框架)
npm run test

# E2E 測試 (TODO: 設定 Playwright)
npm run test:e2e
```

## 📋 API 端點

### 遊戲管理
- `GET /api/games` - 取得遊戲列表
- `POST /api/games` - 新增遊戲 (管理員)
- `POST /api/games/sync` - 同步 Nintendo 資料

### 收藏管理
- `GET /api/collections` - 取得用戶收藏
- `POST /api/collections` - 新增至收藏
- `DELETE /api/collections` - 從收藏移除

### 交易系統 (開發中)
- `GET /api/trading` - 取得交易列表
- `POST /api/trading` - 建立交易
- `PUT /api/trading/[id]` - 更新交易狀態

## 🚀 部署

### Vercel 部署 (推薦)
1. 連接 GitHub 倉庫到 Vercel
2. 設定環境變數
3. 自動部署

### Firebase Hosting
```bash
npm run build
npm run export
cd firebase
firebase deploy --only hosting
```

## 🤝 貢獻

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📝 授權

此專案採用 ISC 授權 - 查看 [LICENSE](LICENSE) 檔案了解詳情。

## 📞 聯絡

浚銘 - [GitHub](https://github.com/yourusername)

專案連結: [https://github.com/yourusername/card2play](https://github.com/yourusername/card2play)

## 🙏 致謝

- [Next.js](https://nextjs.org/) - React 全端框架
- [Firebase](https://firebase.google.com/) - 後端服務
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Nintendo](https://www.nintendo.com/) - 遊戲資料來源