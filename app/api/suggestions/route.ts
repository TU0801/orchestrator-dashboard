import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/suggestions - 提案一覧取得
export async function GET(request: NextRequest) {
  // 認証チェック
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { data: suggestions, error } = await supabase
      .from('orch_suggestions')
      .select('*')
      .eq('is_selected', false)  // 未選択のもののみ
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Suggestions fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch suggestions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ suggestions: suggestions || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/suggestions - カスタム提案追加
export async function POST(request: NextRequest) {
  // 認証チェック
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { project_id, title, description } = body

    if (!project_id || !title) {
      return NextResponse.json(
        { error: 'project_id and title are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('orch_suggestions')
      .insert({
        project_id,
        title,
        description: description || '',
        source: 'custom',
        priority: 0,
        is_selected: false,
        created_by: 'user'
      })
      .select()
      .single()

    if (error) {
      console.error('Suggestion insert error:', error)
      return NextResponse.json(
        { error: 'Failed to create suggestion' },
        { status: 500 }
      )
    }

    return NextResponse.json({ suggestion: data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
