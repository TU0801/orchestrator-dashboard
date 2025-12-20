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
    const days = parseInt(searchParams.get('days') || '30')

    // 日付範囲を計算
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // 1. スコア推移データ
    let scoreQuery = supabase
      .from('orch_evaluations')
      .select(`
        overall_score,
        evaluated_at,
        orch_runs!inner(
          project_id,
          started_at
        )
      `)
      .gte('evaluated_at', startDate.toISOString())
      .order('evaluated_at', { ascending: true })

    if (projectId) {
      scoreQuery = scoreQuery.eq('orch_runs.project_id', projectId)
    }

    const { data: scoreData, error: scoreError } = await scoreQuery.execute()

    if (scoreError) {
      console.error('Score data fetch error:', scoreError)
    }

    // 2. 失敗カテゴリ推移データ
    let categoryQuery = supabase
      .from('orch_evaluations')
      .select(`
        failure_category,
        evaluated_at,
        orch_runs!inner(
          project_id
        )
      `)
      .gte('evaluated_at', startDate.toISOString())
      .not('failure_category', 'is', null)
      .order('evaluated_at', { ascending: true })

    if (projectId) {
      categoryQuery = categoryQuery.eq('orch_runs.project_id', projectId)
    }

    const { data: categoryData, error: categoryError } = await categoryQuery.execute()

    if (categoryError) {
      console.error('Category data fetch error:', categoryError)
    }

    // 3. ツール使用統計
    let toolQuery = supabase
      .from('orch_tool_calls')
      .select(`
        tool_name,
        category,
        success,
        orch_runs!inner(
          project_id,
          created_at
        )
      `)
      .gte('created_at', startDate.toISOString())

    if (projectId) {
      toolQuery = toolQuery.eq('orch_runs.project_id', projectId)
    }

    const { data: toolData, error: toolError } = await toolQuery.execute()

    if (toolError) {
      console.error('Tool data fetch error:', toolError)
    }

    // 4. ツール統計を集計
    const toolStats: Record<string, { total: number; success: number; failed: number }> = {}

    if (toolData) {
      toolData.forEach((call: any) => {
        const toolName = call.tool_name
        if (!toolStats[toolName]) {
          toolStats[toolName] = { total: 0, success: 0, failed: 0 }
        }
        toolStats[toolName].total++
        if (call.success) {
          toolStats[toolName].success++
        } else {
          toolStats[toolName].failed++
        }
      })
    }

    // 5. 失敗カテゴリを集計
    const categoryStats: Record<string, number> = {}

    if (categoryData) {
      categoryData.forEach((eval: any) => {
        const category = eval.failure_category
        categoryStats[category] = (categoryStats[category] || 0) + 1
      })
    }

    // 6. スコア推移を日付ごとに集計
    const scoreByDate: Record<string, { total: number; count: number; avg: number }> = {}

    if (scoreData) {
      scoreData.forEach((eval: any) => {
        const date = new Date(eval.evaluated_at).toISOString().split('T')[0]
        if (!scoreByDate[date]) {
          scoreByDate[date] = { total: 0, count: 0, avg: 0 }
        }
        scoreByDate[date].total += eval.overall_score
        scoreByDate[date].count++
      })

      // 平均を計算
      Object.keys(scoreByDate).forEach(date => {
        scoreByDate[date].avg = scoreByDate[date].total / scoreByDate[date].count
      })
    }

    // レスポンスを返す
    return NextResponse.json({
      score_trend: Object.entries(scoreByDate).map(([date, data]) => ({
        date,
        average_score: parseFloat(data.avg.toFixed(2))
      })),
      failure_categories: Object.entries(categoryStats).map(([category, count]) => ({
        category,
        count
      })),
      tool_usage: Object.entries(toolStats).map(([tool, stats]) => ({
        tool,
        ...stats,
        success_rate: parseFloat(((stats.success / stats.total) * 100).toFixed(1))
      }))
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
