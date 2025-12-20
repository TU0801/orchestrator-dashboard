-- Orchestrator 初期データ投入
-- 2025-12-20 Opusとの会話から作成

-- 1. orch_user_profile（宇都さん自身）
INSERT INTO orch_user_profile (
    current_situation,
    current_challenges,
    current_goals,
    preferences,
    anti_patterns,
    work_style,
    updated_reason
) VALUES (
    'システムエンジニア。複数クライアント向けWebシステム開発を並行で進めている（3-5プロジェクト）。GCP VMでClaude Codeを使用。',
    '["認知負荷が高い - プロジェクト切り替えのたびに状況を思い出す必要がある", "AIのテスターになっている - 動作確認を何度もやらされる", "指示を書くのが辛い - 長い指示を書かないと正しく動かない", "PCの前に縛られている - 離れられない", "セッションが切れると振り出し - 説明し直しが必要"]'::jsonb,
    '["短い指示で長く正しく動いてほしい", "朝昼夕夜の4回、スマホから指示を出すだけにしたい", "AIが自律的に作業・テストまでやってほしい", "セッションが切れても続きから再開できるようにしたい"]'::jsonb,
    '{"communication": "短い指示で動いてほしい。質問攻めNG。要点を先に。", "tools": "Claude Code, GCP, Supabase, Vercel", "style": "思いついたときに作り始めたい。作業が進む快楽がある。"}'::jsonb,
    '["背景なしで作業指示を出す", "何度も同じ説明をさせる", "デプロイや動作確認を省略する", "宇都さんをテスターにする"]'::jsonb,
    '{"devices": ["Mac（メイン）", "職場Windows（SSH）", "スマホ（指示出し）"], "schedule": "朝昼夕夜の4回程度の確認が理想", "budget": "月5000円程度（現GCP費用）"}'::jsonb,
    '2025-12-20 Opusとの会話から初期作成'
);

-- 2. orch_projects（idiom）
INSERT INTO orch_projects (
    id, name, description, purpose, for_whom, background_story,
    tech_stack, repository_url, deploy_url, status, priority
) VALUES (
    'idiom',
    '慣用句認知メタファー分析ツール',
    '多言語の慣用句を収集し、認知言語学的観点から分析・可視化するWebアプリケーション',
    '認知言語学研究の支援。身体部位メタファー、感情概念の言語間比較を可能にする。',
    '韓国人の認知言語学者の友人',
    '友人は様々な国の慣用句から認知の捉え方を研究している。データを持っていないため、収集から分析・可視化まで一気通貫でできるツールを作ることになった。',
    '{"frontend": "Next.js, Tailwind CSS", "backend": "Supabase", "scraping": "Python", "api": "Claude API", "hosting": "Vercel"}'::jsonb,
    'https://github.com/TU0801/idiom-metaphor-analyzer',
    'https://idiom-metaphor-analyzer.vercel.app/',
    'active',
    1
);

-- 3. orch_projects（orchestrator）
INSERT INTO orch_projects (
    id, name, description, purpose, for_whom, background_story,
    tech_stack, repository_url, deploy_url, status, priority
) VALUES (
    'orchestrator',
    '自律型プロジェクトオーケストレーター',
    '複数プロジェクトの状態管理、指示の受付、自動実行を行うシステム',
    'プロジェクト管理の認知負荷を減らす。セッションが切れても文脈を保持する。',
    '宇都さん自身',
    'Claude Codeで複数プロジェクトを並行管理しているが、認知負荷が高い。セッション切れで文脈が失われる。短い指示で長く正しく動いてほしい。これらを解決するために設計。',
    '{"runtime": "Python", "db": "Supabase", "hosting": "GCP VM", "dashboard": "Vercel (予定)"}'::jsonb,
    NULL,
    NULL,
    'active',
    1
);

-- 4. orch_adrs（ADR #1）
INSERT INTO orch_adrs (
    project_id, adr_number, title, status, context, decision, alternatives, consequences
) VALUES (
    'orchestrator',
    1,
    'データ保存先としてSupabaseを選択',
    'accepted',
    'セッションが切れても文脈を保持したい。Claude.ai Web（Opus）からも状態を読みたい。',
    'idiomプロジェクトで既に使用しているSupabaseを流用する。テーブル名にorch_プレフィックスを付けて分離。',
    '[{"option": "SQLite", "rejected_reason": "ローカルファイルなので外部からアクセスできない"}, {"option": "Google Drive", "rejected_reason": "設定が複雑、MCPで読めるか不確実"}, {"option": "新規Supabaseプロジェクト", "rejected_reason": "無料枠2つまでなので温存"}]'::jsonb,
    'idiomと同じDBを使うため、テーブル設計で明確に分離する必要がある。'
);

-- 5. orch_adrs（ADR #2）
INSERT INTO orch_adrs (
    project_id, adr_number, title, status, context, decision, alternatives, consequences
) VALUES (
    'orchestrator',
    2,
    '7テーブル構造の採用',
    'accepted',
    '「状態」だけでなく「文脈」を保持したい。なぜその判断をしたか、誰のために作っているかを次のClaudeが理解できるようにしたい。',
    'user_profile, projects, design_docs, adrs, conversations, project_states, tasksの7テーブル構造を採用。',
    '[{"option": "1テーブルにJSON", "rejected_reason": "クエリしにくい、構造が曖昧になる"}, {"option": "3層構造", "rejected_reason": "最初の案だったが、詳細化すると7層になった"}]'::jsonb,
    '各テーブルに何を入れるかのルールが必要。移設時の手間が増えるが、文脈保持のためには必要。'
);
