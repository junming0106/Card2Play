// Nintendo Switch 遊戲資料類型
export interface NintendoSwitchGame {
  id: string
  title: string
  titleCn?: string
  titleEn?: string
  publisher: string
  releaseDate: string
  genre?: string[]
  esrbRating?: string
  platform: string
  media: 'package' | 'eshop'
  imageUrl?: string
}

// 用戶自定義遊戲類型
export interface UserCustomGame extends Omit<NintendoSwitchGame, 'id' | 'genre' | 'esrbRating' | 'imageUrl'> {
  id: string
  userId: string
  createdAt: Date
  updatedAt: Date
  isCustom: true
  customTitle: string
  customPublisher?: string
}

// 收藏狀態類型
export type CollectionStatus = 'owned' | 'wanted' | 'completed' | 'trading'

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
  gameData?: NintendoSwitchGame
}

// 收藏統計類型
export interface CollectionStats {
  total: number
  owned: number
  wanted: number
  completed: number
  trading: number
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
  customPublisher?: string
  releaseDate?: string
  platform: string
  media: 'package' | 'eshop'
}

// 遊戲搜尋參數類型
export interface GameSearchParams {
  search?: string
  publisher?: string
  genre?: string
  platform?: string
  media?: 'package' | 'eshop'
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