import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authenticating, setAuthenticating] = useState(false)
  const [authError, setAuthError] = useState('')
  
  const [activeQuestion, setActiveQuestion] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [pastQuestions, setPastQuestions] = useState([])
  
  const [newQuestion, setNewQuestion] = useState('')
  const [newAnswer, setNewAnswer] = useState('')
  const [creating, setCreating] = useState(false)
  
  const [closing, setClosing] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Check if admin is authenticated from localStorage
    const savedAuth = localStorage.getItem('adminAuth')
    if (savedAuth === 'true') {
      setIsAuthenticated(true)
      fetchAdminData()
    }
  }, [])

  const fetchAdminData = async () => {
    try {
      // Fetch active question
      const activeResponse = await fetch('/api/question/active')
      const activeData = await activeResponse.json()
      
      if (activeData.success && activeData.data) {
        setActiveQuestion(activeData.data)
        
        // Fetch submissions for active question
        const submissionsResponse = await fetch(`/api/admin/question/${activeData.data._id}/submissions`, {
          headers: {
            'x-admin-password': localStorage.getItem('adminPassword')
          }
        })
        const submissionsData = await submissionsResponse.json()
        
        if (submissionsData.success) {
          setSubmissions(submissionsData.data.submissions)
        }
      }

      // Fetch past questions
      const historyResponse = await fetch('/api/questions/history')
      const historyData = await historyResponse.json()
      
      if (historyData.success) {
        setPastQuestions(historyData.data.questions)
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthenticating(true)
    setAuthError('')

    try {
      // Test authentication by trying to access admin endpoint
      const response = await fetch('/api/admin/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ text: 'test', correctAnswer: 'test' })
      })

      if (response.status === 401) {
        setAuthError('Invalid password')
      } else if (response.status === 400) {
        // Authentication successful, but request failed (expected)
        setIsAuthenticated(true)
        localStorage.setItem('adminAuth', 'true')
        localStorage.setItem('adminPassword', password)
        fetchAdminData()
      }
    } catch (error) {
      console.error('Authentication error:', error)
      setAuthError('Authentication failed')
    } finally {
      setAuthenticating(false)
    }
  }

  const handleCreateQuestion = async (e) => {
    e.preventDefault()
    
    if (!newQuestion.trim() || !newAnswer.trim()) {
      setMessage('Please fill in both fields')
      return
    }

    setCreating(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': localStorage.getItem('adminPassword')
        },
        body: JSON.stringify({
          text: newQuestion.trim(),
          correctAnswer: newAnswer.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage('Question created successfully!')
        setNewQuestion('')
        setNewAnswer('')
        setActiveQuestion(data.data)
        setSubmissions([])
      } else {
        setMessage(data.message || 'Error creating question')
      }
    } catch (error) {
      console.error('Error creating question:', error)
      setMessage('Error creating question')
    } finally {
      setCreating(false)
    }
  }

  const handleCloseQuestion = async () => {
    if (!activeQuestion) return

    setClosing(true)
    setMessage('')

    try {
      const response = await fetch(`/api/admin/question/${activeQuestion._id}/close`, {
        method: 'POST',
        headers: {
          'x-admin-password': localStorage.getItem('adminPassword')
        }
      })

      const data = await response.json()

      if (data.success) {
        setMessage(`Question closed! ${data.data.stats.correct}/${data.data.stats.total} got it right!`)
        setActiveQuestion(null)
        setSubmissions([])
        // Refresh past questions
        const historyResponse = await fetch('/api/questions/history')
        const historyData = await historyResponse.json()
        if (historyData.success) {
          setPastQuestions(historyData.data.questions)
        }
      } else {
        setMessage(data.message || 'Error closing question')
      }
    } catch (error) {
      console.error('Error closing question:', error)
      setMessage('Error closing question')
    } finally {
      setClosing(false)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('adminAuth')
    localStorage.removeItem('adminPassword')
    setActiveQuestion(null)
    setSubmissions([])
    setPastQuestions([])
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="container">
        <h1>Admin Login</h1>
        
        <div className="card">
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="password">Admin Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={authenticating}>
              {authenticating ? 'Authenticating...' : 'Login'}
            </button>
          </form>
          
          {authError && (
            <div className="error-message" style={{ marginTop: '1rem' }}>
              {authError}
            </div>
          )}
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/" className="btn btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Admin Panel</h1>
        <button onClick={handleLogout} className="btn btn-secondary">
          Logout
        </button>
      </div>
      
      <nav className="nav-links">
        <Link to="/">Today's Question</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        <Link to="/history">History</Link>
      </nav>

      {message && (
        <div className={message.includes('Error') ? 'error-message' : 'success-message'}>
          {message}
        </div>
      )}

      {/* Active Question Section */}
      <div className="card">
        <h2>Active Question</h2>
        
        {activeQuestion ? (
          <div>
            <div className="question-text">{activeQuestion.text}</div>
            
            <h3>Submissions ({submissions.length})</h3>
            <div className="submission-list">
              {submissions.length > 0 ? (
                submissions.map((submission) => (
                  <div key={submission._id} className="submission-item">
                    <span>{submission.participantName}</span>
                    <span>{submission.answer}</span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>
                  No submissions yet
                </div>
              )}
            </div>
            
            <button 
              onClick={handleCloseQuestion} 
              className="btn btn-danger" 
              disabled={closing}
              style={{ marginTop: '1rem' }}
            >
              {closing ? 'Closing...' : 'Close & Reveal Answer'}
            </button>
          </div>
        ) : (
          <div className="info-message">
            No active question
          </div>
        )}
      </div>

      {/* Post New Question Section */}
      <div className="card">
        <h2>Post New Question</h2>
        
        {activeQuestion ? (
          <div className="error-message">
            Close the current question first before posting a new one.
          </div>
        ) : (
          <form onSubmit={handleCreateQuestion}>
            <div className="form-group">
              <label htmlFor="newQuestion">Question Text</label>
              <textarea
                id="newQuestion"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Enter the question text"
                rows={3}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="newAnswer">Correct Answer</label>
              <input
                type="text"
                id="newAnswer"
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="Enter the correct answer"
                required
              />
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Creating...' : 'Post Question'}
            </button>
          </form>
        )}
      </div>

      {/* Past Questions Section */}
      <div className="card">
        <h2>Past Questions</h2>
        
        {pastQuestions.length > 0 ? (
          <div>
            {pastQuestions.map((question) => (
              <div key={question._id} className="history-item">
                <h4>{question.text}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {formatDate(question.revealedAt)} - {question.submissionStats.correct}/{question.submissionStats.total} correct
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="info-message">
            No past questions yet
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin
