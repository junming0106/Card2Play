// Nintendo Switch 遊戲資料類型 (現在只是遊戲名稱字串)
export type NintendoSwitchGame = string

// 用戶自定義遊戲類型
export interface UserCustomGame {
  id: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  isCustom: true
}

// 收藏狀態類型
export type CollectionStatus = '持有中' | '想要交換' | '已借出'

// 擴展的收藏項目類型
export interface CollectionItemExtended {
  id: string
  gameId: string
  gameTitle: string
  status: CollectionStatus
  rating?: number // 1-5 評分
  notes?: string
  addedAt: Date
  updatedAt: Date
  isCustomGame: boolean
  customGameData?: UserCustomGame
}

// 收藏統計類型
export interface CollectionStats {
  total: number
  持有中: number
  想要交換: number
  已借出: number
  customGames: number
}

// 收藏請求類型
export interface AddToCollectionRequest {
  gameId: string
  gameTitle: string
  status: CollectionStatus
  rating?: number
  notes?: string
  isCustomGame?: boolean
  customGameData?: Partial<UserCustomGame>
}

// 更新收藏請求類型
export interface UpdateCollectionRequest {
  status?: CollectionStatus
  rating?: number
  notes?: string
}

// 創建自定義遊戲請求類型
export interface CreateCustomGameRequest {
  customTitle: string
  platform?: string
  media?: string
  customPublisher?: string
  releaseDate?: string
}

// 遊戲搜尋參數類型
export interface GameSearchParams {
  search?: string
}

// 收藏過濾參數類型
export interface CollectionFilterParams {
  search?: string
  status?: CollectionStatus
  rating?: number
  isCustomGame?: boolean
  sortBy?: 'addedAt' | 'gameTitle' | 'rating' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}