-- テーブル確認用SQL
-- 実行後、orch_プレフィックスのテーブルが7つ + orchestrator_status = 8つあることを確認

-- すべてのテーブル一覧を表示
SELECT
    tablename,
    schemaname
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- orch_プレフィックスのテーブルのみ表示
SELECT
    tablename,
    schemaname
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename LIKE 'orch_%'
ORDER BY tablename;

-- idiom関連テーブルの確認（既存のものが残っているか）
SELECT
    tablename,
    schemaname
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename NOT LIKE 'orch_%'
    AND tablename != 'orchestrator_status'
ORDER BY tablename;
