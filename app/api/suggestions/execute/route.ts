import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST /api/suggestions/execute - 選択した提案をタスクに変換
export async function POST(request: NextRequest) {
  // 認証チェック
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { suggestion_ids } = body

    if (!suggestion_ids || !Array.isArray(suggestion_ids) || suggestion_ids.length === 0) {
      return NextResponse.json(
        { error: 'suggestion_ids array is required' },
        { status: 400 }
      )
    }

    // 選択された提案を取得
    const { data: suggestions, error: fetchError } = await supabase
      .from('orch_suggestions')
      .select('*')
      .in('id', suggestion_ids)

    if (fetchError) {
      console.error('Suggestions fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch suggestions' },
        { status: 500 }
      )
    }

    if (!suggestions || suggestions.length === 0) {
      return NextResponse.json(
        { error: 'No suggestions found' },
        { status: 404 }
      )
    }

    // 各提案をタスクに変換
    const tasks = suggestions.map(suggestion => ({
      project_id: suggestion.project_id,
      title: suggestion.title,
      status: 'pending',
      priority: 'normal'
    }))

    // タスクを一括挿入
    const { data: insertedTasks, error: insertError } = await supabase
      .from('orch_tasks')
      .insert(tasks)
      .select()

    if (insertError) {
      console.error('Tasks insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create tasks' },
        { status: 500 }
      )
    }

    // 提案を選択済みにマーク
    const { error: updateError } = await supabase
      .from('orch_suggestions')
      .update({ is_selected: true })
      .in('id', suggestion_ids)

    if (updateError) {
      console.error('Suggestions update error:', updateError)
      // タスクは作成されたので、エラーをログに残すだけ
    }

    return NextResponse.json({
      success: true,
      tasks: insertedTasks,
      count: insertedTasks?.length || 0
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
