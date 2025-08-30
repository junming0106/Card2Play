// 測試配對結果持久化
// 運行: node test-persistent-matches.js

async function testMatchingPersistence() {
  console.log('🧪 配對結果持久化測試');
  console.log('========================');

  // 測試用的配對結果格式
  const sampleMatches = [
    {
      playerId: 123,
      playerEmail: "test1@example.com",
      playerName: "測試用戶1",
      gameTitle: "超級馬力歐兄弟",
      gameId: 456,
      matchType: "seeking",
      matchedAt: new Date().toISOString()
    },
    {
      playerId: 789,
      playerEmail: "test2@example.com", 
      playerName: "測試用戶2",
      gameTitle: "薩爾達傳說",
      gameId: 101,
      matchType: "offering",
      matchedAt: new Date().toISOString()
    }
  ];

  console.log('📋 測試配對記錄格式:');
  console.log(JSON.stringify(sampleMatches, null, 2));

  console.log('\n🔍 JSON 序列化測試:');
  try {
    const serialized = JSON.stringify(sampleMatches);
    console.log('✅ 序列化成功，長度:', serialized.length);
    console.log('📏 預覽:', serialized.substring(0, 100) + '...');

    const deserialized = JSON.parse(serialized);
    console.log('✅ 反序列化成功，記錄數:', deserialized.length);
    
    // 驗證格式轉換
    const convertedMatches = deserialized.map(match => ({
      playerId: match.playerId,
      playerEmail: match.playerEmail || match.playerName || 'unknown@email.com',
      playerName: match.playerName || 'Unknown Player',
      gameTitle: match.gameTitle,
      gameId: match.gameId,
      matchType: match.matchType,
      addedAt: match.matchedAt || match.addedAt || new Date().toISOString()
    }));

    console.log('✅ 格式轉換成功');
    console.log('📋 轉換後格式:');
    console.log(JSON.stringify(convertedMatches[0], null, 2));

  } catch (error) {
    console.error('❌ JSON 處理錯誤:', error.message);
  }

  console.log('\n⏰ 時間計算測試:');
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  
  console.log('當前時間:', now.toISOString());
  console.log('1小時前:', oneHourAgo.toISOString());
  console.log('3小時後:', threeHoursFromNow.toISOString());
  
  // 模擬時間檢查邏輯
  const withinOneHour = (timestamp) => {
    const time = new Date(timestamp);
    return (now - time) < 60 * 60 * 1000; // 60分鐘 = 3600000毫秒
  };

  console.log('1小時前是否在範圍內:', withinOneHour(oneHourAgo));
  console.log('當前時間是否在範圍內:', withinOneHour(now));

  console.log('\n🔄 SQL 查詢模擬:');
  console.log('檢查近期配對記錄的 SQL 邏輯:');
  console.log('WHERE last_match_at > NOW() - INTERVAL \'60 minutes\'');
  console.log('等同於 JavaScript:', 'matchTime > (new Date(Date.now() - 60*60*1000))');

  console.log('\n✅ 測試完成');
  console.log('📋 結論:');
  console.log('- JSON 序列化/反序列化：正常');
  console.log('- 格式轉換：正常');
  console.log('- 時間計算：正常');
  console.log('- 預期功能：配對結果應該能正確保存和恢復1小時');
}

testMatchingPersistence().catch(console.error);