// API 回應統一格式
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 分頁參數
export interface PaginationParams {
  page?: number
  limit?: number
}

// 分頁回應
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 遊戲相關 API 類型
export interface GameApiParams {
  search?: string
  platform?: string
  publisher?: string
  sortBy?: 'releaseDate' | 'title' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

// 收藏相關 API 類型
export interface CollectionApiParams {
  status?: 'owned' | 'wanted' | 'completed'
  sortBy?: 'addedAt' | 'title'
  sortOrder?: 'asc' | 'desc'
}

// 交易相關 API 類型
export interface TradeApiParams {
  status?: 'pending' | 'accepted' | 'completed' | 'cancelled'
  type?: 'selling' | 'buying'
  sortBy?: 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}