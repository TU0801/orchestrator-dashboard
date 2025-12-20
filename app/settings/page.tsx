'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface UserProfile {
  id: number
  current_situation: string
  current_challenges: string[]
  current_goals: string[]
  updated_at: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // フォーム状態
  const [currentSituation, setCurrentSituation] = useState('')
  const [currentChallenges, setCurrentChallenges] = useState<string[]>([''])
  const [currentGoals, setCurrentGoals] = useState<string[]>([''])

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams(window.location.search)
      const key = params.get('key') || ''
      const response = await fetch(`/api/user-profile?key=${key}`)
      const result = await response.json()

      if (response.ok && result.profile) {
        setProfile(result.profile)
        setCurrentSituation(result.profile.current_situation)
        setCurrentChallenges(result.profile.current_challenges.length > 0 ? result.profile.current_challenges : [''])
        setCurrentGoals(result.profile.current_goals.length > 0 ? result.profile.current_goals : [''])
      }
      setError(null)
    } catch (err) {
      setError('Failed to load profile')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const params = new URLSearchParams(window.location.search)
      const key = params.get('key') || ''

      const response = await fetch(`/api/user-profile?key=${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_situation: currentSituation,
          current_challenges: currentChallenges.filter(c => c.trim() !== ''),
          current_goals: currentGoals.filter(g => g.trim() !== '')
        })
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to save profile')
        return
      }

      setSuccess(true)
      setProfile(result.profile)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('Failed to connect to API')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const addChallenge = () => {
    setCurrentChallenges([...currentChallenges, ''])
  }

  const removeChallenge = (index: number) => {
    setCurrentChallenges(currentChallenges.filter((_, i) => i !== index))
  }

  const updateChallenge = (index: number, value: string) => {
    const updated = [...currentChallenges]
    updated[index] = value
    setCurrentChallenges(updated)
  }

  const addGoal = () => {
    setCurrentGoals([...currentGoals, ''])
  }

  const removeGoal = (index: number) => {
    setCurrentGoals(currentGoals.filter((_, i) => i !== index))
  }

  const updateGoal = (index: number, value: string) => {
    const updated = [...currentGoals]
    updated[index] = value
    setCurrentGoals(updated)
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    )
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
      maxWidth: '800px',
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
        <h1 style={{ margin: 0, fontSize: '24px', color: '#333' }}>⚙️ Settings</h1>
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

      {success && (
        <div style={{
          padding: '15px',
          background: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '8px',
          color: '#155724',
          marginBottom: '20px'
        }}>
          Profile saved successfully!
        </div>
      )}

      {/* User Profile Form */}
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
          User Profile
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
            Current Situation *
          </label>
          <textarea
            value={currentSituation}
            onChange={(e) => setCurrentSituation(e.target.value)}
            placeholder="自動化の目的、現在の状況を記述..."
            style={{
              ...inputStyle,
              minHeight: '100px',
              resize: 'vertical' as const
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
            Current Challenges
          </label>
          {currentChallenges.map((challenge, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={challenge}
                onChange={(e) => updateChallenge(index, e.target.value)}
                placeholder="課題を入力..."
                style={inputStyle}
              />
              <button
                onClick={() => removeChallenge(index)}
                style={{
                  ...buttonStyle,
                  background: '#fee',
                  color: '#c00',
                  padding: '10px 15px'
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={addChallenge}
            style={{
              ...buttonStyle,
              background: '#f5f5f5',
              color: '#333',
              border: '1px solid #e0e0e0'
            }}
          >
            + Add Challenge
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
            Current Goals
          </label>
          {currentGoals.map((goal, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={goal}
                onChange={(e) => updateGoal(index, e.target.value)}
                placeholder="目標を入力..."
                style={inputStyle}
              />
              <button
                onClick={() => removeGoal(index)}
                style={{
                  ...buttonStyle,
                  background: '#fee',
                  color: '#c00',
                  padding: '10px 15px'
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={addGoal}
            style={{
              ...buttonStyle,
              background: '#f5f5f5',
              color: '#333',
              border: '1px solid #e0e0e0'
            }}
          >
            + Add Goal
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !currentSituation.trim()}
          style={{
            ...buttonStyle,
            background: saving || !currentSituation.trim() ? '#ccc' : '#0070f3',
            color: 'white',
            width: '100%'
          }}
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}
