# Orchestrator Dashboard

## 概要

orchestratorの状態確認・指示投入用のWebダッシュボード。
Vercelにデプロイされており、スマホからアクセス可能。

## 目的

- Claude.ai Web（Opus）がSupabaseの状態を読めるようにする
- スマホから短い指示を送れるようにする
- プロジェクト状態を一覧表示する
- タスク履歴を閲覧する
- ADR（設計判断）を確認する

## 技術スタック

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS (inline styles) |
| Database | Supabase PostgreSQL |
| Hosting | Vercel |
| Authentication | API Key (Bearer token or URL param) |

## ディレクトリ構成

```
orchestrator-dashboard/
├── app/
│   ├── page.tsx                    # ダッシュボード（ホーム）
│   ├── projects/[id]/page.tsx      # プロジェクト詳細ページ
│   └── api/
│       ├── status/route.ts         # 全体ステータスAPI
│       ├── instructions/route.ts   # 指示送信API
│       ├── projects/route.ts       # プロジェクト一覧API
│       ├── projects/[id]/route.ts  # プロジェクト詳細API
│       └── user-profile/route.ts   # ユーザープロフィールAPI
├── lib/
│   ├── supabase.ts                 # Supabase接続
│   └── auth.ts                     # API認証ミドルウェア
├── .env.example                    # 環境変数サンプル
└── vercel.json                     # Vercelデプロイ設定
```

## 主要機能

### 1. ダッシュボード（app/page.tsx）

- **指示投入フォーム**
  - プロジェクト選択
  - 指示入力（テキストエリア）
  - よく使う指示テンプレート
  - 送信ボタン

- **プロジェクト一覧**
  - クリックで詳細ページへ
  - Git状態表示（Branch、Uncommitted Changes）
  - Deploy URLリンク

- **タスク一覧**
  - 全タスク（pending/in_progress/done/failed）
  - ステータスバッジ（色分け）
  - Completion Note表示

- **Recent ADRs**
  - 最新の設計判断を表示
  - プロジェクトID、決定内容、作成日

### 2. プロジェクト詳細ページ（app/projects/[id]/page.tsx）

- プロジェクト基本情報
- Git状態
- タスク一覧（フィルター機能付き）
- ADR一覧（全詳細表示）

### 3. API認証（lib/auth.ts）

- 3つの認証方式:
  1. URLパラメータ: `?key=xxxxx`
  2. Authorizationヘッダー: `Bearer xxxxx`
  3. リファラーチェック: 同一ドメインは認証不要

### 4. データ取得（lib/supabase.ts）

- Supabase Service Role Key使用
- 7テーブルから情報を集約:
  - orch_user_profile
  - orch_projects
  - orch_design_docs
  - orch_adrs
  - orch_conversations
  - orch_project_states
  - orch_tasks

## デプロイ

### Vercel自動デプロイ

- **トリガー**: `main`ブランチへのpush
- **URL**: https://orchestrator-dashboard-six.vercel.app/

### 環境変数（Vercel設定）

```
NEXT_PUBLIC_SUPABASE_URL=https://rzfbmmmtrbxwkxtsvypi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
DASHBOARD_API_KEY=<api_key>
```

### 手動デプロイ

```bash
# Vercel CLIでデプロイ
npm install -g vercel
vercel login
vercel --prod
```

## ローカル開発

```bash
# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env
# .envに実際の値を設定

# 開発サーバー起動
npm run dev
# http://localhost:3000 にアクセス

# ビルド
npm run build
```

## API使用例

### 外部からAPIアクセス（認証必要）

```bash
# URLパラメータ方式
curl "https://orchestrator-dashboard-six.vercel.app/api/status?key=YOUR_API_KEY"

# Authorizationヘッダー方式
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://orchestrator-dashboard-six.vercel.app/api/status
```

### ダッシュボードUIからのアクセス（認証不要）

- ブラウザで https://orchestrator-dashboard-six.vercel.app/ にアクセス
- 同一ドメインからのAPIコールは自動的に認証をパス

## 注意点

### 開発時

- **変更後は必ずgit pushしてVercelに自動デプロイ**
- ローカル開発時は `.env` に環境変数を設定
- APIキーは `.env.local` に保存（gitignore済み）

### 本番環境

- Vercel環境変数に `DASHBOARD_API_KEY` を設定必須
- APIキーなしでは全APIが401 Unauthorizedを返す
- 同一ドメインからのアクセスのみ認証不要

### セキュリティ

- Service Role Keyは絶対にクライアント側に公開しない
- APIキーは安全に管理（環境変数のみ）
- リファラーチェックで同一ドメインのみ許可

## トラブルシューティング

### API 401 Unauthorized

- Vercel環境変数に `DASHBOARD_API_KEY` が設定されているか確認
- APIキーが正しいか確認
- リファラーが正しいか確認（ダッシュボードUIから）

### Supabase接続エラー

- `SUPABASE_SERVICE_ROLE_KEY` が正しいか確認
- Supabaseプロジェクトが起動しているか確認
- ネットワーク接続を確認

### ビルドエラー

```bash
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install

# Next.jsキャッシュをクリア
rm -rf .next
npm run build
```

## 関連ドキュメント

- [README.md](./README.md) - プロジェクト概要
- [CLAUDE_RULES.md](../orchestrator/CLAUDE_RULES.md) - Claudeへの共通ルール
- [Supabase 7テーブル構造](../orchestrator/CLAUDE_RULES.md#6-7テーブル構造の使い方)

## デプロイURL

- **Production**: https://orchestrator-dashboard-six.vercel.app/
- **GitHub**: https://github.com/TU0801/orchestrator-dashboard

---

**Orchestrator Dashboard** - プロジェクトを手のひらから管理
