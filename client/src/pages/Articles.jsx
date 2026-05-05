import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaBook, FaClock, FaUser, FaArrowLeft } from 'react-icons/fa'

const Articles = () => {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [categories, setCategories] = useState(['All', 'Islamic History', 'Fiqh', 'General Knowledge', 'Hadith', 'Quran', 'Other'])
  const [isMobile, setIsMobile] = useState(false)

  const categoryColors = {
    'Islamic History': '#7b61ff',
    'Fiqh': '#3b82f6',
    'General Knowledge': '#00d4aa',
    'Hadith': '#10b981',
    'Quran': '#f59e0b',
    'Other': '#6b7280'
  }

  useEffect(() => {
    fetchArticles()
    
    // Check screen size and add resize listener
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  useEffect(() => {
    fetchArticles()
  }, [selectedCategory])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory !== 'All') {
        params.append('category', selectedCategory)
      }
      
      const response = await fetch(`/api/articles?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setArticles(data.data)
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text
    return text.substr(0, maxLength) + '...'
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
          Loading articles...
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>Knowledge Hub</h1>
      <p style={{
        textAlign: 'center',
        color: 'rgba(224, 247, 244, 0.6)',
        fontSize: '1.125rem',
        marginBottom: '2rem'
      }}>
        Explore Islamic knowledge and insights
      </p>
      
      <nav className="nav-links">
        <Link to="/">Today's Question</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        <Link to="/articles" className="active">Articles</Link>
        <Link to="/history">History</Link>
      </nav>

      <div className="card">

        {/* Category Filter */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: '2rem',
          padding: '0 1rem'
        }}>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                backgroundColor: selectedCategory === category ? '#00d4aa' : 'rgba(10, 31, 46, 0.8)',
                color: selectedCategory === category ? '#0a0f0a' : 'rgba(224, 247, 244, 0.6)',
                border: selectedCategory === category ? '1px solid #00d4aa' : '1px solid rgba(0, 212, 170, 0.15)'
              }}
              onMouseOver={(e) => {
                if (selectedCategory !== category) {
                  e.target.style.backgroundColor = 'rgba(0, 212, 170, 0.1)'
                  e.target.style.color = '#00d4aa'
                }
              }}
              onMouseOut={(e) => {
                if (selectedCategory !== category) {
                  e.target.style.backgroundColor = 'rgba(10, 31, 46, 0.8)'
                  e.target.style.color = 'rgba(224, 247, 244, 0.6)'
                }
              }}
            >
              {category}
            </button>
          ))}
        </div>
        {/* Articles Grid */}
        {articles.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem'
          }}>
            <FaBook style={{
              fontSize: '3rem',
              color: 'rgba(224, 247, 244, 0.3)',
              marginBottom: '1rem'
            }} />
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'rgba(224, 247, 244, 0.4)',
              marginBottom: '0.5rem'
            }}>
              No articles yet
            </h3>
            <p style={{
              color: 'rgba(224, 247, 244, 0.3)'
            }}>
              Check back soon for new content!
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
            padding: '0 1rem',
            width: '100%'
          }}>
            {articles.map((article) => (
              <div
                key={article._id}
                style={{
                  background: 'rgba(10, 31, 46, 0.8)',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  border: '1px solid rgba(0, 212, 170, 0.15)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#00d4aa'
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 212, 170, 0.2)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 212, 170, 0.15)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {/* Cover Image */}
                <div style={{
                  height: '192px',
                  background: 'linear-gradient(135deg, rgba(10, 31, 46, 0.8), rgba(10, 31, 46, 0.9))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {article.coverImage ? (
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <FaBook style={{ fontSize: '2rem', color: 'rgba(224, 247, 244, 0.3)' }} />
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem' }}>
                  {/* Category Badge */}
                  {article.category && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          borderRadius: '9999px',
                          backgroundColor: `${categoryColors[article.category]}20`,
                          color: categoryColors[article.category],
                          border: `1px solid ${categoryColors[article.category]}40`
                        }}
                      >
                        {article.category}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#e0f7f4',
                    marginBottom: '0.5rem',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {article.title}
                  </h3>

                  {/* Excerpt */}
                  <p style={{
                    color: 'rgba(224, 247, 244, 0.6)',
                    marginBottom: '1rem',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {truncateText(article.content, 100)}
                  </p>

                  {/* Meta Info */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                    color: 'rgba(224, 247, 244, 0.3)',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <FaClock style={{ color: '#00d4aa' }} />
                        {article.readTime} min read
                      </span>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <FaUser style={{ color: '#00d4aa' }} />
                        {article.author}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <p style={{
                    color: 'rgba(224, 247, 244, 0.3)',
                    fontSize: '0.875rem',
                    marginBottom: '1rem'
                  }}>
                    {formatDate(article.publishedAt)}
                  </p>

                  {/* Read More Link */}
                  <Link
                    to={`/articles/${article.slug}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#00d4aa',
                      fontWeight: '500',
                      textDecoration: 'none',
                      transition: 'color 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.color = '#00b894'}
                    onMouseOut={(e) => e.target.style.color = '#00d4aa'}
                  >
                    Read More
                    <FaArrowLeft style={{ transform: 'rotate(180deg)' }} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Articles
