'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ScoreTrend {
  date: string
  average_score: number
}

interface FailureCategory {
  category: string
  count: number
}

interface ToolUsage {
  tool: string
  total: number
  success: number
  failed: number
  success_rate: number
}

interface AnalyticsData {
  score_trend: ScoreTrend[]
  failure_categories: FailureCategory[]
  tool_usage: ToolUsage[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d']

export default function AnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetchAnalytics()
  }, [days])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams(window.location.search)
      const key = params.get('key') || ''
      const response = await fetch(`/api/analytics?key=${key}&days=${days}`)
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to fetch analytics')
        return
      }

      setData(result)
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
        <p>Loading analytics...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ padding: '20px' }}>
        <p style={{ color: 'red' }}>Error: {error || 'No data available'}</p>
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
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  }

  const titleStyle = {
    fontSize: '18px',
    fontWeight: 'bold' as const,
    marginBottom: '20px',
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
            📊 Analytics
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[7, 14, 30, 60].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                background: days === d ? '#0070f3' : '#f5f5f5',
                color: days === d ? 'white' : '#666',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {/* Score Trend */}
      <div style={cardStyle}>
        <h2 style={titleStyle}>Score Trend (Average per Day)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.score_trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="average_score" stroke="#0070f3" name="Average Score" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Failure Categories */}
      <div style={cardStyle}>
        <h2 style={titleStyle}>Failure Categories</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
          <ResponsiveContainer width="50%" height={300}>
            <PieChart>
              <Pie
                data={data.failure_categories}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {data.failure_categories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ flex: 1 }}>
            <table style={{ width: '100%', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Category</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Count</th>
                </tr>
              </thead>
              <tbody>
                {data.failure_categories.map((cat, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px' }}>{cat.category}</td>
                    <td style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold' }}>{cat.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tool Usage */}
      <div style={cardStyle}>
        <h2 style={titleStyle}>Tool Usage Statistics</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.tool_usage}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tool" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="success" stackId="a" fill="#82ca9d" name="Success" />
            <Bar dataKey="failed" stackId="a" fill="#ff8042" name="Failed" />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ marginTop: '20px' }}>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Tool</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Total</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Success</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Failed</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.tool_usage.map((tool, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px' }}>{tool.tool}</td>
                  <td style={{ textAlign: 'right', padding: '8px' }}>{tool.total}</td>
                  <td style={{ textAlign: 'right', padding: '8px', color: '#28a745' }}>{tool.success}</td>
                  <td style={{ textAlign: 'right', padding: '8px', color: '#dc3545' }}>{tool.failed}</td>
                  <td style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold' }}>{tool.success_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
