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

  useEffect(() => {
    fetchActiveQuestion()
  }, [])

  const fetchActiveQuestion = async () => {
    try {
      const response = await fetch('/api/question/active')
      const data = await response.json()
      
      if (data.success && data.data) {
        setQuestion(data.data)
        
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
          
          {!hasSubmitted ? (
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
          ) : (
            <div className="success-message">
              You already answered today! Check the leaderboard to see how you're doing.
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
