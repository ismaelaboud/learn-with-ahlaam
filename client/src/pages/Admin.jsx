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
  const [newRevealAt, setNewRevealAt] = useState('')
  const [newScheduledFor, setNewScheduledFor] = useState('')
  const [creating, setCreating] = useState(false)
  
  const [closing, setClosing] = useState(false)
  const [message, setMessage] = useState('')
  
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [editAnswer, setEditAnswer] = useState('')
  const [updating, setUpdating] = useState(false)
  
  const [countdown, setCountdown] = useState('')
  const [showTimerModal, setShowTimerModal] = useState(false)
  const [timerRevealAt, setTimerRevealAt] = useState('')
  const [updatingTimer, setUpdatingTimer] = useState(false)
  const [messages, setMessages] = useState({})
  const [adminPassword, setAdminPassword] = useState('')
  const [scheduledQuestions, setScheduledQuestions] = useState([])
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [rescheduleQuestion, setRescheduleQuestion] = useState(null)
  const [rescheduleDateTime, setRescheduleDateTime] = useState('')
  const [rescheduling, setRescheduling] = useState(false)

  useEffect(() => {
    // Check if admin is authenticated from localStorage
    const savedAuth = localStorage.getItem('adminAuth')
    const savedPassword = localStorage.getItem('adminPassword')
    if (savedAuth === 'true' && savedPassword) {
      setIsAuthenticated(true)
      setAdminPassword(savedPassword)
      fetchAdminData()
    }
  }, [])

  // Countdown timer effect
  useEffect(() => {
    if (!activeQuestion || !activeQuestion.revealAt) {
      setCountdown('')
      return
    }

    const updateCountdown = () => {
      // Get current time in GMT+3
      const now = new Date()
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
      const gmt3Time = new Date(utc + (3600000 * 3))
      
      // Get reveal time in GMT+3
      const revealTime = new Date(activeQuestion.revealAt)
      const revealUtc = revealTime.getTime() + (revealTime.getTimezoneOffset() * 60000)
      const gmt3RevealTime = new Date(revealUtc + (3600000 * 3))
      
      const gmt3Now = new Date(gmt3Time.getTime())
      const distance = gmt3RevealTime.getTime() - gmt3Now.getTime()

      if (distance < 0) {
        setCountdown('Question closed!')
        // Auto-refresh when countdown hits zero
        setTimeout(() => {
          fetchAdminData()
        }, 1000)
        return
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      let countdownText = ''
      if (days > 0) countdownText += `${days}d `
      if (hours > 0 || days > 0) countdownText += `${hours}h `
      if (minutes > 0 || hours > 0 || days > 0) countdownText += `${minutes}m `
      countdownText += `${seconds}s`

      setCountdown(`Closes in: ${countdownText}`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [activeQuestion])

  const fetchMessages = async () => {
    const messageData = {}
    
    for (const question of pastQuestions) {
      try {
        const response = await fetch(`/api/messages/${question._id}`)
        const data = await response.json()
        if (data.success) {
          messageData[question._id] = data.data
        }
      } catch (error) {
        console.error(`Error fetching messages for question ${question._id}:`, error)
        messageData[question._id] = []
      }
    }
    
    setMessages(messageData)
  }

  const fetchScheduledQuestions = async () => {
    try {
      const response = await fetch('/api/admin/questions/scheduled', {
        headers: {
          'x-admin-password': localStorage.getItem('adminPassword')
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setScheduledQuestions(data.data)
      }
    } catch (error) {
      console.error('Error fetching scheduled questions:', error)
    }
  }

  const fetchAdminData = async () => {
    try {
      // Fetch active question
      const activeResponse = await fetch('/api/question/active')
      const activeData = await activeResponse.json()
      
      if (activeData.success && activeData.data) {
        if (activeData.data.revealAt) {
          activeData.data.revealAt = new Date(activeData.data.revealAt)
        }
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

      // Fetch scheduled questions
      await fetchScheduledQuestions()
    } catch (error) {
      console.error('Error fetching admin data:', error)
    }
  }

  // Fetch messages when past questions are loaded
  useEffect(() => {
    if (pastQuestions.length > 0) {
      fetchMessages()
    }
  }, [pastQuestions])

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
        setAdminPassword(password)
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
      const requestBody = {
        text: newQuestion.trim(),
        correctAnswer: newAnswer.trim()
      }
      
      // Add revealAt if provided
      if (newRevealAt.trim()) {
        requestBody.revealAt = newRevealAt.trim()
      }

      // Add scheduledFor if provided
      if (newScheduledFor.trim()) {
        requestBody.scheduledFor = newScheduledFor.trim()
      }

      const response = await fetch('/api/admin/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': localStorage.getItem('adminPassword')
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (data.success) {
        if (data.data.revealAt) {
          data.data.revealAt = new Date(data.data.revealAt)
        }
        if (data.data.scheduledFor) {
          data.data.scheduledFor = new Date(data.data.scheduledFor)
        }
        
        if (data.data.status === 'active') {
          setMessage('Question created successfully!')
          setActiveQuestion(data.data)
          setSubmissions([])
        } else {
          setMessage('Question scheduled successfully!')
        }
        
        setNewQuestion('')
        setNewAnswer('')
        setNewRevealAt('')
        setNewScheduledFor('')
        
        // Refresh scheduled questions list
        await fetchScheduledQuestions()
        
        // If question is active, refresh admin data
        if (data.data.status === 'active') {
          await fetchAdminData()
        }
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
    setEditing(false)
    setEditText('')
    setEditAnswer('')
  }

  const handleEditQuestion = () => {
    if (!activeQuestion) return
    
    setEditing(true)
    setEditText(activeQuestion.text)
    // Take first correct answer for editing (since backend uses array)
    setEditAnswer(activeQuestion.correctAnswers[0] || '')
  }

  const handleUpdateQuestion = async (e) => {
    e.preventDefault()
    
    if (!activeQuestion || !editText.trim() || !editAnswer.trim()) {
      setMessage('Please fill in both fields')
      return
    }

    setUpdating(true)
    setMessage('')

    try {
      const response = await fetch(`/api/admin/question/${activeQuestion._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': localStorage.getItem('adminPassword')
        },
        body: JSON.stringify({
          text: editText.trim(),
          correctAnswer: editAnswer.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage('Question updated successfully!')
        setActiveQuestion(data.data)
        setEditing(false)
        setEditText('')
        setEditAnswer('')
      } else {
        setMessage(data.message || 'Error updating question')
      }
    } catch (error) {
      console.error('Error updating question:', error)
      setMessage('Error updating question')
    } finally {
      setUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setEditText('')
    setEditAnswer('')
  }

  const handleSetTimer = () => {
    if (!activeQuestion) return
    
    // Set current revealAt if exists, otherwise empty
    const currentRevealAt = activeQuestion.revealAt 
      ? new Date(activeQuestion.revealAt).toISOString().slice(0, 16)
      : ''
    
    setTimerRevealAt(currentRevealAt)
    setShowTimerModal(true)
  }

  const handleUpdateTimer = async (e) => {
    e.preventDefault()
    
    if (!activeQuestion || !timerRevealAt.trim()) {
      setMessage('Please select a future date and time')
      return
    }

    setUpdatingTimer(true)
    setMessage('')

    try {
      const response = await fetch(`/api/admin/question/${activeQuestion._id}/timer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': localStorage.getItem('adminPassword')
        },
        body: JSON.stringify({
          revealAt: timerRevealAt.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        if (data.data.revealAt) {
          data.data.revealAt = new Date(data.data.revealAt)
        }
        setMessage('Timer updated successfully!')
        setActiveQuestion(data.data)
        setShowTimerModal(false)
        setTimerRevealAt('')
      } else {
        setMessage(data.message || 'Error updating timer')
      }
    } catch (error) {
      console.error('Error updating timer:', error)
      setMessage('Error updating timer')
    } finally {
      setUpdatingTimer(false)
    }
  }

  const handleDeleteScheduledQuestion = async (questionId) => {
    if (!confirm('Are you sure you want to delete this scheduled question?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/question/${questionId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-password': localStorage.getItem('adminPassword')
        }
      })

      const data = await response.json()

      if (data.success) {
        setMessage('Scheduled question deleted successfully!')
        await fetchScheduledQuestions()
      } else {
        setMessage(data.message || 'Error deleting scheduled question')
      }
    } catch (error) {
      console.error('Error deleting scheduled question:', error)
      setMessage('Error deleting scheduled question')
    }
  }

  const handleRescheduleModal = (question) => {
    setRescheduleQuestion(question)
    const currentScheduledFor = question.scheduledFor 
      ? new Date(question.scheduledFor).toISOString().slice(0, 16)
      : ''
    setRescheduleDateTime(currentScheduledFor)
    setShowRescheduleModal(true)
  }

  const handleRescheduleQuestion = async (e) => {
    e.preventDefault()
    
    if (!rescheduleQuestion) return

    setRescheduling(true)
    setMessage('')

    try {
      const requestBody = {}
      
      if (rescheduleDateTime.trim()) {
        requestBody.scheduledFor = rescheduleDateTime.trim()
      } else {
        requestBody.scheduledFor = null
      }

      const response = await fetch(`/api/admin/question/${rescheduleQuestion._id}/reschedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': localStorage.getItem('adminPassword')
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (data.success) {
        if (data.data.scheduledFor) {
          data.data.scheduledFor = new Date(data.data.scheduledFor)
        }
        setMessage('Question rescheduled successfully!')
        setShowRescheduleModal(false)
        setRescheduleQuestion(null)
        setRescheduleDateTime('')
        await fetchScheduledQuestions()
      } else {
        setMessage(data.message || 'Error rescheduling question')
      }
    } catch (error) {
      console.error('Error rescheduling question:', error)
      setMessage('Error rescheduling question')
    } finally {
      setRescheduling(false)
    }
  }

  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await fetch(`/api/admin/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-password': adminPassword
        }
      })

      if (response.ok) {
        // Remove message from local state
        setMessages(prev => {
          const newMessages = { ...prev }
          for (const questionId in newMessages) {
            newMessages[questionId] = newMessages[questionId].filter(msg => msg._id !== messageId)
          }
          return newMessages
        })
      } else {
        console.error('Failed to delete message')
      }
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCountdown = (scheduledFor) => {
    if (!scheduledFor) return null
    
    const now = new Date()
    const scheduled = new Date(scheduledFor)
    const distance = scheduled.getTime() - now.getTime()

    if (distance < 0) return 'Overdue'

    const days = Math.floor(distance / (1000 * 60 * 60 * 24))
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((distance % (1000 * 60)) / 1000)

    let countdownText = ''
    if (days > 0) countdownText += `${days}d `
    if (hours > 0 || days > 0) countdownText += `${hours}h `
    if (minutes > 0 || hours > 0 || days > 0) countdownText += `${minutes}m `
    countdownText += `${seconds}s`

    return countdownText
  }

  const handleCancelTimer = () => {
    setShowTimerModal(false)
    setTimerRevealAt('')
  }

  const handleCancelReschedule = () => {
    setShowRescheduleModal(false)
    setRescheduleQuestion(null)
    setRescheduleDateTime('')
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
            {editing ? (
              <div className="card" style={{ marginBottom: '1rem' }}>
                <h3>Edit Question</h3>
                <form onSubmit={handleUpdateQuestion}>
                  <div className="form-group">
                    <label htmlFor="editText">Question Text</label>
                    <textarea
                      id="editText"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      placeholder="Enter the question text"
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="editAnswer">Correct Answer</label>
                    <input
                      type="text"
                      id="editAnswer"
                      value={editAnswer}
                      onChange={(e) => setEditAnswer(e.target.value)}
                      placeholder="Enter the correct answer"
                      required
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={updating}>
                      {updating ? 'Updating...' : 'Save'}
                    </button>
                    <button type="button" onClick={handleCancelEdit} className="btn btn-secondary" disabled={updating}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div className="question-text" style={{ flex: 1 }}>{activeQuestion.text}</div>
                  <button 
                    onClick={handleEditQuestion} 
                    className="btn btn-secondary" 
                    style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}
                    disabled={editing}
                  >
                    ✏️ Edit
                  </button>
                </div>
                
                {/* Next up preview */}
                {scheduledQuestions.length > 0 && (
                  <div style={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #16213e',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ color: '#7b61ff', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      Next up:
                    </div>
                    <div style={{ color: 'white', fontSize: '0.9rem' }}>
                      {scheduledQuestions[0].text.length > 80 ? scheduledQuestions[0].text.substring(0, 80) + '...' : scheduledQuestions[0].text}
                    </div>
                  </div>
                )}
                
                {countdown && !countdown.includes('closed') && (() => {
                  // Get current time in GMT+3
                  const now = new Date()
                  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
                  const gmt3Time = new Date(utc + (3600000 * 3))
                  
                  // Get reveal time in GMT+3
                  const revealTime = new Date(activeQuestion.revealAt)
                  const revealUtc = revealTime.getTime() + (revealTime.getTimezoneOffset() * 60000)
                  const gmt3RevealTime = new Date(revealUtc + (3600000 * 3))
                  
                  const distance = gmt3RevealTime.getTime() - gmt3Time.getTime()
                  
                  return (
                    <div className="countdown-wrapper">
                      <p className="countdown-label">CLOSES IN</p>
                      <div className="countdown-boxes">
                        <div className="countdown-box">
                          <span className="countdown-number">{Math.floor(distance / (1000 * 60 * 60)) % 24}</span>
                          <span className="countdown-unit">h</span>
                        </div>
                        <span className="countdown-separator">:</span>
                        <div className="countdown-box">
                          <span className="countdown-number">{Math.floor(distance / (1000 * 60)) % 60}</span>
                          <span className="countdown-unit">m</span>
                        </div>
                        <span className="countdown-separator">:</span>
                        <div className="countdown-box">
                          <span className="countdown-number">{Math.floor(distance / 1000) % 60}</span>
                          <span className="countdown-unit">s</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}
                
                {countdown && countdown.includes('closed') && (
                  <div style={{ 
                    marginBottom: '1rem', 
                    padding: '1rem', 
                    backgroundColor: 'var(--accent)', 
                    color: 'white', 
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '1.2rem'
                  }}>
                    Question closed!
                  </div>
                )}
                
                <div style={{ marginBottom: '1rem' }}>
                  <button 
                    onClick={handleSetTimer} 
                    className="btn btn-secondary" 
                    disabled={editing}
                    style={{ marginRight: '1rem' }}
                  >
                    ⏰ Set / Update Timer
                  </button>
                </div>
              </div>
            )}
            
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
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button 
                onClick={handleCloseQuestion} 
                className="btn btn-danger" 
                disabled={closing || editing}
              >
                {closing ? 'Closing...' : 'Close & Reveal Answer'}
              </button>
            </div>
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
        
        {activeQuestion && !newScheduledFor && (
          <div className="info-message">
            This question will go live automatically after the current question closes
          </div>
        )}
        
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
          
          <div className="form-group">
            <label htmlFor="newRevealAt">Auto-close at (optional)</label>
            <input
              type="datetime-local"
              id="newRevealAt"
              value={newRevealAt}
              onChange={(e) => setNewRevealAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
            <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
              Set a future date and time for the question to auto-close
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="newScheduledFor">Schedule For (optional)</label>
            <input
              type="datetime-local"
              id="newScheduledFor"
              value={newScheduledFor}
              onChange={(e) => setNewScheduledFor(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
            <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
              Set a future date and time for the question to go live. If left empty:
              {activeQuestion ? ' will go live after current question closes' : ' will go live immediately'}
            </small>
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? 'Creating...' : 'Post Question'}
          </button>
        </form>
      </div>

      {/* Scheduled Questions Section */}
      <div className="card">
        <h2>Scheduled Questions</h2>
        
        {scheduledQuestions.length > 0 ? (
          <div>
            {scheduledQuestions.map((question) => (
              <div key={question._id} className="scheduled-question-item" style={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #16213e',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: '#00d4aa', margin: '0 0 0.5rem 0' }}>
                      {question.text.length > 60 ? question.text.substring(0, 60) + '...' : question.text}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {question.scheduledFor ? (
                        <span style={{
                          backgroundColor: '#00d4aa',
                          color: '#0a0a0a',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          {new Date(question.scheduledFor).toLocaleString()}
                        </span>
                      ) : (
                        <span style={{
                          backgroundColor: '#7b61ff',
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          Next in queue
                        </span>
                      )}
                    </div>
                    <div style={{ color: 'white', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      <strong>Answer:</strong> {question.correctAnswer}
                    </div>
                    {question.scheduledFor && (
                      <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                        <strong>Countdown:</strong> {getCountdown(question.scheduledFor)}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleRescheduleModal(question)}
                      style={{
                        padding: '0.5rem 1rem',
                        border: 'none',
                        borderRadius: '0.25rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Edit Schedule
                    </button>
                    <button
                      onClick={() => handleDeleteScheduledQuestion(question._id)}
                      style={{
                        padding: '0.5rem 1rem',
                        border: 'none',
                        borderRadius: '0.25rem',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="info-message">
            No questions scheduled. Add one above!
          </div>
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
                
                {/* Messages Section */}
                {messages[question._id] && messages[question._id].length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <h5 style={{ color: '#00d4aa', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      💬 Discussion Messages ({messages[question._id].length})
                    </h5>
                    <div style={{ 
                      maxHeight: '200px', 
                      overflowY: 'auto',
                      backgroundColor: '#0f1f1a',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      border: '1px solid #2a4d3a'
                    }}>
                      {messages[question._id].map((message) => (
                        <div key={message._id} style={{
                          padding: '0.5rem',
                          marginBottom: '0.5rem',
                          backgroundColor: '#1a2f2a',
                          borderRadius: '0.25rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', color: '#00d4aa', fontSize: '0.8rem' }}>
                              {message.senderName}
                            </div>
                            <div style={{ color: 'white', fontSize: '0.8rem' }}>
                              {message.text}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                              {formatDate(message.createdAt)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteMessage(message._id)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              border: 'none',
                              borderRadius: '0.25rem',
                              backgroundColor: '#dc2626',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                              marginLeft: '0.5rem'
                            }}
                            title="Delete message"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {(!messages[question._id] || messages[question._id].length === 0) && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    color: '#6b7280', 
                    fontSize: '0.8rem',
                    fontStyle: 'italic' 
                  }}>
                    No discussion messages for this question
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="info-message">
            No past questions yet
          </div>
        )}
      </div>

      {/* Timer Modal */}
      {showTimerModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '400px', width: '90%' }}>
            <h3>Set Timer</h3>
            <form onSubmit={handleUpdateTimer}>
              <div className="form-group">
                <label htmlFor="timerRevealAt">Auto-close at</label>
                <input
                  type="datetime-local"
                  id="timerRevealAt"
                  value={timerRevealAt}
                  onChange={(e) => setTimerRevealAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
                <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                  Set a future date and time for the question to auto-close
                </small>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={updatingTimer}>
                  {updatingTimer ? 'Updating...' : 'Set Timer'}
                </button>
                <button type="button" onClick={handleCancelTimer} className="btn btn-secondary" disabled={updatingTimer}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '400px', width: '90%' }}>
            <h3>Reschedule Question</h3>
            <form onSubmit={handleRescheduleQuestion}>
              <div className="form-group">
                <label htmlFor="rescheduleDateTime">Schedule For (optional)</label>
                <input
                  type="datetime-local"
                  id="rescheduleDateTime"
                  value={rescheduleDateTime}
                  onChange={(e) => setRescheduleDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                  Set a future date and time for the question to go live. 
                  If left empty, the question will go live after the current question closes.
                </small>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={rescheduling}>
                  {rescheduling ? 'Rescheduling...' : 'Reschedule'}
                </button>
                <button type="button" onClick={handleCancelReschedule} className="btn btn-secondary" disabled={rescheduling}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin
