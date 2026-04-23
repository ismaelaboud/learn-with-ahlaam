import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Leaderboard = () => {
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
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
        <Link to="/history">History</Link>
      </nav>

      <div className="card">
        {participants.length > 0 ? (
          <table className="leaderboard-table">
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
