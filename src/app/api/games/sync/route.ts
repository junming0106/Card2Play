import { NextRequest } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import {
  verifyAuthToken,
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/utils/api'
import { Game } from '@/types/game'

interface NintendoGameData {
  title: string
  title_cn?: string
  release_date: string
  maker_publisher: string
  platform: string
  media: string
  rating?: string
  lang?: string
  thumb_img?: string
  link?: string
}

// POST /api/games/sync - 同步 Nintendo 遊戲資料
export async function POST(request: NextRequest) {
  try {
    // 驗證認證 (只有管理員可以同步)
    const user = await verifyAuthToken(request)
    if (!user) {
      return createErrorResponse('未經授權', 401)
    }

    // TODO: 檢查管理員權限

    console.log('開始同步 Nintendo Switch 遊戲資料...')

    // 取得 Nintendo 遊戲資料
    const nintendoUrl = process.env.NINTENDO_API_URL || 'https://www.nintendo.com/hk/data/json/switch_software.json'
    
    const response = await fetch(nintendoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Nintendo data: ${response.status}`)
    }

    const nintendoGames: NintendoGameData[] = await response.json()
    console.log(`取得 ${nintendoGames.length} 筆原始遊戲資料`)

    // 處理和去重遊戲資料
    const processedGames = new Map<string, Game>()
    let addedCount = 0
    let updatedCount = 0

    // 使用批次處理來優化 Firestore 寫入
    const batch = adminDb.batch()
    const batchSize = 500 // Firestore 批次限制

    for (const nintendoGame of nintendoGames) {
      const title = nintendoGame.title?.trim()
      if (!title) continue

      // 創建唯一鍵用於去重
      const uniqueKey = `${title}-${nintendoGame.platform || 'Nintendo Switch'}`
      
      if (processedGames.has(uniqueKey)) continue

      // 檢查遊戲是否已存在
      const existingGameSnapshot = await adminDb
        .collection('games')
        .where('title', '==', title)
        .where('platform', '==', nintendoGame.platform || 'Nintendo Switch')
        .get()
      
      const gameData: Omit<Game, 'id'> = {
        title: title,
        titleCn: nintendoGame.title_cn || undefined,
        releaseDate: nintendoGame.release_date || '',
        publisher: nintendoGame.maker_publisher || '',
        platform: nintendoGame.platform || 'Nintendo Switch',
        media: nintendoGame.media === 'package' ? 'package' : 'eshop',
        rating: nintendoGame.rating || undefined,
        language: nintendoGame.lang || undefined,
        thumbImg: nintendoGame.thumb_img || undefined,
        link: nintendoGame.link || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      if (existingGameSnapshot.empty) {
        // 新增遊戲
        const docRef = adminDb.collection('games').doc()
        batch.set(docRef, gameData)
        addedCount++
      } else {
        // 更新現有遊戲
        const existingDoc = existingGameSnapshot.docs[0]
        batch.update(existingDoc.ref, {
          ...gameData,
          createdAt: existingDoc.data().createdAt, // 保持原創建時間
        })
        updatedCount++
      }

      processedGames.set(uniqueKey, {
        id: '', // 會在提交後取得
        ...gameData,
      })

      // 分批提交以避免超出限制
      if ((addedCount + updatedCount) % batchSize === 0) {
        await batch.commit()
        console.log(`已提交 ${addedCount + updatedCount} 筆資料`)
      }
    }

    // 提交剩餘的批次
    if ((addedCount + updatedCount) % batchSize !== 0) {
      await batch.commit()
    }

    console.log(`同步完成: 新增 ${addedCount} 筆, 更新 ${updatedCount} 筆`)

    return createSuccessResponse({
      totalProcessed: nintendoGames.length,
      uniqueGames: processedGames.size,
      added: addedCount,
      updated: updatedCount,
    }, '遊戲資料同步成功')

  } catch (error) {
    console.error('Error syncing games:', error)
    return createErrorResponse('同步遊戲資料失敗: ' + (error as Error).message, 500)
  }
}