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

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/status')
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
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const cardStyle = {
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
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
      padding: '20px',
      maxWidth: '1400px',
      margin: '0 auto',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '28px', color: '#333' }}>
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
            fontWeight: '500'
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
                    background: '#fafafa'
                  }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>{project.name}</h3>
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

          {/* Active Tasks */}
          {status.active_tasks.length > 0 && (
            <div style={cardStyle}>
              <h2 style={titleStyle}>✅ Active Tasks ({status.active_tasks.length})</h2>
              <div style={{ display: 'grid', gap: '10px' }}>
                {status.active_tasks.map(task => (
                  <div key={task.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: '#fafafa',
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        {task.project_id} • {task.priority}
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 12px',
                      background: task.status === 'in_progress' ? '#fff3cd' : '#e7f3ff',
                      color: task.status === 'in_progress' ? '#856404' : '#004085',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {task.status}
                    </div>
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
