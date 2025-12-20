import { NextRequest, NextResponse } from 'next/server'

/**
 * API認証ミドルウェア
 *
 * 認証方式：
 * 1. URLパラメータ: ?key=xxxxx
 * 2. Authorizationヘッダー: Bearer xxxxx
 * 3. 同一ドメインからのアクセス（リファラーチェック）
 */
export function requireAuth(request: NextRequest): NextResponse | null {
  const apiKey = process.env.DASHBOARD_API_KEY

  if (!apiKey) {
    console.warn('DASHBOARD_API_KEY is not set')
    // 開発環境ではAPIキーなしでもOK
    if (process.env.NODE_ENV === 'development') {
      return null
    }
  }

  // 1. リファラーチェック（同一ドメインからのアクセスは認証不要）
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')

  if (referer && host) {
    try {
      const refererUrl = new URL(referer)
      if (refererUrl.host === host) {
        // 同一ドメインからのアクセス
        return null
      }
    } catch (e) {
      // リファラーURLのパースに失敗
    }
  }

  // 2. URLパラメータからAPIキーを取得
  const { searchParams } = new URL(request.url)
  const keyFromQuery = searchParams.get('key')

  if (keyFromQuery === apiKey) {
    return null
  }

  // 3. Authorizationヘッダーからトークンを取得
  const authHeader = request.headers.get('authorization')

  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (token === apiKey) {
      return null
    }
  }

  // 認証失敗
  return NextResponse.json(
    { error: 'Unauthorized', message: 'Valid API key required' },
    { status: 401 }
  )
}
