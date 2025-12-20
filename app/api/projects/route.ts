import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // 認証チェック
  const authError = requireAuth(request)
  if (authError) {
    return authError
  }
  try {
    const { data, error } = await supabase
      .from('orch_projects')
      .select('*')
      .order('priority', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch projects', details: error.message },
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

// POST: 新規プロジェクト作成
export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, name, description, purpose, for_whom, status, priority, repository_url, deploy_url } = body

    // バリデーション
    if (!id || !name || !description) {
      return NextResponse.json(
        { error: 'id, name, and description are required' },
        { status: 400 }
      )
    }

    // IDの重複チェック
    const { data: existing } = await supabase
      .from('orch_projects')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Project with this ID already exists' },
        { status: 409 }
      )
    }

    // プロジェクト作成
    const { data, error } = await supabase
      .from('orch_projects')
      .insert({
        id,
        name,
        description,
        purpose: purpose || '',
        for_whom: for_whom || '',
        status: status || 'active',
        priority: priority || 5,
        repository_url: repository_url || null,
        deploy_url: deploy_url || null
      })
      .select()
      .single()

    if (error) {
      console.error('Project creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      project: data
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
