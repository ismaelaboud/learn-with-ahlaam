import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { FaClock, FaUser, FaArrowLeft, FaShare, FaWhatsapp, FaCopy, FaLink } from 'react-icons/fa'

const ArticleDetail = () => {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  const categoryColors = {
    'Islamic History': '#7b61ff',
    'Fiqh': '#3b82f6',
    'General Knowledge': '#00d4aa',
    'Hadith': '#10b981',
    'Quran': '#f59e0b',
    'Other': '#6b7280'
  }

  useEffect(() => {
    fetchArticle()
  }, [slug])

  const fetchArticle = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/articles/${slug}`)
      const data = await response.json()
      
      if (data.success) {
        setArticle(data.data)
      }
    } catch (error) {
      console.error('Error fetching article:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const shareOnWhatsApp = () => {
    const ogUrl = `https://learn-with-ahlaam.onrender.com/og/articles/${article.slug}`
    const text = `Check out this article on Learn with Ahlaam 🧠\n\n${article.title}\n\n${ogUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const copyLink = async () => {
    const ogUrl = `https://learn-with-ahlaam.onrender.com/og/articles/${article.slug}`
    try {
      await navigator.clipboard.writeText(ogUrl)
      // You could add a toast notification here
      alert('Link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid rgba(0, 212, 170, 0.2)',
            borderTop: '3px solid #00d4aa',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          Loading article...
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="container">
        <div className="loading">
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: 'rgba(224, 247, 244, 0.4)',
            marginBottom: '1rem'
          }}>
            Article not found
          </h2>
          <Link
            to="/articles"
            style={{
              color: '#00d4aa',
              textDecoration: 'none'
            }}
          >
            ← Back to Articles
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      maxWidth: '720px',
      margin: '0 auto',
      padding: '0 1.5rem',
      width: '100%'
    }}>
      {/* Navigation */}
      <nav className="nav-links">
        <Link to="/">Today's Question</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        <Link to="/articles" className="active">Articles</Link>
        <Link to="/history">History</Link>
      </nav>

      {/* Back Link */}
      <Link
        to="/articles"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#00d4aa',
          textDecoration: 'none',
          marginBottom: '1.5rem',
          transition: 'color 0.3s ease'
        }}
        onMouseOver={(e) => e.target.style.color = '#00b894'}
        onMouseOut={(e) => e.target.style.color = '#00d4aa'}
      >
        <FaArrowLeft />
        Back to Articles
      </Link>

      {/* Cover Image */}
      {article.coverImage && (
        <div style={{
          width: '100%',
          height: '256px',
          marginBottom: '2rem',
          borderRadius: '0.5rem',
          overflow: 'hidden'
        }}>
          <img
            src={article.coverImage}
            alt={article.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
      )}

      {/* Article Header */}
      <div style={{ marginBottom: '2rem' }}>
        {/* Category and Read Time */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          {article.category && (
            <span
              style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                borderRadius: '9999px',
                backgroundColor: `${categoryColors[article.category]}20`,
                color: categoryColors[article.category],
                border: `1px solid ${categoryColors[article.category]}40`
              }}
            >
              {article.category}
            </span>
          )}
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: 'rgba(224, 247, 244, 0.4)',
            fontSize: '0.875rem'
          }}>
            <FaClock style={{ color: '#00d4aa' }} />
            {article.readTime} min read
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#e0f7f4',
          marginBottom: '1rem',
          lineHeight: '1.3'
        }}>
          {article.title}
        </h1>

        {/* Author and Date */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'rgba(224, 247, 244, 0.4)'
          }}>
            <FaUser style={{ color: '#00d4aa' }} />
            <span>{article.author}</span>
            <span style={{ color: 'rgba(224, 247, 244, 0.2)' }}>•</span>
            <span>{formatDate(article.publishedAt)}</span>
          </div>
          
          {/* Share Buttons */}
          <div style={{
            display: 'flex',
            gap: '0.5rem'
          }}>
            <button
              onClick={shareOnWhatsApp}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#25D366',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#128C7E'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#25D366'}
            >
              <FaWhatsapp />
              Share
            </button>
            <button
              onClick={copyLink}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#00d4aa',
                color: '#0a0f0a',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#00b894'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#00d4aa'}
            >
              <FaCopy />
              Copy Link
            </button>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div style={{
        background: 'rgba(10, 31, 46, 0.8)',
        borderRadius: '0.5rem',
        padding: '1.5rem 2rem',
        border: '1px solid rgba(0, 212, 170, 0.15)'
      }}>
        <ReactMarkdown
          components={{
            h1: ({children}) => <h1 style={{
              fontSize: '1.875rem',
              fontWeight: '700',
              color: '#00d4aa',
              marginBottom: '1.5rem',
              marginTop: '2rem'
            }}>{children}</h1>,
            h2: ({children}) => <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#00d4aa',
              marginBottom: '1rem',
              marginTop: '2rem'
            }}>{children}</h2>,
            h3: ({children}) => <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#00d4aa',
              marginBottom: '0.75rem',
              marginTop: '1.5rem'
            }}>{children}</h3>,
            p: ({children}) => <p style={{
              color: '#e0f7f4',
              marginBottom: '1rem',
              lineHeight: '1.8',
              fontSize: '1.05rem',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}>{children}</p>,
            strong: ({children}) => <strong style={{
              color: '#ffffff',
              fontWeight: '600'
            }}>{children}</strong>,
            a: ({children, href}) => (
              <a 
                href={href} 
                style={{
                  color: '#00d4aa',
                  textDecoration: 'underline',
                  transition: 'color 0.3s ease'
                }}
                target="_blank"
                rel="noopener noreferrer"
                onMouseOver={(e) => e.target.style.color = '#00b894'}
                onMouseOut={(e) => e.target.style.color = '#00d4aa'}
              >
                {children}
              </a>
            ),
            blockquote: ({children}) => (
              <blockquote style={{
                borderLeft: '4px solid #00d4aa',
                paddingLeft: '1rem',
                fontStyle: 'italic',
                color: 'rgba(224, 247, 244, 0.4)',
                backgroundColor: 'rgba(10, 31, 46, 0.5)',
                padding: '0.5rem 1rem',
                margin: '1rem 0'
              }}>
                {children}
              </blockquote>
            ),
            ul: ({children}) => <ul style={{
              listStyle: 'disc',
              listStylePosition: 'inside',
              color: '#e0f7f4',
              marginBottom: '1rem'
            }}>{children}</ul>,
            ol: ({children}) => <ol style={{
              listStyle: 'decimal',
              listStylePosition: 'inside',
              color: '#e0f7f4',
              marginBottom: '1rem'
            }}>{children}</ol>,
            code: ({children}) => <code style={{
              backgroundColor: 'rgba(10, 31, 46, 0.9)',
              color: '#00d4aa',
              padding: '0.125rem 0.5rem',
              borderRadius: '0.25rem',
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }}>{children}</code>,
            pre: ({children}) => <pre style={{
              backgroundColor: 'rgba(10, 31, 46, 0.9)',
              padding: '1rem',
              borderRadius: '0.5rem',
              overflowX: 'auto',
              marginBottom: '1rem'
            }}>{children}</pre>
          }}
        >
          {article.content}
        </ReactMarkdown>
      </div>

      {/* Linked Question Card */}
      {article.questionId && (
        <div style={{
          marginTop: '2rem',
          background: 'rgba(10, 31, 46, 0.8)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid rgba(0, 212, 170, 0.15)'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#e0f7f4',
            marginBottom: '0.75rem'
          }}>
            This article is linked to the question:
          </h3>
          <p style={{
            color: '#e0f7f4',
            fontStyle: 'italic',
            marginBottom: '1rem'
          }}>
            "{article.questionId.text}"
          </p>
          <Link
            to="/history"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#00d4aa',
              color: '#0a0f0a',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: '500',
              transition: 'background-color 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#00b894'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#00d4aa'}
          >
            View Results
            <FaArrowLeft style={{ transform: 'rotate(180deg)' }} />
          </Link>
        </div>
      )}
    </div>
  )
}

export default ArticleDetail
