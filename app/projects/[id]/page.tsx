'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

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

interface ProjectState {
  git_branch: string
  git_last_commit: string
  git_uncommitted_changes: number
  scanned_at: string
}

interface Task {
  id: number
  title: string
  status: string
  priority: string
  created_at: string
  completed_at?: string
  completion_note?: string
}

interface ADR {
  id: number
  adr_number: number
  title: string
  status: string
  decision: string
  context?: string
  consequences?: string
  created_at: string
}

interface ProjectDetail {
  project: Project
  state: ProjectState | null
  tasks: Task[]
  adrs: ADR[]
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [data, setData] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [taskFilter, setTaskFilter] = useState<string>('all')
  const [claudeMd, setClaudeMd] = useState<string | null>(null)
  const [claudeMdLoading, setClaudeMdLoading] = useState(false)

  useEffect(() => {
    fetchProjectDetail()
  }, [projectId])

  const fetchClaudeMd = async (repositoryUrl: string) => {
    if (!repositoryUrl) return

    try {
      setClaudeMdLoading(true)
      // GitHubのURLをraw.githubusercontent.comに変換
      // https://github.com/user/repo → https://raw.githubusercontent.com/user/repo/main/CLAUDE.md
      const rawUrl = repositoryUrl
        .replace('github.com', 'raw.githubusercontent.com')
        .replace(/\/$/, '') + '/main/CLAUDE.md'

      const response = await fetch(rawUrl)
      if (response.ok) {
        const text = await response.text()
        setClaudeMd(text)
      }
    } catch (err) {
      console.error('Failed to fetch CLAUDE.md:', err)
    } finally {
      setClaudeMdLoading(false)
    }
  }

