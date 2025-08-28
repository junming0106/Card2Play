// 高效能遊戲資料服務
import { NintendoSwitchGame } from '@/types/collection';

class GameDataService {
  private static instance: GameDataService;
  private games: NintendoSwitchGame[] = [];
  private searchIndex: Map<string, number[]> = new Map();
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): GameDataService {
    if (!GameDataService.instance) {
      GameDataService.instance = new GameDataService();
    }
    return GameDataService.instance;
  }

  // 異步載入遊戲資料
  public async loadGames(): Promise<NintendoSwitchGame[]> {
    if (this.isInitialized) {
      return this.games;
    }

    try {
      // 動態導入以減少初始包大小
      const { default: gamesData } = await import('@/data/nintendo-switch-games.json');
      this.games = gamesData;
      this.buildSearchIndex();
      this.isInitialized = true;
      return this.games;
    } catch (error) {
      console.error('❌ Failed to load games data:', error);
      return [];
    }
  }

  // 建立搜尋索引以提升搜尋效能
  private buildSearchIndex(): void {
    this.searchIndex.clear();
    
    this.games.forEach((game, index) => {
      const lowerGame = game.toLowerCase();
      
      // 1. 建立完整標題索引
      this.addToIndex(lowerGame, index);
      
      // 2. 建立單詞索引（支援中文字符分詞）
      const words = lowerGame.split(/\s+|[^\w\s':-\u4e00-\u9fff]/);
      words.forEach(word => {
        if (word.length > 0) {
          this.addToIndex(word, index);
          
          // 3. 建立前綴索引（支援部分匹配）
          for (let i = 1; i <= Math.min(word.length, 6); i++) {
            const prefix = word.substring(0, i);
            this.addToIndex(prefix, index);
          }
          
          // 4. 對中文進行字符級別索引（支援中文搜尋）
          if (/[\u4e00-\u9fff]/.test(word)) {
            for (let i = 0; i < word.length; i++) {
              for (let j = i + 1; j <= Math.min(i + 4, word.length); j++) {
                const substring = word.substring(i, j);
                this.addToIndex(substring, index);
              }
            }
          }
        }
      });
      
      // 5. 建立數字索引（如 "2", "3D", "VIII" 等）
      const numbers = lowerGame.match(/\d+|[ivxlcdm]+/g);
      if (numbers) {
        numbers.forEach(num => {
          if (num.length > 0) {
            this.addToIndex(num, index);
          }
        });
      }
    });
  }
  
  // 輔助方法：添加到索引
  private addToIndex(key: string, index: number): void {
    if (!this.searchIndex.has(key)) {
      this.searchIndex.set(key, []);
    }
    if (!this.searchIndex.get(key)!.includes(index)) {
      this.searchIndex.get(key)!.push(index);
    }
  }

  // 智能搜尋與相關度排序
  public searchGames(term: string, limit: number = 15): NintendoSwitchGame[] {
    if (!this.isInitialized || !term.trim()) {
      return [];
    }

    const lowerTerm = term.toLowerCase().trim();
    const matches = new Map<number, number>(); // index -> 相關度分數

    // 1. 完全匹配（最高優先級）
    this.games.forEach((game, index) => {
      if (game.toLowerCase() === lowerTerm) {
        matches.set(index, 1000);
      }
    });

    // 2. 標題開頭匹配
    this.games.forEach((game, index) => {
      if (!matches.has(index) && game.toLowerCase().startsWith(lowerTerm)) {
        matches.set(index, 800);
      }
    });

    // 3. 完整單詞匹配
    const searchWords = lowerTerm.split(/\s+/);
    searchWords.forEach(searchWord => {
      if (this.searchIndex.has(searchWord)) {
        this.searchIndex.get(searchWord)!.forEach(index => {
          if (!matches.has(index)) {
            matches.set(index, 600);
          }
        });
      }
    });

    // 4. 前綴匹配
    for (const [indexKey, indices] of Array.from(this.searchIndex)) {
      if (indexKey.startsWith(lowerTerm)) {
        indices.forEach(index => {
          if (!matches.has(index)) {
            matches.set(index, 400);
          }
        });
      }
    }

    // 5. 部分包含匹配
    this.games.forEach((game, index) => {
      if (!matches.has(index) && game.toLowerCase().includes(lowerTerm)) {
        // 根據匹配位置給予不同分數
        const position = game.toLowerCase().indexOf(lowerTerm);
        const score = Math.max(200 - position * 2, 100);
        matches.set(index, score);
      }
    });

    // 6. 模糊匹配（處理輸入錯誤）
    if (matches.size < limit && lowerTerm.length > 2) {
      this.games.forEach((game, index) => {
        if (!matches.has(index)) {
          const similarity = this.calculateSimilarity(lowerTerm, game.toLowerCase());
          if (similarity > 0.6) {
            matches.set(index, Math.floor(similarity * 50));
          }
        }
      });
    }

    // 排序並返回結果
    const sortedResults = Array.from(matches.entries())
      .sort((a, b) => b[1] - a[1]) // 按相關度分數降序排列
      .slice(0, limit);
    
    // Debug logging (can be removed in production)
    
    return sortedResults
      .map(([index]) => this.games[index])
      .filter(Boolean);
  }

  // 計算字串相似度（簡化版 Levenshtein 距離）
  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const distance = matrix[len1][len2];
    return 1 - distance / Math.max(len1, len2);
  }

  // 獲取所有遊戲數量
  public getGamesCount(): number {
    return this.games.length;
  }

  // 分頁載入遊戲（用於大列表顯示）
  public getGamesByPage(page: number, pageSize: number = 50): NintendoSwitchGame[] {
    const start = page * pageSize;
    const end = start + pageSize;
    return this.games.slice(start, end);
  }
}

export default GameDataService;