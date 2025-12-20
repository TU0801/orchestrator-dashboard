'use client'

import { useEffect, useState } from 'react'

interface StatusResponse {
  status: any
  updated_at: string
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
    const interval = setInterval(fetchStatus, 30000) // Auto-refresh every 30s
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      fontFamily: 'system-ui, sans-serif',
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{ marginBottom: '20px' }}>Orchestrator Dashboard</h1>

      <button
        onClick={fetchStatus}
        style={{
          padding: '10px 20px',
          marginBottom: '20px',
          cursor: 'pointer',
          background: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px'
        }}
      >
        Refresh
      </button>

      {loading && <p>Loading...</p>}

      {error && (
        <div style={{
          padding: '15px',
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '5px',
          color: '#c00'
        }}>
          Error: {error}
        </div>
      )}

      {status && !loading && (
        <div>
          <p style={{ color: '#666', marginBottom: '10px' }}>
            Last updated: {new Date(status.updated_at).toLocaleString()}
          </p>

          <pre style={{
            background: '#f5f5f5',
            padding: '20px',
            borderRadius: '5px',
            overflow: 'auto',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            {JSON.stringify(status.status, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
