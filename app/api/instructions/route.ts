import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// POST /api/instructions - 指示を投入
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { project_id, instruction } = body

    if (!project_id || !instruction) {
      return NextResponse.json(
        { error: 'project_id and instruction are required' },
        { status: 400 }
      )
    }

    // orch_tasksにINSERT
    const { data, error } = await supabase
      .from('orch_tasks')
      .insert({
        project_id,
        title: instruction,
        status: 'pending',
        priority: 'normal'
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to insert task:', error)
      return NextResponse.json(
        { error: 'Failed to create task', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      task_id: data.id
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/instructions - pending/in_progressタスクを取得
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('orch_tasks')
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch tasks:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tasks', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
