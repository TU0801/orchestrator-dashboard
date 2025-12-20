'use client'

import { useEffect, useState } from 'react'

interface UserProfile {
  id: number
  current_situation: string
  current_challenges: string[]
  current_goals: string[]
  updated_at: string
}

interface Project {
  id: string
  name: string
  description: string
  purpose: string
  for_whom: string
  status: string
  priority: number
  repository_url?: string
  deploy_url?: string
}

interface ADR {
  id: number
  project_id: string
  adr_number: number
  title: string
  status: string
  decision: string
  created_at: string
}

interface ProjectState {
  id: number
  project_id: string
  git_branch: string
  git_last_commit: string
  git_uncommitted_changes: number
  scanned_at: string
}

interface Task {
  id: number
  project_id: string
  title: string
  status: string
  priority: string
  created_at: string
  completed_at?: string
  completion_note?: string
}

interface Suggestion {
  id: number
  project_id: string
  title: string
  description: string
  source: string
  priority: number
  is_selected: boolean
  created_at: string
  created_by: string
}

interface ProjectSummary {
  id: number
  project_id: string
  current_status: string
  next_milestone: string
  recent_progress: string
  updated_at: string
}

interface StatusResponse {
  timestamp: string
  user_profile: UserProfile | null
  projects: Project[]
  recent_adrs: ADR[]
  project_states: ProjectState[]
  project_summaries: ProjectSummary[]
  active_tasks: Task[]
  error?: string
}

