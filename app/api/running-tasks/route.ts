import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 実行中のタスクを取得（orch_runs の status='running'）
    const { data: runningRuns, error: runsError } = await supabase
      .from('orch_runs')
      .select(`
        id,
        task_id,
        project_id,
        instruction,
        started_at,
        current_progress,
        orch_tasks (
          id,
          title,
          status
        ),
        orch_projects (
          id,
          name
        )
      `)
      .eq('status', 'running')
      .order('started_at', { ascending: false })

    if (runsError) throw runsError

    // pending タスクの数を取得
    const { count: pendingCount, error: pendingError } = await supabase
      .from('orch_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (pendingError) throw pendingError

    // 各実行の経過時間を計算
    const runningWithDuration = (runningRuns || []).map(run => {
      const startedAt = new Date(run.started_at)
      const now = new Date()
      const durationMs = now.getTime() - startedAt.getTime()
      const durationSeconds = Math.floor(durationMs / 1000)

      // 分と秒に変換
      const minutes = Math.floor(durationSeconds / 60)
      const seconds = durationSeconds % 60

      return {
        ...run,
        duration_seconds: durationSeconds,
        duration_display: minutes > 0
          ? `${minutes}分${seconds}秒`
          : `${seconds}秒`
      }
    })

    return NextResponse.json({
      running: runningWithDuration,
      max_concurrent: 3,
      queue_count: pendingCount || 0
    })

  } catch (error) {
    console.error('Error fetching running tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch running tasks' },
      { status: 500 }
    )
  }
}
