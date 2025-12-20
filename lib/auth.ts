import { NextRequest, NextResponse } from 'next/server'

/**
 * APIキー認証検証
 *
 * 認証方式：
 * 1. URLパラメータ: ?key=xxxxx
 * 2. Authorizationヘッダー: Bearer xxxxx
 */
function validateApiKey(request: NextRequest): boolean {
  const apiKey = process.env.DASHBOARD_API_KEY

  if (!apiKey) {
    return false
  }

  // 1. URLパラメータからAPIキーを取得
  const { searchParams } = new URL(request.url)
  const keyFromQuery = searchParams.get('key')

  if (keyFromQuery === apiKey) {
    return true
  }

  // 2. Authorizationヘッダーからトークンを取得
  const authHeader = request.headers.get('authorization')

  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (token === apiKey) {
      return true
    }
  }

  return false
}

export function requireAuth(request: NextRequest): NextResponse | null {
  if (validateApiKey(request)) {
    return null
  }

  // 認証失敗
  return NextResponse.json(
    { error: 'Unauthorized', message: 'Valid API key required' },
    { status: 401 }
  )
}
