import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ChatRoom from '../components/ChatRoom'

const History = () => {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [questionDetails, setQuestionDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [openChatRoom, setOpenChatRoom] = useState(null)
  const [messageCounts, setMessageCounts] = useState({})

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchMessageCounts = async () => {
    const counts = {};
    
    for (const question of questions) {
      try {
        const response = await fetch(`/api/messages/${question._id}`);
        const data = await response.json();
        if (data.success) {
          counts[question._id] = data.data.length;
        }
      } catch (error) {
        console.error(`Error fetching message count for question ${question._id}:`, error);
        counts[question._id] = 0;
      }
    }
    
    setMessageCounts(counts);
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/questions/history')
      const data = await response.json()
      
      if (data.success) {
        setQuestions(data.data.questions)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  };

  // Fetch message counts when questions are loaded
  useEffect(() => {
    if (questions.length > 0) {
      fetchMessageCounts();
    }
  }, [questions]);

  const fetchQuestionDetails = async (questionId) => {
    setLoadingDetails(true)
    try {
      const response = await fetch(`/api/question/${questionId}/result`)
      const data = await response.json()
      
      if (data.success) {
        setQuestionDetails(data.data)
      }
    } catch (error) {
      console.error('Error fetching question details:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleQuestionClick = (question) => {
    if (selectedQuestion?._id === question._id) {
      setSelectedQuestion(null)
      setQuestionDetails(null)
    } else {
      setSelectedQuestion(question)
      fetchQuestionDetails(question._id)
    }
  }

  const toggleChatRoom = (questionId) => {
    if (openChatRoom === questionId) {
      setOpenChatRoom(null)
    } else {
      setOpenChatRoom(questionId)
    }
  }

  const updateMessageCount = (questionId, count) => {
    setMessageCounts(prev => ({
      ...prev,
      [questionId]: count
    }))
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading history...</div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>Question History</h1>
      
      <nav className="nav-links">
        <Link to="/">Today's Question</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        <Link to="/history" className="active">History</Link>
      </nav>

      <div className="card">
        {questions.length > 0 ? (
          <div>
            {questions.map((question) => (
              <div key={question._id} className="history-item">
                <h3 onClick={() => handleQuestionClick(question)} style={{ cursor: 'pointer' }}>
                  {question.text}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {formatDate(question.revealedAt)}
                </p>
                
                <div className="stats">
                  <div className="stat">
                    <div className="stat-value">{question.submissionStats.total}</div>
                    <div className="stat-label">Total Answers</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value correct">{question.submissionStats.correct}</div>
                    <div className="stat-label">Correct</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value incorrect">{question.submissionStats.incorrect}</div>
                    <div className="stat-label">Incorrect</div>
                  </div>
                </div>

                {/* Discussion Button */}
                <div style={{ marginTop: '1rem' }}>
                  <button
                    onClick={() => toggleChatRoom(question._id)}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #00d4aa',
                      borderRadius: '0.25rem',
                      backgroundColor: openChatRoom === question._id ? '#00d4aa' : 'transparent',
                      color: openChatRoom === question._id ? '#0a0f0a' : '#00d4aa',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    💬 Discussion ({messageCounts[question._id] || 0})
                  </button>
                </div>

                {/* Chat Room */}
                {openChatRoom === question._id && (
                  <ChatRoom 
                    questionId={question._id} 
                    questionStatus={question.status}
                    onMessageCountChange={(count) => updateMessageCount(question._id, count)}
                  />
                )}

                {selectedQuestion?._id === question._id && (
                  <div style={{ marginTop: '1.5rem' }}>
                    {loadingDetails ? (
                      <div className="loading">Loading details...</div>
                    ) : questionDetails ? (
                      <div>
                        <div className="info-message" style={{ marginBottom: '1rem' }}>
                          <strong>Correct Answer:</strong> {questionDetails.question.correctAnswer}
                        </div>
                        
                        <h4>Submissions:</h4>
                        <div className="submission-list">
                          {questionDetails.correctSubmissions.map((submission) => (
                            <div key={submission._id} className="submission-item correct">
                              <span>{submission.participantName}</span>
                              <span>✓ {submission.answer}</span>
                            </div>
                          ))}
                          {questionDetails.incorrectSubmissions.map((submission) => (
                            <div key={submission._id} className="submission-item incorrect">
                              <span>{submission.participantName}</span>
                              <span>✗ {submission.answer}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="error-message">Error loading details</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="info-message">
            No closed questions yet. Check back after some questions have been answered!
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

export default History
