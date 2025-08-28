// 遊戲資料類型
export interface Game {
  id: string
  title: string
  titleCn?: string
  releaseDate: string
  publisher: string
  platform: string
  media: 'package' | 'eshop'
  rating?: string
  language?: string
  thumbImg?: string
  link?: string
  createdAt: Date
  updatedAt: Date
}

// 創建遊戲請求
export interface CreateGameRequest {
  title: string
  titleCn?: string
  releaseDate: string
  publisher: string
  platform: string
  media: 'package' | 'eshop'
  rating?: string
  language?: string
  thumbImg?: string
  link?: string
}

// 更新遊戲請求
export interface UpdateGameRequest extends Partial<CreateGameRequest> {
  id?: string
}

// 遊戲搜尋參數
export interface GameSearchParams {
  search?: string
  platform?: string
  publisher?: string
  media?: 'package' | 'eshop'
  releaseYear?: number
}