export default function Dashboard() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 提案関連のstate
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set())
  const [executing, setExecuting] = useState(false)
  const [executeMessage, setExecuteMessage] = useState<string | null>(null)

  // カスタム提案追加用のstate
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customProject, setCustomProject] = useState<string>('')
  const [customTitle, setCustomTitle] = useState<string>('')
  const [customDescription, setCustomDescription] = useState<string>('')
  const [addingCustom, setAddingCustom] = useState(false)

  const fetchStatus = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      // URLパラメータからAPIキーを取得
      const params = new URLSearchParams(window.location.search)
      const key = params.get('key') || ''
      const response = await fetch(`/api/status?key=${key}`)
      const data = await response.json()

      if (!response.ok) {
        if (!silent) setError(data.error || 'Failed to fetch status')
        return
      }

      setStatus(data)
      setError(null)
    } catch (err) {
      if (!silent) {
        setError('Failed to connect to API')
        console.error(err)
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const fetchSuggestions = async () => {
    try {
      const params = new URLSearchParams(window.location.search)
      const key = params.get('key') || ''
      const response = await fetch(`/api/suggestions?key=${key}`)
      const data = await response.json()

      if (response.ok) {
        setSuggestions(data.suggestions || [])
      }
    } catch (err) {
      console.error('Failed to fetch suggestions:', err)
    }
  }

  const addCustomSuggestion = async () => {
    if (!customProject || !customTitle.trim()) {
      return
    }

    try {
      setAddingCustom(true)
      const params = new URLSearchParams(window.location.search)
      const key = params.get('key') || ''

      const response = await fetch(`/api/suggestions?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: customProject,
          title: customTitle.trim(),
          description: customDescription.trim()
        })
      })

      if (response.ok) {
        setCustomTitle('')
        setCustomDescription('')
        setShowCustomForm(false)
        fetchSuggestions()
      }
    } catch (err) {
      console.error('Failed to add custom suggestion:', err)
    } finally {
      setAddingCustom(false)
    }
  }

  const executeSuggestions = async () => {
    if (selectedSuggestions.size === 0) {
      setExecuteMessage('提案を選択してください')
      return
    }

    try {
      setExecuting(true)
      setExecuteMessage(null)

      const params = new URLSearchParams(window.location.search)
      const key = params.get('key') || ''

      const response = await fetch(`/api/suggestions/execute?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestion_ids: Array.from(selectedSuggestions)
        })
      })

      const data = await response.json()

      if (response.ok) {
        setExecuteMessage(`✅ ${data.count}件のタスクを投入しました`)
        setSelectedSuggestions(new Set())
        fetchSuggestions()
        fetchStatus(true)
      } else {
        setExecuteMessage(`エラー: ${data.error}`)
      }
    } catch (err) {
      setExecuteMessage('実行に失敗しました')
      console.error(err)
    } finally {
      setExecuting(false)
    }
  }

  const toggleSuggestion = (id: number) => {
    const newSelected = new Set(selectedSuggestions)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedSuggestions(newSelected)
  }

  useEffect(() => {
    fetchStatus()
    fetchSuggestions()
    // 15秒ごとにタスク一覧と提案を自動更新（サイレントモード）
    const interval = setInterval(() => {
      fetchStatus(true)
      fetchSuggestions()
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  // プロジェクトが読み込まれたらデフォルトを選択
  useEffect(() => {
    if (status?.projects && status.projects.length > 0 && !customProject) {
      setCustomProject(status.projects[0].id)
    }
  }, [status?.projects, customProject])

  const cardStyle = {
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  }

  const titleStyle = {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#333'
  }

  return (
    <div style={{
      fontFamily: 'system-ui, sans-serif',
      padding: '12px',
      maxWidth: '1400px',
      margin: '0 auto',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', color: '#333' }}>
          Orchestrator Dashboard
        </h1>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              const params = new URLSearchParams(window.location.search)
              const key = params.get('key')
              window.location.href = key ? `/add-project?key=${key}` : '/add-project'
            }}
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '14px',
              fontWeight: '500',
              minHeight: '44px'
            }}
          >
            ➕ Add Project
          </button>
          <button
            onClick={() => {
              const params = new URLSearchParams(window.location.search)
              const key = params.get('key')
              window.location.href = key ? `/analytics?key=${key}` : '/analytics'
            }}
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              background: '#fff',
              color: '#0070f3',
              border: '1px solid #0070f3',
              borderRadius: '5px',
              fontSize: '14px',
              fontWeight: '500',
              minHeight: '44px'
            }}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => {
              const params = new URLSearchParams(window.location.search)
              const key = params.get('key')
              window.location.href = key ? `/improvements?key=${key}` : '/improvements'
            }}
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              background: '#fff',
              color: '#0070f3',
              border: '1px solid #0070f3',
              borderRadius: '5px',
              fontSize: '14px',
              fontWeight: '500',
              minHeight: '44px'
            }}
          >
            🔧 Improvements
          </button>
          <button
            onClick={() => {
              const params = new URLSearchParams(window.location.search)
              const key = params.get('key')
              window.location.href = key ? `/settings?key=${key}` : '/settings'
            }}
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              background: '#fff',
              color: '#666',
              border: '1px solid #e0e0e0',
              borderRadius: '5px',
              fontSize: '14px',
              fontWeight: '500',
              minHeight: '44px'
            }}
          >
            ⚙️ Settings
          </button>
          <button
            onClick={() => fetchStatus()}
            disabled={loading}
            style={{
              padding: '10px 20px',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '14px',
              fontWeight: '500',
              minHeight: '44px'
            }}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
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
          Error: {error}
        </div>
      )}

      {status && !loading && (
        <>
          {/* Suggestions Section */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ ...titleStyle, marginBottom: 0 }}>💡 やること候補</h2>
              <button
                onClick={() => setShowCustomForm(!showCustomForm)}
                style={{
                  padding: '8px 16px',
                  background: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                ＋ カスタム指示を追加
              </button>
            </div>

            {/* Custom Suggestion Form */}
            {showCustomForm && (
              <div style={{
                background: '#f9f9f9',
                padding: '15px',
                borderRadius: '6px',
                marginBottom: '15px',
                border: '1px solid #e0e0e0'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                    プロジェクト
                  </label>
                  <select
                    value={customProject}
                    onChange={(e) => setCustomProject(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '14px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      background: 'white'
                    }}
                  >
                    {status.projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                    タイトル
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="例: 検索フィルタを改善"
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '14px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                    説明 (任意)
                  </label>
                  <textarea
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="詳細な説明..."
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      padding: '8px',
                      fontSize: '14px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      resize: 'vertical',
                      fontFamily: 'system-ui, sans-serif'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={addCustomSuggestion}
                    disabled={addingCustom || !customTitle.trim()}
                    style={{
                      padding: '8px 16px',
                      background: addingCustom || !customTitle.trim() ? '#ccc' : '#0070f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: addingCustom || !customTitle.trim() ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    {addingCustom ? '追加中...' : '追加'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomForm(false)
                      setCustomTitle('')
                      setCustomDescription('')
                    }}
                    style={{
                      padding: '8px 16px',
                      background: '#f5f5f5',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            {/* Suggestions List */}
            {suggestions.length === 0 ? (
              <p style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                提案がありません。タスクを完了するとClaude Codeが自動的に提案します。
              </p>
            ) : (
              <>
                <div style={{ marginBottom: '15px' }}>
                  {Object.entries(
                    suggestions.reduce((acc, s) => {
                      if (!acc[s.project_id]) acc[s.project_id] = []
                      acc[s.project_id].push(s)
                      return acc
                    }, {} as Record<string, Suggestion[]>)
                  ).map(([projectId, projectSuggestions]) => {
                    const project = status.projects.find(p => p.id === projectId)
                    return (
                      <div key={projectId} style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px', color: '#0070f3' }}>
                          {project?.name || projectId}
                        </h3>
                        <div style={{ display: 'grid', gap: '10px' }}>
                          {projectSuggestions.map(suggestion => (
                            <div
                              key={suggestion.id}
                              onClick={() => toggleSuggestion(suggestion.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'start',
                                gap: '12px',
                                padding: '12px',
                                background: selectedSuggestions.has(suggestion.id) ? '#e7f3ff' : '#fafafa',
                                border: selectedSuggestions.has(suggestion.id) ? '2px solid #0070f3' : '1px solid #e0e0e0',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedSuggestions.has(suggestion.id)}
                                onChange={() => toggleSuggestion(suggestion.id)}
                                style={{
                                  marginTop: '2px',
                                  width: '18px',
                                  height: '18px',
                                  cursor: 'pointer'
                                }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                  {suggestion.title}
                                </div>
                                {suggestion.description && (
                                  <div style={{ fontSize: '13px', color: '#666' }}>
                                    {suggestion.description}
                                  </div>
                                )}
                                <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                  {suggestion.source === 'ai_proposal' ? '🤖 AI提案' :
                                   suggestion.source === 'backlog' ? '📋 バックログ' : '✏️ カスタム'}
                                  {' • '}
                                  {new Date(suggestion.created_at).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <button
                  onClick={executeSuggestions}
                  disabled={executing || selectedSuggestions.size === 0}
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '16px',
                    fontWeight: '600',
                    background: executing || selectedSuggestions.size === 0 ? '#ccc' : '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: executing || selectedSuggestions.size === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {executing ? '実行中...' : `選択したものを実行 (${selectedSuggestions.size}件)`}
                </button>

                {executeMessage && (
                  <div style={{
                    marginTop: '12px',
                    padding: '10px',
                    background: executeMessage.includes('✅') ? '#d4edda' : '#fee',
                    border: `1px solid ${executeMessage.includes('✅') ? '#c3e6cb' : '#fcc'}`,
                    borderRadius: '6px',
                    color: executeMessage.includes('✅') ? '#155724' : '#c00',
                    fontSize: '14px'
                  }}>
                    {executeMessage}
                  </div>
                )}
              </>
            )}
          </div>

          {/* User Profile */}
          {status.user_profile && (
            <div style={cardStyle}>
              <h2 style={titleStyle}>👤 User Profile</h2>
              <p style={{ marginBottom: '10px' }}><strong>状況:</strong> {status.user_profile.current_situation}</p>

              <div style={{ marginTop: '15px' }}>
                <strong>課題:</strong>
                <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                  {status.user_profile.current_challenges.map((challenge, i) => (
                    <li key={i} style={{ marginBottom: '5px', fontSize: '14px' }}>{challenge}</li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: '15px' }}>
                <strong>目標:</strong>
                <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                  {status.user_profile.current_goals.map((goal, i) => (
                    <li key={i} style={{ marginBottom: '5px', fontSize: '14px', color: '#0070f3' }}>{goal}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Projects */}
          <div style={cardStyle}>
            <h2 style={titleStyle}>📁 Projects ({status.projects.length})</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '15px' }}>
              {status.projects.map(project => {
                const state = status.project_states.find(s => s.project_id === project.id)
                const summary = status.project_summaries.find(s => s.project_id === project.id)
                return (
                  <div key={project.id} style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    padding: '15px',
                    background: '#fafafa',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search)
                    const key = params.get('key')
                    window.location.href = key ? `/projects/${project.id}?key=${key}` : `/projects/${project.id}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#0070f3' }}>{project.name}</h3>

                    {/* プロジェクトサマリー */}
                    {summary && (
                      <div style={{
                        background: '#e7f3ff',
                        border: '1px solid #0070f3',
                        borderRadius: '4px',
                        padding: '10px',
                        marginBottom: '10px',
                        fontSize: '13px'
                      }}>
                        {summary.current_status && (
                          <div style={{ marginBottom: '4px' }}>
                            <strong>💬 現在:</strong> {summary.current_status}
                          </div>
                        )}
                        {summary.next_milestone && (
                          <div style={{ marginBottom: '4px' }}>
                            <strong>🎯 次:</strong> {summary.next_milestone}
                          </div>
                        )}
                        {summary.recent_progress && (
                          <div style={{ color: '#0070f3' }}>
                            <strong>✨ 最近:</strong> {summary.recent_progress}
                          </div>
                        )}
                      </div>
                    )}

                    <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>{project.description}</p>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      <div><strong>誰のため:</strong> {project.for_whom}</div>
                      <div><strong>Status:</strong> <span style={{
                        padding: '2px 8px',
                        background: project.status === 'active' ? '#d4edda' : '#f8f9fa',
                        borderRadius: '3px',
                        color: project.status === 'active' ? '#155724' : '#666'
                      }}>{project.status}</span></div>
                      {state && (
                        <>
                          <div style={{ marginTop: '8px' }}><strong>Branch:</strong> {state.git_branch}</div>
                          <div><strong>Uncommitted:</strong> {state.git_uncommitted_changes} files</div>
                        </>
                      )}
                      {project.deploy_url && (
                        <div style={{ marginTop: '8px' }}>
                          <a href={project.deploy_url} target="_blank" rel="noopener noreferrer"
                             style={{ color: '#0070f3', textDecoration: 'none' }}>
                            🔗 Deploy
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent ADRs */}
          {status.recent_adrs.length > 0 && (
            <div style={cardStyle}>
              <h2 style={titleStyle}>📋 Recent Architecture Decisions</h2>
              {status.recent_adrs.map(adr => (
                <div key={adr.id} style={{
                  borderLeft: '3px solid #0070f3',
                  paddingLeft: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>
                    ADR #{adr.adr_number}: {adr.title}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>
                    {adr.decision}
                  </div>
                  <div style={{ fontSize: '11px', color: '#999' }}>
                    {adr.project_id} • {new Date(adr.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* All Tasks - with filter */}
          {status.active_tasks.length > 0 && (
            <div style={cardStyle}>
              <h2 style={titleStyle}>✅ タスク一覧 ({status.active_tasks.length})</h2>
              <div style={{ display: 'grid', gap: '10px' }}>
                {status.active_tasks.map(task => (
                  <div key={task.id} style={{
                    padding: '12px',
                    background: '#fafafa',
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                          #{task.id}: {task.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#888' }}>
                          {task.project_id} • {task.priority}
                          {task.created_at && ` • Created: ${new Date(task.created_at).toLocaleString()}`}
                          {task.completed_at && ` • Completed: ${new Date(task.completed_at).toLocaleString()}`}
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 12px',
                        background:
                          task.status === 'done' ? '#d4edda' :
                          task.status === 'failed' ? '#f8d7da' :
                          task.status === 'in_progress' ? '#fff3cd' : '#e7f3ff',
                        color:
                          task.status === 'done' ? '#155724' :
                          task.status === 'failed' ? '#721c24' :
                          task.status === 'in_progress' ? '#856404' : '#004085',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        whiteSpace: 'nowrap'
                      }}>
                        {task.status}
                      </div>
                    </div>

                    {task.completion_note && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px',
                        background: 'white',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#666',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '100px',
                        overflow: 'auto'
                      }}>
                        {task.completion_note.substring(0, 200)}
                        {task.completion_note.length > 200 && '...'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div style={{ textAlign: 'center', color: '#999', fontSize: '12px', marginTop: '20px' }}>
            Last updated: {new Date(status.timestamp).toLocaleString()}
          </div>
        </>
      )}
    </div>
  )
}
