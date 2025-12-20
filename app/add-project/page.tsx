'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddProjectPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showGuide, setShowGuide] = useState(true)

  // フォーム状態
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [purpose, setPurpose] = useState('')
  const [forWhom, setForWhom] = useState('')
  const [status, setStatus] = useState('active')
  const [priority, setPriority] = useState(5)
  const [repositoryUrl, setRepositoryUrl] = useState('')
  const [deployUrl, setDeployUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)
      setError(null)

      const params = new URLSearchParams(window.location.search)
      const key = params.get('key') || ''

      const response = await fetch(`/api/projects?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name,
          description,
          purpose,
          for_whom: forWhom,
          status,
          priority,
          repository_url: repositoryUrl || null,
          deploy_url: deployUrl || null
        })
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to create project')
        return
      }

      // 成功したらダッシュボードにリダイレクト
      const redirectKey = params.get('key')
      router.push(redirectKey ? `/?key=${redirectKey}` : '/')
    } catch (err) {
      setError('Failed to connect to API')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const cardStyle = {
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px'
  }

  const inputStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'system-ui, sans-serif'
  }

  const buttonStyle = {
    padding: '10px 20px',
    borderRadius: '5px',
    fontSize: '14px',
    fontWeight: '500' as const,
    cursor: 'pointer',
    border: 'none'
  }

  return (
    <div style={{
      fontFamily: 'system-ui, sans-serif',
      padding: '20px',
      maxWidth: '900px',
      margin: '0 auto',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => {
            const params = new URLSearchParams(window.location.search)
            const key = params.get('key')
            router.push(key ? `/?key=${key}` : '/')
          }}
          style={{
            ...buttonStyle,
            background: '#f5f5f5',
            color: '#333',
            border: '1px solid #e0e0e0',
            marginBottom: '10px'
          }}
        >
          ← Dashboard
        </button>
        <h1 style={{ margin: 0, fontSize: '24px', color: '#333' }}>➕ Add New Project</h1>
      </div>

      {error && (
        <div style={{
          padding: '15px',
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          color: '#c00',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* Onboarding Guide */}
      {showGuide && (
        <div style={{
          ...cardStyle,
          background: '#e7f3ff',
          borderColor: '#0070f3'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <h2 style={{ marginTop: 0, fontSize: '16px', fontWeight: 'bold', color: '#0070f3' }}>
              📚 プロジェクト追加ガイド
            </h2>
            <button
              onClick={() => setShowGuide(false)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#333' }}>
            <p><strong>プロジェクト追加の流れ：</strong></p>
            <ol style={{ paddingLeft: '20px', margin: '10px 0' }}>
              <li><strong>ダッシュボードで登録</strong>：このフォームでプロジェクト情報を入力</li>
              <li><strong>リポジトリを準備</strong>：GitHubリポジトリを作成（または既存のものを使用）</li>
              <li><strong>CLAUDE.mdを作成</strong>：プロジェクトルートに<code>CLAUDE.md</code>を配置</li>
              <li><strong>task_executor.pyに追加</strong>：<code>~/orchestrator/task_executor.py</code>の<code>project_dir_mapping</code>にプロジェクトIDとディレクトリ名を追加</li>
              <li><strong>ダッシュボードから指示</strong>：タスクを投入して実行開始</li>
            </ol>
            <p><strong>CLAUDE.mdのテンプレート：</strong></p>
            <pre style={{
              background: '#f5f5f5',
              padding: '10px',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto'
            }}>{`# [プロジェクト名]

## 概要
[プロジェクトの説明]

## 目的
[何を実現するか]

## 技術スタック
- [使用技術]

## ディレクトリ構成
\`\`\`
project-root/
├── src/
└── CLAUDE.md
\`\`\`

## 開発方針
- [重要な方針]`}</pre>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
            プロジェクト情報
          </h2>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
              Project ID * <span style={{ fontSize: '12px', color: '#666' }}>(英小文字・数字・ハイフンのみ)</span>
            </label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value.toLowerCase())}
              required
              pattern="[a-z0-9\-]+"
              placeholder="my-project"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
              Project Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="My Awesome Project"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="プロジェクトの簡潔な説明..."
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' as const }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
              Purpose (目的)
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="何を実現するか..."
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
              For Whom (誰のため)
            </label>
            <input
              type="text"
              value={forWhom}
              onChange={(e) => setForWhom(e.target.value)}
              placeholder="誰のため・何のため..."
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={inputStyle}
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="planning">Planning</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                Priority (1-10)
              </label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value))}
                min="1"
                max="10"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
              Repository URL
            </label>
            <input
              type="url"
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              placeholder="https://github.com/username/repo"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
              Deploy URL
            </label>
            <input
              type="url"
              value={deployUrl}
              onChange={(e) => setDeployUrl(e.target.value)}
              placeholder="https://myproject.vercel.app"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={saving || !id || !name || !description}
            style={{
              ...buttonStyle,
              background: (saving || !id || !name || !description) ? '#ccc' : '#0070f3',
              color: 'white',
              width: '100%'
            }}
          >
            {saving ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  )
}
