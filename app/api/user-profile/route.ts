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
      .from('orch_user_profile')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user profile', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile: data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: ユーザープロファイル更新
export async function PUT(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { current_situation, current_challenges, current_goals } = body

    // バリデーション
    if (!current_situation) {
      return NextResponse.json(
        { error: 'current_situation is required' },
        { status: 400 }
      )
    }

    // 既存プロファイルを取得
    const { data: existing } = await supabase
      .from('orch_user_profile')
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let result

    if (existing) {
      // 更新
      result = await supabase
        .from('orch_user_profile')
        .update({
          current_situation,
          current_challenges: current_challenges || [],
          current_goals: current_goals || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      // 新規作成
      result = await supabase
        .from('orch_user_profile')
        .insert({
          current_situation,
          current_challenges: current_challenges || [],
          current_goals: current_goals || []
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('User profile update error:', result.error)
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: result.data
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
