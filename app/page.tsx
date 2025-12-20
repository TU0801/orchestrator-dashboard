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

interface StatusResponse {
  timestamp: string
  user_profile: UserProfile | null
  projects: Project[]
  recent_adrs: ADR[]
  project_states: ProjectState[]
  active_tasks: Task[]
  error?: string
}

export default function Dashboard() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 指示投入フォーム用のstate
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [instruction, setInstruction] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)

  const fetchStatus = async () => {
    setLoading(true)
    try {
      // URLパラメータからAPIキーを取得
      const params = new URLSearchParams(window.location.search)
      const key = params.get('key') || ''
      const response = await fetch(`/api/status?key=${key}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to fetch status')
        return
      }

      setStatus(data)
      setError(null)
    } catch (err) {
      setError('Failed to connect to API')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 15000)
    return () => clearInterval(interval)
  }, [])

  // プロジェクトが読み込まれたらデフォルトを選択
  useEffect(() => {
    if (status?.projects && status.projects.length > 0 && !selectedProject) {
      setSelectedProject(status.projects[0].id)
    }
  }, [status?.projects, selectedProject])

  const submitInstruction = async () => {
    if (!selectedProject || !instruction.trim()) {
      setSubmitMessage('プロジェクトと指示を入力してください')
      return
    }

    try {
      setSubmitting(true)
      setSubmitMessage(null)

      const response = await fetch('/api/instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject,
          instruction: instruction.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setSubmitMessage(`エラー: ${data.error}`)
        return
      }

      setSubmitMessage('✅ 指示を送信しました')
      setInstruction('')

      // ステータスを再取得してタスクリストを更新
      fetchStatus()
    } catch (err) {
      setSubmitMessage('送信に失敗しました')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const insertTemplate = (template: string) => {
    setInstruction(template)
  }

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
        <button
          onClick={fetchStatus}
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
          {/* Instruction Input Form */}
          <div style={cardStyle}>
            <h2 style={titleStyle}>📝 指示を送る</h2>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                プロジェクト
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  background: 'white',
                  minHeight: '44px'
                }}
              >
                {status.projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                指示
              </label>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="例: 検索フィルタを改善して"
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  fontSize: '16px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  resize: 'vertical',
                  fontFamily: 'system-ui, sans-serif'
                }}
              />
            </div>

            {/* テンプレート */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>よく使う指示:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['続きをやって', '状態を確認して', 'エラーを修正して', 'テストを実行して'].map(template => (
                  <button
                    key={template}
                    onClick={() => insertTemplate(template)}
                    style={{
                      padding: '10px 16px',
                      fontSize: '14px',
                      background: '#f5f5f5',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#666',
                      minHeight: '44px'
                    }}
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={submitInstruction}
              disabled={submitting || !instruction.trim()}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                fontWeight: '600',
                background: submitting || !instruction.trim() ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: submitting || !instruction.trim() ? 'not-allowed' : 'pointer',
                minHeight: '48px'
              }}
            >
              {submitting ? '送信中...' : '送信'}
            </button>

            {submitMessage && (
              <div style={{
                marginTop: '12px',
                padding: '10px',
                background: submitMessage.includes('✅') ? '#d4edda' : '#fee',
                border: `1px solid ${submitMessage.includes('✅') ? '#c3e6cb' : '#fcc'}`,
                borderRadius: '6px',
                color: submitMessage.includes('✅') ? '#155724' : '#c00',
                fontSize: '14px'
              }}>
                {submitMessage}
              </div>
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
                return (
                  <div key={project.id} style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    padding: '15px',
                    background: '#fafafa',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => window.location.href = `/projects/${project.id}`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#0070f3' }}>{project.name}</h3>
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
