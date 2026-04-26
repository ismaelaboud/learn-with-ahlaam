import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaWhatsapp, FaFacebook, FaInstagram, FaTimes, FaChevronRight } from 'react-icons/fa'
import { FiLink, FiShare2 } from 'react-icons/fi'

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
  const [copiedLink, setCopiedLink] = useState(false)
  const [instagramToast, setInstagramToast] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const questionId = urlParams.get('question')
    
    if (questionId) {
      fetchQuestionById(questionId)
    } else {
      fetchActiveQuestion()
    }
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

  const fetchQuestionById = async (questionId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/question/${questionId}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        if (data.data.revealAt) {
          data.data.revealAt = new Date(data.data.revealAt) // Convert to Date object
        }
        setQuestion(data.data)
        console.log('Fetched question by ID:', data.data)
        
        // Check if user has already submitted
        const savedName = localStorage.getItem('participantName')
        if (savedName) {
          setParticipantName(savedName)
        }
      } else {
        // If question not found or error, fall back to active question
        fetchActiveQuestion()
      }
    } catch (error) {
      console.error('Error fetching question by ID:', error)
      // Fall back to active question
      fetchActiveQuestion()
    }
  }

  const fetchActiveQuestion = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/question/active`)
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/question/${question._id}/submit`, {
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

  const handleWhatsAppShare = () => {
    const shareUrl = `https://learn-with-ahlaam.vercel.app/?question=${question._id}`
    const questionText = question.text.replace(/"/g, '"')
    const whatsappUrl = `https://wa.me/?text=Can you answer today's trivia question? 🧠%0A%0A"${questionText}"%0A%0AAnswer here 👉 ${shareUrl}`
    window.open(whatsappUrl, '_blank')
  }

  const handleFacebookShare = () => {
    const shareUrl = `https://learn-with-ahlaam.vercel.app/?question=${question._id}`
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    window.open(facebookUrl, '_blank')
  }

  const handleInstagramShare = async () => {
    const shareUrl = `https://learn-with-ahlaam.vercel.app/?question=${question._id}`
    const questionText = question.text
    
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Learn with Ahlaam',
          text: `Can you answer today's trivia question? 🧠\n\n"${questionText}"\n\nAnswer here 👉 ${shareUrl}`,
          url: shareUrl
        })
        setShareModalOpen(false)
      } catch (error) {
        console.error('Instagram share failed:', error)
        // Fallback to copy link
        await handleCopyLink()
        setInstagramToast(true)
        setTimeout(() => setInstagramToast(false), 3000)
        setShareModalOpen(false)
      }
    } else {
      // Fallback for browsers without navigator.share
      await handleCopyLink()
      setInstagramToast(true)
      setTimeout(() => setInstagramToast(false), 3000)
      setShareModalOpen(false)
    }
  }

  const handleCopyLink = async () => {
    const shareUrl = `https://learn-with-ahlaam.vercel.app/?question=${question._id}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedLink(true)
      setTimeout(() => {
        setCopiedLink(false)
        setShareModalOpen(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
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
      <div className="header">
        <Link to="/" className="logo-link">
          <img src="/logo.png" alt="Learn with Ahlaam" className="logo" />
        </Link>
        <h1>Learn with Ahlaam</h1>
      </div>
      
      <nav className="nav-links">
        <Link to="/" className="active">Today's Question</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        <Link to="/history">History</Link>
      </nav>

      {question ? (
        <div className="card">
          <div className="question-text">{question.text}</div>
          
          {/* Share Section */}
          <div className="share-section">
            <button 
              onClick={() => setShareModalOpen(true)}
              className="share-trigger-btn"
            >
              <FiShare2 className="share-icon" />
              Share Question
            </button>
          </div>
          
          {/* Share Modal */}
          {shareModalOpen && (
            <>
              <div 
                className="share-backdrop" 
                onClick={() => setShareModalOpen(false)}
              />
              <div className="share-modal">
                {/* Modal Header */}
                <div className="share-modal-header">
                  <h3>Share this question</h3>
                  <button 
                    className="share-modal-close"
                    onClick={() => setShareModalOpen(false)}
                  >
                    <FaTimes />
                  </button>
                </div>
                
                {/* Question Preview */}
                <div className="share-modal-preview">
                  {question.text.length > 50 
                    ? `${question.text.substring(0, 50)}...` 
                    : question.text
                  }
                </div>
                
                {/* Divider */}
                <div className="share-modal-divider" />
                
                {/* Share Options */}
                <div className="share-options">
                  <button 
                    onClick={handleWhatsAppShare}
                    className="share-option-row"
                  >
                    <div className="share-option-icon share-option-whatsapp">
                      <FaWhatsapp />
                    </div>
                    <div className="share-option-content">
                      <div className="share-option-title">Share on WhatsApp</div>
                      <div className="share-option-desc">Send to your contacts</div>
                    </div>
                    <FaChevronRight className="share-option-chevron" />
                  </button>
                  
                  <button 
                    onClick={handleFacebookShare}
                    className="share-option-row"
                  >
                    <div className="share-option-icon share-option-facebook">
                      <FaFacebook />
                    </div>
                    <div className="share-option-content">
                      <div className="share-option-title">Share on Facebook</div>
                      <div className="share-option-desc">Post to your timeline</div>
                    </div>
                    <FaChevronRight className="share-option-chevron" />
                  </button>
                  
                  <button 
                    onClick={handleInstagramShare}
                    className="share-option-row"
                  >
                    <div className="share-option-icon share-option-instagram">
                      <FaInstagram />
                    </div>
                    <div className="share-option-content">
                      <div className="share-option-title">Share on Instagram</div>
                      <div className="share-option-desc">Copy link for Instagram</div>
                    </div>
                    <FaChevronRight className="share-option-chevron" />
                  </button>
                  
                  <button 
                    onClick={handleCopyLink}
                    className={`share-option-row ${copiedLink ? 'share-option-copied' : ''}`}
                  >
                    <div className="share-option-icon share-option-copy">
                      <FiLink />
                    </div>
                    <div className="share-option-content">
                      <div className="share-option-title">
                        {copiedLink ? 'Copied! ✅' : 'Copy Link'}
                      </div>
                      <div className="share-option-desc">Copy to clipboard</div>
                    </div>
                    <FaChevronRight className="share-option-chevron" />
                  </button>
                </div>
              </div>
            </>
          )}
          
          {/* Instagram Toast */}
          {instagramToast && (
            <div className="instagram-toast">
              Link copied! Paste it on Instagram 📋
            </div>
          )}
          
          {countdown && !isExpired && (() => {
              // Get current time in GMT+3
              const now = new Date()
              const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
              const gmt3Time = new Date(utc + (3600000 * 3))
              
              // Get reveal time in GMT+3
              const revealTime = new Date(question.revealAt)
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
          
          {isExpired && (
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
              Submissions closed! 🎉
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
              {window.location.search.includes('question=') 
                ? "This question is now closed! Check the results 👇"
                : "Submissions closed! Check the leaderboard for results 🎉"
              }
              <div style={{ marginTop: '1rem' }}>
                <Link to="/leaderboard" className="btn btn-primary">
                  View Leaderboard
                </Link>
                {window.location.search.includes('question=') && (
                  <>
                    <span style={{ margin: '0 0.5rem' }}>or</span>
                    <Link to="/history" className="btn btn-secondary">
                      View History
                    </Link>
                  </>
                )}
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
