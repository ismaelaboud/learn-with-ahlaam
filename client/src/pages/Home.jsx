import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  const [question, setQuestion] = useState(null)
  const [participantName, setParticipantName] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [countdown, setCountdown] = useState('')
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    fetchActiveQuestion()
  }, [])

  // Countdown timer effect
  useEffect(() => {
    if (!question || !question.revealAt) {
      setCountdown('')
      setIsExpired(false)
      return
    }

    const updateCountdown = () => {
      // Get current time in GMT+3
      const now = new Date()
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
      const gmt3Time = new Date(utc + (3600000 * 3))
      
      // Get reveal time in GMT+3
      const revealTime = new Date(question.revealAt)
      const revealUtc = revealTime.getTime() + (revealTime.getTimezoneOffset() * 60000)
      const gmt3RevealTime = new Date(revealUtc + (3600000 * 3))
      
      const distance = gmt3RevealTime.getTime() - gmt3Time.getTime()

      if (distance < 0) {
        setCountdown('Submissions closed!')
        setIsExpired(true)
        // Auto-refresh when countdown hits zero
        setTimeout(() => {
          fetchActiveQuestion()
        }, 1000)
        return
      }

      setIsExpired(false)
      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      let countdownText = ''
      if (days > 0) countdownText += `${days}d `
      if (hours > 0 || days > 0) countdownText += `${hours}h `
      if (minutes > 0 || hours > 0 || days > 0) countdownText += `${minutes}m `
      countdownText += `${seconds}s`

      setCountdown(`Time left: ${countdownText}`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [question])

  const fetchActiveQuestion = async () => {
    try {
      const response = await fetch('/api/question/active')
      const data = await response.json()
      
      if (data.success && data.data) {
        if (data.data.revealAt) {
          data.data.revealAt = new Date(data.data.revealAt) // Convert to Date object
        }
        setQuestion(data.data)
        console.log('Fetched question:', data.data)
        
        // Check if user has already submitted
        const savedName = localStorage.getItem('participantName')
        if (savedName) {
          setParticipantName(savedName)
          // We could check if they've submitted this question, but for simplicity
          // we'll let them try to submit again and the backend will handle it
        }
      }
    } catch (error) {
      console.error('Error fetching question:', error)
      setMessage('Error loading question. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!participantName.trim() || !answer.trim()) {
      setMessage('Please enter your name and answer.')
      return
    }

    setSubmitting(true)
    setMessage('')

    try {
      const response = await fetch(`/api/question/${question._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          participantName: participantName.trim(),
          answer: answer.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage('Answer submitted! Check back tomorrow for the result 🎉')
        setHasSubmitted(true)
        localStorage.setItem('participantName', participantName.trim())
        setAnswer('')
      } else {
        setMessage(data.message || 'Error submitting answer.')
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
      setMessage('Error submitting answer. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading today's question...</div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>Learn with Ahlaam</h1>
      
      <nav className="nav-links">
        <Link to="/" className="active">Today's Question</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        <Link to="/history">History</Link>
      </nav>

      {question ? (
        <div className="card">
          <div className="question-text">{question.text}</div>
          
          {countdown && (
            <div style={{ 
              marginBottom: '1rem', 
              padding: '0.75rem', 
              backgroundColor: isExpired ? 'var(--accent)' : 'var(--primary)', 
              color: 'white', 
              borderRadius: '8px',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '1rem'
            }}>
              {countdown}
            </div>
          )}
          
          {!hasSubmitted && !isExpired ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input
                  type="text"
                  id="name"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="answer">Your Answer</label>
                <input
                  type="text"
                  id="answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter your answer"
                  required
                />
              </div>
              
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Answer'}
              </button>
            </form>
          ) : hasSubmitted ? (
            <div className="success-message">
              You already answered today! Check the leaderboard to see how you're doing.
            </div>
          ) : (
            <div className="info-message" style={{ textAlign: 'center', padding: '1rem' }}>
              Submissions closed! Check the leaderboard for results 🎉
              <div style={{ marginTop: '1rem' }}>
                <Link to="/leaderboard" className="btn btn-primary">
                  View Leaderboard
                </Link>
              </div>
            </div>
          )}
          
          {message && (
            <div className={message.includes('Error') ? 'error-message' : 'success-message'}>
              {message}
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="info-message">
            No question today yet, check back soon!
          </div>
          <Link to="/leaderboard" className="btn btn-secondary">
            View Leaderboard
          </Link>
        </div>
      )}
    </div>
  )
}

export default Home
