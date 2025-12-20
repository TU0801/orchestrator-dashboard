import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // 認証チェック
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('project_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    // orch_evaluationsとorch_runsをjoinして取得
    let query = supabase
      .from('orch_evaluations')
      .select(`
        *,
        orch_runs!inner(
          project_id,
          instruction,
          status,
          started_at
        )
      `)
      .order('evaluated_at', { ascending: false })
      .limit(limit)

    // プロジェクトフィルター
    if (projectId) {
      query = query.eq('orch_runs.project_id', projectId)
    }

    const { data: evaluations, error } = await query.execute()

    if (error) {
      console.error('Evaluations fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch evaluations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      evaluations: evaluations || []
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
