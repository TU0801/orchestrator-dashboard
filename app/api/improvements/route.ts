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

    // orch_improvement_historyを取得
    let query = supabase
      .from('orch_improvement_history')
      .select('*')
      .order('applied_at', { ascending: false })
      .limit(limit)

    // プロジェクトフィルター
    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data: improvements, error } = await query.execute()

    if (error) {
      console.error('Improvements fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch improvements' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      improvements: improvements || []
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
