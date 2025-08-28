import { NextRequest } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase/admin'
import {
  verifyAuthToken,
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/utils/api'

interface MatchResult {
  playerId: string;
  playerEmail: string;
  gameTitle: string;
  matchedGame: string; // 我想要交換的遊戲
}

// GET /api/matching - 獲取配對結果
export async function GET(request: NextRequest) {
  try {
    console.log('🎯 開始遊戲配對...')
    
    const user = await verifyAuthToken(request)
    if (!user) {
      console.log('❌ 配對：身份驗證失敗')
      return createErrorResponse('未經授權', 401)
    }

    console.log('✅ 身份驗證成功，開始配對:', user.uid)

    // 1. 獲取當前用戶想要交換的遊戲
    const userWantedGamesSnapshot = await adminDb
      .collection(`collections/${user.uid}/games`)
      .where('status', '==', '想要交換')
      .get()

    if (userWantedGamesSnapshot.empty) {
      console.log('❌ 用戶沒有想要交換的遊戲')
      return createSuccessResponse([], '您目前沒有設定想要交換的遊戲')
    }

    const userWantedGames = userWantedGamesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    console.log('📋 用戶想要交換的遊戲:', userWantedGames.length, '款')

    // 2. 查詢其他用戶的持有中遊戲（改用簡單方式避免索引需求）
    const matches: MatchResult[] = []
    
    try {
      console.log('🎯 尋找配對，想要的遊戲:', userWantedGames.map(g => g.id))
      
      // 獲取所有用戶的收藏文檔
      const collectionsSnapshot = await adminDb
        .collection('collections')
        .limit(50) // 限制查詢用戶數量
        .get()

      console.log('🔍 找到', collectionsSnapshot.size, '個用戶收藏')
      
      // 遍歷每個用戶
      for (const userCollectionDoc of collectionsSnapshot.docs) {
        const otherUserId = userCollectionDoc.id
        
        // 跳過當前用戶
        if (otherUserId === user.uid) {
          continue
        }
        
        // 簡單查詢：只按狀態過濾，避免複合索引
        const otherUserGamesSnapshot = await adminDb
          .collection(`collections/${otherUserId}/games`)
          .where('status', '==', '持有中')
          .limit(100) // 限制每個用戶的遊戲數量
          .get()
          
        // 在應用層面進行遊戲名稱匹配
        for (const gameDoc of otherUserGamesSnapshot.docs) {
          const gameData = gameDoc.data()
          
          // 檢查是否是用戶想要的遊戲
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const matchedWantedGame = userWantedGames.find(
            wantedGame => (wantedGame as any).gameTitle === (gameData as any).gameTitle
          )
          
          if (matchedWantedGame) {
            try {
              // 獲取其他玩家的資訊
              let playerEmail = `玩家-${otherUserId.substring(0, 8)}`
              try {
                const userRecord = await adminAuth.getUser(otherUserId)
                playerEmail = userRecord.email || playerEmail
              } catch (authError) {
                console.log('無法獲取用戶信息:', otherUserId, authError)
              }

              matches.push({
                playerId: otherUserId,
                playerEmail: playerEmail,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                gameTitle: (gameData as any).gameTitle,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                matchedGame: (matchedWantedGame as any).gameTitle
              })

              console.log('✅ 找到配對:', {
                player: playerEmail,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                has: (gameData as any).gameTitle,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                wants: (matchedWantedGame as any).gameTitle
              })

            } catch (error) {
              console.log('❌ 處理配對失敗:', error)
            }

            // 限制最多3個配對結果
            if (matches.length >= 3) {
              break
            }
          }
        }
        
        // 如果已經找到足夠配對就停止查詢更多用戶
        if (matches.length >= 3) {
          break
        }
      }
      
    } catch (collectionError) {
      console.error('❌ 查詢收藏集合失敗:', collectionError)
      return createErrorResponse('查詢遊戲資料失敗', 500)
    }

    console.log('🎯 配對完成，找到', matches.length, '個結果')

    // 隨機打亂結果順序，增加多樣性
    const shuffledMatches = matches.sort(() => Math.random() - 0.5)

    return createSuccessResponse(shuffledMatches.slice(0, 3))

  } catch (error) {
    console.error('💥 配對錯誤:', error)
    return createErrorResponse('配對失敗，請稍後再試', 500)
  }
}

// OPTIONS - 處理 CORS 預檢請求
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}