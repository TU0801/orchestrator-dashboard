#!/usr/bin/env python3
"""
Orchestrator Dashboard Project Scanner - プロジェクト状態をSupabaseに同期

このスクリプトはorchestrator-dashboardプロジェクトの現在の状態（git状態など）を
Supabaseのorch_project_statesテーブルに更新します。
"""

import os
import subprocess
from pathlib import Path

# python-dotenvで環境変数を読み込み
try:
    from dotenv import load_dotenv
    # orchestratorの.envを読み込む
    orchestrator_env = Path.home() / 'orchestrator' / '.env'
    if orchestrator_env.exists():
        load_dotenv(orchestrator_env)
except ImportError:
    print("⚠️  python-dotenvがインストールされていません")
    print("    pip install python-dotenv")

# Supabase SDK
try:
    from supabase import create_client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("⚠️  Supabase SDKがインストールされていません")
    print("    pip install supabase")


def run_git_command(command: list) -> str:
    """Gitコマンドを実行して結果を返す"""
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"⚠️  Git command failed: {' '.join(command)}")
        print(f"    Error: {e.stderr}")
        return ""


def get_project_state() -> dict:
    """プロジェクトの現在の状態を取得"""
    # Gitブランチ
    git_branch = run_git_command(['git', 'branch', '--show-current'])

    # 最終コミット
    git_last_commit = run_git_command(['git', 'log', '-1', '--format=%H'])

    # 未コミットファイル数
    git_status = run_git_command(['git', 'status', '--porcelain'])
    git_uncommitted = len([line for line in git_status.split('\n') if line.strip()])

    # ディスク使用量（概算）
    project_dir = Path(__file__).parent
    total_size = sum(f.stat().st_size for f in project_dir.rglob('*') if f.is_file() and '.git' not in str(f) and 'node_modules' not in str(f))
    disk_usage_mb = total_size / (1024 * 1024)

    return {
        'project_id': 'orchestrator-dashboard',
        'git_branch': git_branch or 'main',
        'git_last_commit': git_last_commit or 'unknown',
        'git_uncommitted_changes': git_uncommitted,
        'disk_usage_percent': round(disk_usage_mb / 1000, 2)  # 概算パーセンテージ
    }


def update_supabase(state: dict):
    """Supabaseに状態を更新"""
    if not SUPABASE_AVAILABLE:
        print("❌ Supabase SDKが利用できません")
        return False

    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_KEY')

    if not supabase_url or not supabase_key:
        print("❌ Supabase認証情報が設定されていません")
        print("   SUPABASE_URL と SUPABASE_KEY を環境変数に設定してください")
        return False

    try:
        supabase = create_client(supabase_url, supabase_key)

        # 既存のレコードを削除して新しいレコードを挿入
        # （orch_project_statesは履歴として残すが、最新状態を追加）
        result = supabase.table('orch_project_states').insert(state).execute()

        print("✅ Supabaseに状態を更新しました")
        print(f"   Project: {state['project_id']}")
        print(f"   Branch: {state['git_branch']}")
        print(f"   Commit: {state['git_last_commit'][:8]}")
        print(f"   Uncommitted: {state['git_uncommitted_changes']} files")

        return True
    except Exception as e:
        print(f"❌ Supabase更新エラー: {e}")
        return False


def main():
    """メイン処理"""
    print("📊 Orchestrator Dashboard Project State Scanner")
    print("=" * 50)

    # 状態を取得
    state = get_project_state()

    print("\n現在の状態:")
    print(f"  Branch: {state['git_branch']}")
    print(f"  Commit: {state['git_last_commit'][:8] if state['git_last_commit'] != 'unknown' else 'unknown'}")
    print(f"  Uncommitted: {state['git_uncommitted_changes']} files")
    print(f"  Disk Usage: {state['disk_usage_percent']}%")

    # Supabaseに更新
    print("\n📤 Supabaseに同期中...")
    success = update_supabase(state)

    if success:
        print("\n✅ 完了")
    else:
        print("\n❌ 同期に失敗しました")
        return 1

    return 0


if __name__ == '__main__':
    import sys
    sys.exit(main())
