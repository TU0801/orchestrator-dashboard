import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. User Profile (最新1件)
    const { data: userProfile, error: userError } = await supabase
      .from('orch_user_profile')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      console.error('User profile error:', userError)
    }

    // 2. Projects (全件)
    const { data: projects, error: projectsError } = await supabase
      .from('orch_projects')
      .select('*')
      .order('priority', { ascending: false })

    if (projectsError) {
      console.error('Projects error:', projectsError)
    }

    // 3. Recent ADRs (最新5件)
    const { data: recentAdrs, error: adrsError } = await supabase
      .from('orch_adrs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (adrsError) {
      console.error('ADRs error:', adrsError)
    }

    // 4. Recent Conversations (最新3件)
    const { data: recentConversations, error: conversationsError } = await supabase
      .from('orch_conversations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)

    if (conversationsError) {
      console.error('Conversations error:', conversationsError)
    }

    // 5. Project States (各プロジェクトの最新1件ずつ)
    const projectStates = []
    if (projects) {
      for (const project of projects) {
        const { data: state } = await supabase
          .from('orch_project_states')
          .select('*')
          .eq('project_id', project.id)
          .order('scanned_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (state) {
          projectStates.push(state)
        }
      }
    }

    // 6. All Recent Tasks (including completed, ordered by most recent)
    const { data: activeTasks, error: tasksError } = await supabase
      .from('orch_tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (tasksError) {
      console.error('Tasks error:', tasksError)
    }

    // レスポンス統合
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      user_profile: userProfile || null,
      projects: projects || [],
      recent_adrs: recentAdrs || [],
      recent_conversations: recentConversations || [],
      project_states: projectStates || [],
      active_tasks: activeTasks || []
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
