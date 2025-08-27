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
  matchedGame: string; // 用戶想要交換的遊戲
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

    // 2. 尋找其他玩家持有的遊戲
    const matches: MatchResult[] = []
    let allCollectionsSnapshot;
    
    try {
      // 先嘗試獲取所有collections文檔來找到其他用戶
      const collectionsListSnapshot = await adminDb
        .collection('collections')
        .limit(20) // 限制用戶數量
        .get()

      console.log('🔍 找到', collectionsListSnapshot.size, '個用戶的收藏')
      
      // 遍歷每個用戶的收藏來尋找配對
      for (const userCollectionDoc of collectionsListSnapshot.docs) {
        const otherUserId = userCollectionDoc.id
        
        // 跳過當前用戶
        if (otherUserId === user.uid) {
          continue
        }
        
        // 獲取該用戶持有中的遊戲
        const otherUserGamesSnapshot = await adminDb
          .collection(`collections/${otherUserId}/games`)
          .where('status', '==', '持有中')
          .get()
          
        console.log(`👤 用戶 ${otherUserId} 持有中遊戲:`, otherUserGamesSnapshot.size, '款')
        
        // 檢查配對
        for (const gameDoc of otherUserGamesSnapshot.docs) {
          const otherPlayerGame = gameDoc.data()
          
          // 檢查是否有配對
          for (const wantedGame of userWantedGames) {
            if (otherPlayerGame.gameTitle === wantedGame.gameTitle) {
              // 獲取其他玩家的資訊
              try {
                let playerEmail = `玩家-${otherUserId.substring(0, 8)}`
                try {
                  const userRecord = await adminAuth.getUser(otherUserId)
                  playerEmail = userRecord.email || playerEmail
                } catch (authError) {
                  console.log('無法獲取用戶信息:', otherUserId)
                }

                matches.push({
                  playerId: otherUserId,
                  playerEmail: playerEmail,
                  gameTitle: otherPlayerGame.gameTitle,
                  matchedGame: wantedGame.gameTitle
                })

                console.log('✅ 找到配對:', {
                  player: playerEmail,
                  has: otherPlayerGame.gameTitle,
                  wants: wantedGame.gameTitle
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
          
          if (matches.length >= 3) break
        }
        
        if (matches.length >= 3) break
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