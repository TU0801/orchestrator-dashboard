'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Improvement {
  id: number
  project_id: string
  trigger_type: string
  trigger_details: string
  target_files: string
  changes_summary: string
  applied_at: string
  rollback_at?: string
  rollback_reason?: string
  before_avg_score?: number
  after_avg_score?: number
  improvement_confirmed?: boolean
}

export default function ImprovementsPage() {
  const router = useRouter()
  const [improvements, setImprovements] = useState<Improvement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchImprovements()
  }, [])

  const fetchImprovements = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams(window.location.search)
      const key = params.get('key') || ''
      const response = await fetch(`/api/improvements?key=${key}`)
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to fetch improvements')
        return
      }

      setImprovements(result.improvements || [])
      setError(null)
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
        <p>Loading improvements...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <p style={{ color: 'red' }}>Error: {error}</p>
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

  const parseTriggerDetails = (details: string) => {
    try {
      return JSON.parse(details)
    } catch {
      return {}
    }
  }

  const parseTargetFiles = (files: string) => {
    try {
      return JSON.parse(files)
    } catch {
      return []
    }
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
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
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
            🔧 Auto-Improvements
          </h1>
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {improvements.length} improvements total
        </div>
      </div>

      {/* Improvements List */}
      {improvements.length === 0 ? (
        <div style={cardStyle}>
          <p style={{ color: '#999', fontSize: '14px' }}>No auto-improvements have been applied yet.</p>
        </div>
      ) : (
        improvements.map(improvement => {
          const triggerDetails = parseTriggerDetails(improvement.trigger_details)
          const targetFiles = parseTargetFiles(improvement.target_files)

          return (
            <div key={improvement.id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                    #{improvement.id}: {improvement.project_id}
                  </h2>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    Applied: {new Date(improvement.applied_at).toLocaleString()}
                    {improvement.rollback_at && ` • Rolled back: ${new Date(improvement.rollback_at).toLocaleString()}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{
                    padding: '4px 12px',
                    background: improvement.trigger_type === 'consecutive_failures' ? '#fff3cd' : '#d1ecf1',
                    color: improvement.trigger_type === 'consecutive_failures' ? '#856404' : '#0c5460',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {improvement.trigger_type}
                  </span>
                  {improvement.rollback_at && (
                    <span style={{
                      padding: '4px 12px',
                      background: '#f8d7da',
                      color: '#721c24',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      Rolled back
                    </span>
                  )}
                </div>
              </div>

              {/* Trigger Details */}
              <div style={{ marginBottom: '12px', padding: '10px', background: '#f9f9f9', borderRadius: '4px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Trigger Details:</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {triggerDetails.failure_category && (
                    <div>Category: {triggerDetails.failure_category}</div>
                  )}
                  {triggerDetails.average_score !== undefined && (
                    <div>Average Score: {triggerDetails.average_score.toFixed(2)}</div>
                  )}
                  {triggerDetails.count && (
                    <div>Consecutive Failures: {triggerDetails.count}</div>
                  )}
                </div>
              </div>

              {/* Target Files */}
              {targetFiles.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Modified Files:</div>
                  <div style={{ fontSize: '12px' }}>
                    {targetFiles.map((file: string, idx: number) => (
                      <div key={idx} style={{
                        padding: '4px 8px',
                        background: '#f0f0f0',
                        borderRadius: '3px',
                        marginBottom: '4px',
                        fontFamily: 'monospace'
                      }}>
                        {file}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Changes Summary */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Changes Summary:</div>
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  whiteSpace: 'pre-wrap',
                  background: '#f9f9f9',
                  padding: '10px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  maxHeight: '200px',
                  overflow: 'auto'
                }}>
                  {improvement.changes_summary}
                </div>
              </div>

              {/* Score Comparison */}
              {improvement.before_avg_score !== undefined && improvement.after_avg_score !== undefined && (
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '10px',
                  background: '#e7f3ff',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  <div>
                    <span style={{ fontWeight: '600' }}>Before:</span> {improvement.before_avg_score.toFixed(2)}
                  </div>
                  <div>
                    <span style={{ fontWeight: '600' }}>After:</span> {improvement.after_avg_score.toFixed(2)}
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    {improvement.improvement_confirmed ? (
                      <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Confirmed Improvement</span>
                    ) : (
                      <span style={{ color: '#ffc107' }}>⏳ Measuring...</span>
                    )}
                  </div>
                </div>
              )}

              {/* Rollback Reason */}
              {improvement.rollback_reason && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px',
                  background: '#f8d7da',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#721c24'
                }}>
                  <strong>Rollback Reason:</strong> {improvement.rollback_reason}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
