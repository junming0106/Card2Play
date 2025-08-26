import requests
import pandas as pd
import json
from datetime import datetime
import os

def fetch_nintendo_games():
    """
    從Nintendo香港官方API爬取Nintendo Switch遊戲資料
    """
    url = "https://www.nintendo.com/hk/data/json/switch_software.json"
    
    print("🎮 開始爬取Nintendo Switch遊戲資料...")
    print(f"📡 資料來源: {url}")
    
    try:
        # 發送請求獲取JSON資料
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()  # 檢查HTTP錯誤
        
        # 解析JSON數據
        games_data = response.json()
        print(f"✅ 成功獲取資料，共 {len(games_data)} 筆原始記錄")
        
        return games_data
        
    except requests.exceptions.RequestException as e:
        print(f"❌ 網路請求失敗: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ JSON解析失敗: {e}")
        return None

def process_games_data(games_data):
    """
    處理遊戲資料，提取標題並去重
    """
    print("\n📊 處理遊戲資料...")
    
    # 用於去重的集合
    seen_titles = set()
    processed_games = []
    
    for index, game in enumerate(games_data, 1):
        # 檢查是否有遊戲標題
        title = game.get('title', '').strip()
        
        if title and title not in seen_titles:
            seen_titles.add(title)
            
            # 處理銷售方式
            media = game.get('media', '')
            media_cn = {
                'package': '實體版',
                'eshop': '數位版'
            }.get(media, media)
            
            processed_game = {
                '序號': len(processed_games) + 1,
                '遊戲標題': title,
                '發行日期': game.get('release_date', ''),
                '發行商': game.get('maker_publisher', ''),
                '平台': game.get('platform', 'Nintendo Switch'),
                '銷售方式': media_cn,
                '評級': game.get('rating', ''),
                '語言': game.get('lang', ''),
                '縮圖': game.get('thumb_img', ''),
                '連結': game.get('link', '')
            }
            
            processed_games.append(processed_game)
    
    print(f"✅ 處理完成，去重後共 {len(processed_games)} 款不同遊戲")
    
    return processed_games

def save_to_excel(games_list):
    """
    將遊戲資料儲存為Excel檔案
    """
    print("\n📥 生成Excel檔案...")
    
    try:
        # 創建DataFrame
        df = pd.DataFrame(games_list)
        
        # 生成檔名（包含當前日期）
        today = datetime.now()
        date_str = today.strftime("%Y-%m-%d")
        filename = f"Nintendo_Switch_遊戲列表_{date_str}.xlsx"
        
        # 確保輸出目錄存在
        os.makedirs('output', exist_ok=True)
        filepath = os.path.join('output', filename)
        
        # 儲存為Excel，設定格式
        with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Nintendo Switch 遊戲列表', index=False)
            
            # 取得工作表以調整格式
            worksheet = writer.sheets['Nintendo Switch 遊戲列表']
            
            # 調整欄位寬度
            column_widths = {
                'A': 8,   # 序號
                'B': 50,  # 遊戲標題
                'C': 15,  # 發行日期
                'D': 25,  # 發行商
                'E': 18,  # 平台
                'F': 12,  # 銷售方式
                'G': 10,  # 評級
                'H': 10,  # 語言
                'I': 15,  # 縮圖
                'J': 40   # 連結
            }
            
            for column, width in column_widths.items():
                worksheet.column_dimensions[column].width = width
        
        print(f"✅ Excel檔案已儲存: {filepath}")
        print(f"📋 檔案包含 {len(games_list)} 款遊戲")
        
        return filepath
        
    except Exception as e:
        print(f"❌ 儲存Excel失敗: {e}")
        return None

def display_summary(games_list):
    """
    顯示遊戲資料摘要
    """
    print("\n" + "="*60)
    print("📊 Nintendo Switch 遊戲資料摘要")
    print("="*60)
    
    df = pd.DataFrame(games_list)
    
    # 基本統計
    print(f"總遊戲數量: {len(games_list)}")
    
    # 發行商統計
    print("\n🏢 主要發行商 (前10名):")
    publisher_counts = df['發行商'].value_counts().head(10)
    for publisher, count in publisher_counts.items():
        print(f"  {publisher}: {count} 款")
    
    # 銷售方式統計
    print("\n💿 銷售方式統計:")
    media_counts = df['銷售方式'].value_counts()
    for media, count in media_counts.items():
        print(f"  {media}: {count} 款")
    
    # 發行年份統計
    print("\n📅 發行年份統計:")
    df['年份'] = df['發行日期'].str.extract('(\d{4})')
    year_counts = df['年份'].value_counts().sort_index()
    for year, count in year_counts.items():
        if pd.notna(year):
            print(f"  {year}: {count} 款")
    
    # 顯示前10款遊戲
    print("\n🎮 遊戲列表預覽 (前10款):")
    for i, game in enumerate(games_list[:10], 1):
        print(f"  {i:2d}. {game['遊戲標題']} ({game['發行日期']}) - {game['發行商']}")
    
    if len(games_list) > 10:
        print(f"  ... 還有 {len(games_list) - 10} 款遊戲")

def main():
    """
    主程式
    """
    print("🎮 Nintendo Switch 遊戲爬取工具")
    print("="*50)
    
    # 1. 爬取遊戲資料
    games_data = fetch_nintendo_games()
    if not games_data:
        print("❌ 無法獲取遊戲資料，程式結束")
        return
    
    # 2. 處理資料
    processed_games = process_games_data(games_data)
    if not processed_games:
        print("❌ 沒有有效的遊戲資料，程式結束")
        return
    
    # 3. 顯示摘要
    display_summary(processed_games)
    
    # 4. 儲存Excel
    excel_path = save_to_excel(processed_games)
    
    if excel_path:
        print(f"\n🎉 完成！Excel檔案已儲存至: {excel_path}")
    else:
        print("\n❌ Excel檔案儲存失敗")

if __name__ == "__main__":
    # 檢查必要套件
    try:
        import requests
        import pandas as pd
        import openpyxl
    except ImportError as e:
        print("❌ 缺少必要套件，請先安裝:")
        print("pip install requests pandas openpyxl")
        print(f"錯誤詳情: {e}")
    else:
        main()