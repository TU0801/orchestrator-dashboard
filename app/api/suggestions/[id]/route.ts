import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const suggestionId = parseInt(params.id)

    if (isNaN(suggestionId)) {
      return NextResponse.json(
        { error: 'Invalid suggestion ID' },
        { status: 400 }
      )
    }

    // 提案を削除
    const { error } = await supabase
      .from('orch_suggestions')
      .delete()
      .eq('id', suggestionId)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting suggestion:', error)
    return NextResponse.json(
      { error: 'Failed to delete suggestion' },
      { status: 500 }
    )
  }
}
