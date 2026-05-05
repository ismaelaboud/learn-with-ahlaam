import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Leaderboard = () => {
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    fetchLeaderboard()
    
    // Check screen size and add resize listener
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard')
      const data = await response.json()
      
      if (data.success) {
        setParticipants(data.data)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankEmoji = (rank) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return ''
    }
  }

  const getRankClass = (rank) => {
    switch (rank) {
      case 1: return 'rank-1'
      case 2: return 'rank-2'
      case 3: return 'rank-3'
      default: return ''
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading leaderboard...</div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>Leaderboard</h1>
      
      <nav className="nav-links">
        <Link to="/">Today's Question</Link>
        <Link to="/leaderboard" className="active">Leaderboard</Link>
        <Link to="/articles">Articles</Link>
        <Link to="/history">History</Link>
      </nav>

      <div className="card">
        {participants.length > 0 ? (
          <>
            {/* Desktop Table Layout */}
            <table className="leaderboard-table desktop-only">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Correct Answers</th>
                  <th>Total Answered</th>
                  <th>Current Streak 🔥</th>
                  <th>Best Streak</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((participant, index) => (
                  <tr key={participant._id} className={getRankClass(index + 1)}>
                    <td>
                      {getRankEmoji(index + 1)} {index + 1}
                    </td>
                    <td>{participant.displayName}</td>
                    <td className="correct">{participant.totalCorrect}</td>
                    <td>{participant.totalAnswered}</td>
                    <td>{participant.currentStreak}</td>
                    <td>{participant.bestStreak}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Card Layout */}
            <div className="mobile-leaderboard mobile-only">
              {participants.map((participant, index) => (
                <div key={participant._id} className={`participant-card ${getRankClass(index + 1)}`}>
                  <div className="card-header">
                    <div className="rank-badge">
                      {getRankEmoji(index + 1) || `#${index + 1}`}
                    </div>
                    <div className="participant-name">{participant.displayName}</div>
                  </div>
                  <div className="card-stats">
                    <div className="stat-item">
                      <div className="stat-value correct">{participant.totalCorrect}</div>
                      <div className="stat-label">Correct</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{participant.totalAnswered}</div>
                      <div className="stat-label">Answered</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{participant.currentStreak}</div>
                      <div className="stat-label">Streak 🔥</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{participant.bestStreak}</div>
                      <div className="stat-label">Best</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="info-message">
            No participants yet. Be the first to answer a question!
          </div>
        )}
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link to="/" className="btn btn-secondary">
          Back to Today's Question
        </Link>
      </div>
    </div>
  )
}

export default Leaderboard
