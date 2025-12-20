# Orchestrator Dashboard

GCPのorchestrator状態をClaude.ai Web（Opus）から読めるようにするVercelアプリ。

## 構成

```
orchestrator-dashboard/
├── app/
│   ├── page.tsx          # ダッシュボードUI
│   ├── layout.tsx        # レイアウト
│   └── api/
│       └── status/
│           └── route.ts  # GET /api/status
├── lib/
│   └── supabase.ts       # Supabaseクライアント
└── package.json
```

## セットアップ手順

### 1. Supabaseテーブル作成

idiomと同じSupabaseプロジェクトで以下のSQLを実行:

```sql
CREATE TABLE orchestrator_status (
    id SERIAL PRIMARY KEY,
    status_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. 環境変数設定

`.env.local`ファイルを作成:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://rzfbmmmtrbxwkxtsvypi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. 依存関係インストール

```bash
npm install
```

### 4. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

### 5. Vercelデプロイ

```bash
vercel deploy
```

環境変数をVercelダッシュボードで設定:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## GCP側の設定

### 1. Supabase Python クライアントをインストール

```bash
pip install supabase
```

### 2. 環境変数を設定

```bash
export SUPABASE_URL=https://rzfbmmmtrbxwkxtsvypi.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. 同期スクリプトを実行

```bash
~/orchestrator/supabase_sync.py
```

### 4. cronで定期実行（オプション）

```bash
# 5分ごとに実行
*/5 * * * * cd ~/orchestrator && SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=yyy ./supabase_sync.py
```

## API エンドポイント

### GET /api/status

最新のorchestrator状態を取得

**レスポンス例:**

```json
{
  "status": {
    "timestamp": "2024-12-20T16:30:00.000Z",
    "gcp_instance": "instance-name",
    "projects": [...],
    "recent_tasks": [...],
    "system_health": "ok"
  },
  "updated_at": "2024-12-20T16:30:00.000Z"
}
```

## 使い方

1. GCPで`supabase_sync.py`を実行してSupabaseにデータを送信
2. `https://orchestrator-dashboard.vercel.app/api/status`にアクセスしてJSONを確認
3. `https://orchestrator-dashboard.vercel.app/`でダッシュボードを表示
4. Claude.ai WebからURLにアクセスして状態を確認

## トラブルシューティング

### エラー: "No status found"

GCP側でsupabase_sync.pyが実行されていません。まずGCPで同期スクリプトを実行してください。

### エラー: "Failed to fetch status"

Supabase接続エラー。環境変数が正しく設定されているか確認してください。

### GCP側のログ確認

```bash
tail -f ~/orchestrator/logs/supabase_sync_*.log
```
