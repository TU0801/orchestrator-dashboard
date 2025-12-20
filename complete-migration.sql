-- Orchestrator 完全マイグレーション
-- orchestrator_status + 自律型プロジェクト管理システムの全テーブル

-- 既存の orchestrator_status テーブル（まだ作成していない場合）
CREATE TABLE IF NOT EXISTS orchestrator_status (
    id SERIAL PRIMARY KEY,
    status_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 1. 宇都さんのプロファイル
CREATE TABLE IF NOT EXISTS orch_user_profile (
    id SERIAL PRIMARY KEY,
    current_situation TEXT,
    current_challenges JSONB,
    current_goals JSONB,
    preferences JSONB,
    anti_patterns JSONB,
    work_style JSONB,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_reason TEXT
);

-- 2. プロジェクト
CREATE TABLE IF NOT EXISTS orch_projects (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    purpose TEXT,
    for_whom TEXT,
    background_story TEXT,
    tech_stack JSONB,
    repository_url TEXT,
    deploy_url TEXT,
    status TEXT,
    priority INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Design Docs
CREATE TABLE IF NOT EXISTS orch_design_docs (
    id SERIAL PRIMARY KEY,
    project_id TEXT REFERENCES orch_projects(id),
    version INTEGER,
    title TEXT,
    overview TEXT,
    architecture TEXT,
    components JSONB,
    data_model TEXT,
    api_design TEXT,
    ui_design TEXT,
    non_functional_requirements JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    is_current BOOLEAN DEFAULT TRUE
);

-- 4. ADR (Architecture Decision Records)
CREATE TABLE IF NOT EXISTS orch_adrs (
    id SERIAL PRIMARY KEY,
    project_id TEXT REFERENCES orch_projects(id),
    adr_number INTEGER,
    title TEXT,
    status TEXT,
    context TEXT,
    decision TEXT,
    alternatives JSONB,
    consequences TEXT,
    related_adrs JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. 会話記録
CREATE TABLE IF NOT EXISTS orch_conversations (
    id SERIAL PRIMARY KEY,
    project_id TEXT,
    conversation_date DATE,
    claude_type TEXT,
    summary TEXT,
    key_decisions JSONB,
    action_items JSONB,
    insights JSONB,
    user_feedback TEXT,
    context_for_next TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. プロジェクト状態
CREATE TABLE IF NOT EXISTS orch_project_states (
    id SERIAL PRIMARY KEY,
    project_id TEXT,
    git_branch TEXT,
    git_last_commit TEXT,
    git_uncommitted_changes INTEGER,
    recent_errors JSONB,
    current_focus TEXT,
    next_steps JSONB,
    blockers JSONB,
    disk_usage_percent FLOAT,
    scanned_at TIMESTAMP DEFAULT NOW()
);

-- 7. タスク
CREATE TABLE IF NOT EXISTS orch_tasks (
    id SERIAL PRIMARY KEY,
    project_id TEXT,
    title TEXT,
    description TEXT,
    why TEXT,
    status TEXT,
    priority TEXT,
    estimated_hours FLOAT,
    actual_hours FLOAT,
    blockers JSONB,
    dependencies JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    completion_note TEXT
);

-- インデックス作成（存在しない場合のみ）
CREATE INDEX IF NOT EXISTS idx_orch_projects_status ON orch_projects(status);
CREATE INDEX IF NOT EXISTS idx_orch_design_docs_project ON orch_design_docs(project_id);
CREATE INDEX IF NOT EXISTS idx_orch_design_docs_current ON orch_design_docs(is_current);
CREATE INDEX IF NOT EXISTS idx_orch_adrs_project ON orch_adrs(project_id);
CREATE INDEX IF NOT EXISTS idx_orch_conversations_project ON orch_conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_orch_conversations_date ON orch_conversations(conversation_date);
CREATE INDEX IF NOT EXISTS idx_orch_project_states_project ON orch_project_states(project_id);
CREATE INDEX IF NOT EXISTS idx_orch_project_states_scanned ON orch_project_states(scanned_at);
CREATE INDEX IF NOT EXISTS idx_orch_tasks_project ON orch_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_orch_tasks_status ON orch_tasks(status);

-- コメント追加
COMMENT ON TABLE orchestrator_status IS 'GCP Orchestratorの現在の状態（JSON形式）';
COMMENT ON TABLE orch_user_profile IS '宇都さんの現在の状況・目標・好みを記録';
COMMENT ON TABLE orch_projects IS 'プロジェクト基本情報';
COMMENT ON TABLE orch_design_docs IS 'プロジェクト設計書（バージョン管理）';
COMMENT ON TABLE orch_adrs IS 'アーキテクチャ決定記録';
COMMENT ON TABLE orch_conversations IS 'Claudeとの会話記録と引き継ぎ情報';
COMMENT ON TABLE orch_project_states IS 'プロジェクトの現在の技術的状態';
COMMENT ON TABLE orch_tasks IS 'タスク管理（なぜやるか含む）';