  const fetchProjectDetail = async () => {
    try {
      setLoading(true)
      // URLパラメータからAPIキーを取得
      const params = new URLSearchParams(window.location.search)
      const key = params.get('key') || ''
      const response = await fetch(`/api/projects/${projectId}?key=${key}`)
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to fetch project')
        return
      }

      setData(result)
      setError(null)
      // CLAUDE.mdを取得
      if (result.project.repository_url) {
        fetchClaudeMd(result.project.repository_url)
      }
    } catch (err) {
      setError('Failed to connect to API')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ padding: '20px' }}>
        <p style={{ color: 'red' }}>Error: {error || 'Project not found'}</p>
        <button onClick={() => {
          const params = new URLSearchParams(window.location.search)
          const key = params.get('key')
          router.push(key ? `/?key=${key}` : '/')
        }} style={{ marginTop: '10px', padding: '8px 16px' }}>
          ← Back to Dashboard
        </button>
      </div>
    )
  }

  const { project, state, tasks, adrs } = data

  const filteredTasks = taskFilter === 'all'
    ? tasks
    : tasks.filter(t => t.status === taskFilter)

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
    fontWeight: 'bold' as const,
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
      {/* Header */}
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
        <div>
          <button
            onClick={() => {
              const params = new URLSearchParams(window.location.search)
              const key = params.get('key')
              router.push(key ? `/?key=${key}` : '/')
            }}
            style={{
              padding: '8px 12px',
              background: '#f5f5f5',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              marginBottom: '8px'
            }}
          >
            ← Dashboard
          </button>
          <h1 style={{ margin: '8px 0 0 0', fontSize: '24px', color: '#333' }}>
            {project.name}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{
            padding: '4px 12px',
            background: project.status === 'active' ? '#d4edda' : '#f8f9fa',
            color: project.status === 'active' ? '#155724' : '#666',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            {project.status}
          </span>
          <span style={{
            padding: '4px 12px',
            background: '#e7f3ff',
            color: '#004085',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            Priority: {project.priority}
          </span>
        </div>
      </div>

      {/* Project Info */}
      <div style={cardStyle}>
        <h2 style={titleStyle}>📋 プロジェクト情報</h2>
        <p style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>{project.description}</p>

        <div style={{ marginTop: '15px', fontSize: '14px' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>目的:</strong> {project.purpose}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>誰のため:</strong> {project.for_whom}
          </div>

          {project.repository_url && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Repository:</strong>{' '}
              <a href={project.repository_url} target="_blank" rel="noopener noreferrer"
                 style={{ color: '#0070f3', textDecoration: 'none' }}>
                {project.repository_url}
              </a>
            </div>
          )}

          {project.deploy_url && (
            <div>
              <strong>Deploy URL:</strong>{' '}
              <a href={project.deploy_url} target="_blank" rel="noopener noreferrer"
                 style={{ color: '#0070f3', textDecoration: 'none' }}>
                {project.deploy_url}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* CLAUDE.md Overview */}
      {claudeMd && (
        <div style={cardStyle}>
          <h2 style={titleStyle}>📄 プロジェクト概要 (CLAUDE.md)</h2>
          <div style={{
            background: '#f9f9f9',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            padding: '15px',
            fontSize: '14px',
            maxHeight: '400px',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            lineHeight: '1.6'
          }}>
            {claudeMd}
          </div>
        </div>
      )}
      {claudeMdLoading && (
        <div style={cardStyle}>
          <h2 style={titleStyle}>📄 プロジェクト概要 (CLAUDE.md)</h2>
          <p style={{ color: '#999', fontSize: '14px' }}>読み込み中...</p>
        </div>
      )}

      {/* Git State */}
      {state && (
        <div style={cardStyle}>
          <h2 style={titleStyle}>🔧 Git状態</h2>
          <div style={{ fontSize: '14px' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Branch:</strong> <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '3px' }}>{state.git_branch}</code>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Last Commit:</strong> <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}>{state.git_last_commit.substring(0, 8)}</code>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Uncommitted Changes:</strong>{' '}
              <span style={{ color: state.git_uncommitted_changes > 0 ? '#856404' : '#155724' }}>
                {state.git_uncommitted_changes} files
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              Scanned: {new Date(state.scanned_at).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Tasks */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
            ✅ タスク ({filteredTasks.length})
          </h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['all', 'pending', 'in_progress', 'done', 'failed'].map(filter => (
              <button
                key={filter}
                onClick={() => setTaskFilter(filter)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  background: taskFilter === filter ? '#0070f3' : '#f5f5f5',
                  color: taskFilter === filter ? 'white' : '#666',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {filter === 'all' ? 'All' : filter}
              </button>
            ))}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <p style={{ color: '#999', fontSize: '14px' }}>タスクがありません</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {filteredTasks.map(task => (
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
                      Created: {new Date(task.created_at).toLocaleString()}
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
                    maxHeight: '150px',
                    overflow: 'auto'
                  }}>
                    {task.completion_note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADRs */}
      <div style={cardStyle}>
        <h2 style={titleStyle}>📋 Architecture Decision Records ({adrs.length})</h2>

        {adrs.length === 0 ? (
          <p style={{ color: '#999', fontSize: '14px' }}>ADRがありません</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {adrs.map(adr => (
              <div key={adr.id} style={{
                borderLeft: '3px solid #0070f3',
                paddingLeft: '15px',
                paddingBottom: '10px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>
                  ADR #{adr.adr_number}: {adr.title}
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  background: adr.status === 'accepted' ? '#d4edda' : '#f8f9fa',
                  color: adr.status === 'accepted' ? '#155724' : '#666',
                  borderRadius: '3px',
                  fontSize: '11px',
                  fontWeight: '500',
                  marginBottom: '8px'
                }}>
                  {adr.status}
                </div>

                {adr.context && (
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                    <strong>Context:</strong> {adr.context}
                  </div>
                )}

                <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                  <strong>Decision:</strong> {adr.decision}
                </div>

                {adr.consequences && (
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                    <strong>Consequences:</strong> {adr.consequences}
                  </div>
                )}

                <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
                  {new Date(adr.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
