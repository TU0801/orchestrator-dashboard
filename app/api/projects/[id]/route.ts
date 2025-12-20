import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    // プロジェクト基本情報
    const { data: project, error: projectError } = await supabase
      .from('orch_projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError) {
      if (projectError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }
      console.error('Project error:', projectError)
      return NextResponse.json(
        { error: 'Failed to fetch project', details: projectError.message },
        { status: 500 }
      )
    }

    // プロジェクトの最新状態
    const { data: state } = await supabase
      .from('orch_project_states')
      .select('*')
      .eq('project_id', projectId)
      .order('scanned_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // プロジェクト関連のADR
    const { data: adrs } = await supabase
      .from('orch_adrs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    // プロジェクト関連のタスク
    const { data: tasks } = await supabase
      .from('orch_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    // プロジェクト関連の会話
    const { data: conversations } = await supabase
      .from('orch_conversations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(5)

    // プロジェクト関連のデザインドキュメント
    const { data: designDocs } = await supabase
      .from('orch_design_docs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      project,
      state: state || null,
      adrs: adrs || [],
      tasks: tasks || [],
      conversations: conversations || [],
      design_docs: designDocs || []
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
