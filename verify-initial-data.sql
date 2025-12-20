-- 初期データ確認用SQL

-- 1. orch_user_profile（1件のはず）
SELECT
    id,
    current_situation,
    current_challenges,
    current_goals,
    updated_reason
FROM orch_user_profile;

-- 2. orch_projects（2件のはず: idiom, orchestrator）
SELECT
    id,
    name,
    purpose,
    for_whom,
    status,
    priority
FROM orch_projects
ORDER BY id;

-- 3. orch_adrs（2件のはず）
SELECT
    id,
    project_id,
    adr_number,
    title,
    status,
    decision
FROM orch_adrs
ORDER BY adr_number;

-- 件数確認
SELECT
    'orch_user_profile' as table_name,
    COUNT(*) as count
FROM orch_user_profile
UNION ALL
SELECT
    'orch_projects',
    COUNT(*)
FROM orch_projects
UNION ALL
SELECT
    'orch_adrs',
    COUNT(*)
FROM orch_adrs;
