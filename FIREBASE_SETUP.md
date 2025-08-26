# Firebase 設定指南

## 1. 建立 Firebase 專案

### 步驟 1: 訪問 Firebase Console
1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 使用您的 Google 帳號登入

### 步驟 2: 建立新專案
1. 點擊 "Create a project" 或 "新增專案"
2. 輸入專案名稱：`card2play` 或 `Card2Play`
3. 選擇是否啟用 Google Analytics（建議啟用）
4. 選擇 Analytics 帳戶（如果啟用）
5. 點擊 "建立專案"

## 2. 設定 Web 應用程式

### 步驟 1: 新增 Web App
1. 在專案總覽頁面，點擊 Web 圖示 (`</>`)
2. 輸入應用程式暱稱：`card2play-web`
3. 勾選 "Also set up Firebase Hosting"（可選）
4. 點擊 "註冊應用程式"

### 步驟 2: 取得配置資訊
複製顯示的配置物件，類似：
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## 3. 更新環境變數

### 編輯 `.env.local` 檔案
將上述配置值填入 `.env.local` 檔案：

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Firebase Admin SDK (後端使用)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# 其他環境變數
NEXTAUTH_SECRET=your_random_secret_string_32_characters
NEXTAUTH_URL=http://localhost:3000
```

## 4. 啟用 Firebase 服務

### 4.1 Authentication
1. 在左側選單選擇 "Authentication"
2. 點擊 "Get started"
3. 選擇 "Sign-in method" 標籤
4. 啟用以下登入方式：
   - **Email/Password**: 點擊 → 啟用 → 儲存
   - **Google**: 點擊 → 啟用 → 選擇專案支援電子郵件 → 儲存

### 4.2 Firestore Database
1. 在左側選單選擇 "Firestore Database"
2. 點擊 "Create database"
3. 選擇 "Start in test mode"（開發階段）
4. 選擇資料庫位置（建議選擇亞洲）
5. 點擊 "Done"

### 4.3 Storage
1. 在左側選單選擇 "Storage"
2. 點擊 "Get started"
3. 選擇 "Start in test mode"
4. 選擇儲存位置（與 Firestore 相同）
5. 點擊 "Done"

## 5. 設定 Firebase Admin SDK

### 步驟 1: 建立服務帳戶
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇您的 Firebase 專案
3. 前往 "IAM & Admin" > "Service accounts"
4. 點擊 "Create service account"
5. 輸入服務帳戶名稱：`card2play-admin`
6. 授予角色：`Firebase Admin SDK Administrator Service Agent`
7. 點擊 "Done"

### 步驟 2: 產生私鑰
1. 在服務帳戶列表中，點擊剛建立的服務帳戶
2. 選擇 "Keys" 標籤
3. 點擊 "Add Key" > "Create new key"
4. 選擇 "JSON" 格式
5. 下載 JSON 檔案

### 步驟 3: 更新環境變數
從下載的 JSON 檔案中取得：
- `project_id` → `FIREBASE_PROJECT_ID`
- `client_email` → `FIREBASE_CLIENT_EMAIL`  
- `private_key` → `FIREBASE_PRIVATE_KEY`

## 6. 部署安全規則

### Firestore 規則
```bash
# 在專案根目錄執行
firebase deploy --only firestore:rules
```

### Storage 規則  
```bash
# 在專案根目錄執行
firebase deploy --only storage
```

## 7. 驗證設定

### 重啟開發伺服器
```bash
npm run dev
```

### 檢查項目
1. 瀏覽器開啟 `http://localhost:3000`
2. 應該不再看到 Firebase 配置錯誤
3. 可以正常訪問登入頁面
4. 開發者工具 Console 沒有錯誤訊息

## 8. 常見問題

### Q: 私鑰格式錯誤
A: 確保 `FIREBASE_PRIVATE_KEY` 包含 `\n` 換行符號，格式如下：
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour key content\n-----END PRIVATE KEY-----\n"
```

### Q: CORS 錯誤
A: 在 Firebase Console 的 Authentication 設定中，將 `localhost:3000` 加入授權網域。

### Q: 權限拒絕錯誤
A: 檢查 Firestore 和 Storage 規則是否正確部署。

## 9. 安全性檢查清單

- [ ] `.env.local` 已加入 `.gitignore`
- [ ] 生產環境使用嚴格的 Firestore 規則
- [ ] Admin SDK 私鑰安全儲存
- [ ] 啟用 App Check（生產環境）
- [ ] 設定適當的 CORS 政策

---

**注意**: 完成以上設定後，請重新啟動開發伺服器以使環境變數生效。