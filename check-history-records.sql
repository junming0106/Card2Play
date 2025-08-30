-- 查詢所有用戶的配對歷史記錄
-- 檢查歷史記錄的SQL指令

-- 1. 查看所有有歷史記錄的用戶
SELECT 
    u.email,
    u.name,
    s.user_id,
    s.last_match_at,
    s.last_match_games,
    -- 計算距離現在多少分鐘
    EXTRACT(EPOCH FROM (NOW() - s.last_match_at))/60 as minutes_ago,
    -- 檢查是否還在有效期內（60分鐘）
    CASE 
        WHEN s.last_match_at > NOW() - INTERVAL '60 minutes' THEN '有效'
        ELSE '已過期'
    END as status
FROM user_matching_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.last_match_games IS NOT NULL
ORDER BY s.last_match_at DESC;

-- 2. 查看特定用戶的歷史記錄詳情
-- 請替換 'your-email@example.com' 為您的實際email
SELECT 
    u.email,
    s.last_match_at,
    s.last_match_games::text as match_data,
    LENGTH(s.last_match_games::text) as data_length,
    -- 解析JSON中的配對數量
    JSON_ARRAY_LENGTH(s.last_match_games) as match_count
FROM user_matching_sessions s
JOIN users u ON s.user_id = u.id
WHERE u.email = 'your-email@example.com'
AND s.last_match_games IS NOT NULL;

-- 3. 查看所有表格的結構
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_matching_sessions'
ORDER BY ordinal_position;

-- 4. 檢查是否有任何配對會話記錄
SELECT 
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN last_match_games IS NOT NULL THEN 1 END) as sessions_with_matches,
    COUNT(CASE WHEN last_match_at > NOW() - INTERVAL '60 minutes' THEN 1 END) as recent_matches
FROM user_matching_sessions;

-- 5. 查看最近的配對活動
SELECT 
    u.email,
    s.matches_used,
    s.last_match_at,
    s.session_start,
    CASE 
        WHEN s.last_match_games IS NOT NULL THEN 'Has History'
        ELSE 'No History'
    END as history_status
FROM user_matching_sessions s
JOIN users u ON s.user_id = u.id
ORDER BY s.updated_at DESC
LIMIT 10;