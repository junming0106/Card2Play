import Cookies from 'js-cookie'

// Cookie 設定
const COOKIE_OPTIONS = {
  expires: 2, // 2 天後過期
  secure: process.env.NODE_ENV === 'production', // 生產環境使用 HTTPS
  sameSite: 'lax' as const, // 改用 lax 以避免兼容性問題
  path: '/' // 全域可用
}

// Cookie 鍵名
export const COOKIE_KEYS = {
  AUTH_TOKEN: 'card2play_auth_token',
  USER_INFO: 'card2play_user_info'
} as const

// 儲存認證 token
export const setAuthToken = (token: string): void => {
  try {
    Cookies.set(COOKIE_KEYS.AUTH_TOKEN, token, COOKIE_OPTIONS)
  } catch (error) {
    console.error('儲存認證 token 失敗:', error)
  }
}

// 取得認證 token
export const getAuthToken = (): string | null => {
  try {
    return Cookies.get(COOKIE_KEYS.AUTH_TOKEN) || null
  } catch (error) {
    console.error('讀取認證 token 失敗:', error)
    return null
  }
}

// 儲存用戶資訊
export const setUserInfo = (userInfo: {
  uid: string
  email: string
  displayName: string
  emailVerified: boolean
}): void => {
  try {
    const userInfoString = JSON.stringify(userInfo)
    Cookies.set(COOKIE_KEYS.USER_INFO, userInfoString, COOKIE_OPTIONS)
  } catch (error) {
    console.error('儲存用戶資訊失敗:', error)
  }
}

// 取得用戶資訊
export const getUserInfo = (): {
  uid: string
  email: string
  displayName: string
  emailVerified: boolean
} | null => {
  try {
    const userInfoString = Cookies.get(COOKIE_KEYS.USER_INFO)
    if (!userInfoString) return null
    
    return JSON.parse(userInfoString)
  } catch (error) {
    console.error('讀取用戶資訊失敗:', error)
    return null
  }
}

// 清除所有認證相關 cookies
export const clearAuthCookies = (): void => {
  try {
    Cookies.remove(COOKIE_KEYS.AUTH_TOKEN, { path: '/' })
    Cookies.remove(COOKIE_KEYS.USER_INFO, { path: '/' })
    console.log('已清除所有認證 cookies')
  } catch (error) {
    console.error('清除認證 cookies 失敗:', error)
  }
}

// 檢查是否有有效的認證狀態
export const hasValidAuth = (): boolean => {
  const token = getAuthToken()
  const userInfo = getUserInfo()
  return !!(token && userInfo)
}