import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { FaBold, FaItalic, FaHeading, FaQuoteLeft, FaListUl, FaListOl, FaLink } from 'react-icons/fa'
import ReactMarkdown from 'react-markdown'

const ArticleEditor = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const textareaRef = useRef(null)
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  
  // Article form state
  const [articleTitle, setArticleTitle] = useState('')
  const [articleContent, setArticleContent] = useState('')
  const [articleCoverImage, setArticleCoverImage] = useState('')
  const [articleCategory, setArticleCategory] = useState('')
  const [articleQuestionId, setArticleQuestionId] = useState('')
  
  // UI state
  const [activeTab, setActiveTab] = useState('write')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [questions, setQuestions] = useState([])
  const [toast, setToast] = useState(null)
  
  const categories = ['Islamic History', 'Fiqh', 'General Knowledge', 'Hadith', 'Quran', 'Other']
  const isNewArticle = id === 'new'

  // Check authentication on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('adminAuth')
    const savedPassword = localStorage.getItem('adminPassword')
    
    if (savedAuth === 'true' && savedPassword) {
      setIsAuthenticated(true)
      setAuthChecked(true)
      if (!isNewArticle) {
        fetchArticle()
      }
      fetchQuestions()
    } else {
      setAuthChecked(true)
      navigate('/admin')
    }
  }, [id, navigate])

  // Auto-save effect
  useEffect(() => {
    if (!hasUnsavedChanges || !isAuthenticated) return

    const interval = setInterval(() => {
      if (hasUnsavedChanges) {
        handleSaveDraft(true) // true = auto-save
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [hasUnsavedChanges, articleTitle, articleContent, articleCoverImage, articleCategory, articleQuestionId])

  // Track unsaved changes
  useEffect(() => {
    if (isAuthenticated) {
      setHasUnsavedChanges(true)
    }
  }, [articleTitle, articleContent, articleCoverImage, articleCategory, articleQuestionId])

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/admin/questions/scheduled', {
        headers: {
          'x-admin-password': localStorage.getItem('adminPassword')
        }
      })
      const data = await response.json()
      if (data.success) {
        setQuestions(data.data)
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
    }
  }

  const fetchArticle = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/articles/${id}`, {
        headers: {
          'x-admin-password': localStorage.getItem('adminPassword')
        }
      })
      const data = await response.json()
      
      if (data.success) {
        const article = data.data
        setArticleTitle(article.title || '')
        setArticleContent(article.content || '')
        setArticleCoverImage(article.coverImage || '')
        setArticleCategory(article.category || '')
        setArticleQuestionId(article.questionId || '')
        setHasUnsavedChanges(false)
      }
    } catch (error) {
      console.error('Error fetching article:', error)
      showToast('Error loading article', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSaveDraft = async (isAutoSave = false) => {
    if (!articleTitle.trim() || !articleContent.trim()) {
      if (!isAutoSave) {
        showToast('Title and content are required', 'error')
      }
      return
    }

    setSaving(true)
    
    try {
      const articleData = {
        title: articleTitle.trim(),
        content: articleContent.trim(),
        status: 'draft'
      }

      if (articleCoverImage.trim()) articleData.coverImage = articleCoverImage.trim()
      if (articleCategory) articleData.category = articleCategory
      if (articleQuestionId) articleData.questionId = articleQuestionId

      let response
      if (isNewArticle) {
        response = await fetch('/api/admin/articles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': localStorage.getItem('adminPassword')
          },
          body: JSON.stringify(articleData)
        })
      } else {
        response = await fetch(`/api/admin/articles/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': localStorage.getItem('adminPassword')
          },
          body: JSON.stringify(articleData)
        })
      }

      const data = await response.json()
      
      if (data.success) {
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
        if (!isAutoSave) {
          showToast('Draft saved successfully!', 'success')
        }
        
        // If creating new article, update URL to edit mode
        if (isNewArticle) {
          navigate(`/admin/articles/edit/${data.data._id}`, { replace: true })
        }
      } else {
        if (!isAutoSave) {
          showToast(data.message || 'Error saving draft', 'error')
        }
      }
    } catch (error) {
      console.error('Error saving draft:', error)
      if (!isAutoSave) {
        showToast('Error saving draft', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!articleTitle.trim() || !articleContent.trim()) {
      showToast('Title and content are required', 'error')
      return
    }

    setSaving(true)
    
    try {
      const articleData = {
        title: articleTitle.trim(),
        content: articleContent.trim(),
        status: 'published'
      }

      if (articleCoverImage.trim()) articleData.coverImage = articleCoverImage.trim()
      if (articleCategory) articleData.category = articleCategory
      if (articleQuestionId) articleData.questionId = articleQuestionId

      let response
      if (isNewArticle) {
        response = await fetch('/api/admin/articles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': localStorage.getItem('adminPassword')
          },
          body: JSON.stringify(articleData)
        })
      } else {
        response = await fetch(`/api/admin/articles/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': localStorage.getItem('adminPassword')
          },
          body: JSON.stringify(articleData)
        })
      }

      const data = await response.json()
      
      if (data.success) {
        showToast('Article published successfully!', 'success')
        setTimeout(() => {
          navigate('/admin')
        }, 1500)
      } else {
        showToast(data.message || 'Error publishing article', 'error')
      }
    } catch (error) {
      console.error('Error publishing article:', error)
      showToast('Error publishing article', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Formatting toolbar functions
  const insertMarkdown = (before, after = '', placeholder = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = articleContent.substring(start, end)
    const text = selectedText || placeholder

    const newText = before + text + after
    const newContent = articleContent.substring(0, start) + newText + articleContent.substring(end)
    
    setArticleContent(newContent)
    
    setTimeout(() => {
      textarea.focus()
      if (after === '(url)' && !selectedText) {
        textarea.setSelectionRange(start + before.length + placeholder.length + 1, start + before.length + placeholder.length + 1)
      } else if (!selectedText) {
        textarea.setSelectionRange(start + before.length, start + before.length + text.length)
      } else {
        textarea.setSelectionRange(start + newText.length, start + newText.length)
      }
    }, 0)
  }

  const insertAtLineStart = (prefix) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    const lineStart = articleContent.lastIndexOf('\n', start) + 1
    const currentLine = articleContent.substring(lineStart, start)
    
    if (currentLine.trim().startsWith(prefix)) {
      const newContent = articleContent.substring(0, lineStart) + 
                        currentLine.replace(new RegExp('^\\s*' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*'), '') + 
                        articleContent.substring(lineStart + currentLine.length)
      setArticleContent(newContent)
      
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(lineStart, lineStart)
      }, 0)
    } else {
      const newText = prefix + ' '
      const newContent = articleContent.substring(0, lineStart) + newText + articleContent.substring(lineStart)
      setArticleContent(newContent)
      
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(lineStart + newText.length, lineStart + newText.length)
      }, 0)
    }
  }

  const handleBold = () => insertMarkdown('**', '**', 'bold text')
  const handleItalic = () => insertMarkdown('*', '*', 'italic text')
  const handleHeading1 = () => insertAtLineStart('#')
  const handleHeading2 = () => insertAtLineStart('##')
  const handleBlockquote = () => insertAtLineStart('>')
  const handleUnorderedList = () => insertAtLineStart('-')
  const handleOrderedList = () => insertAtLineStart('1.')
  const handleLink = () => insertMarkdown('[', '](url)', 'link text')

  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  const getReadTime = (text) => {
    const wordCount = getWordCount(text)
    return Math.ceil(wordCount / 200)
  }

  if (!authChecked) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#040d14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#e0f7f4'
      }}>
        Checking authentication...
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect automatically
  }

  if (loading && !isNewArticle) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#040d14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#e0f7f4'
      }}>
        Loading article...
      </div>
    )
  }

  return (
    <>
      {/* Add CSS for mobile responsiveness */}
      <style jsx>{`
        @media (max-width: 768px) {
          .article-editor-main-content {
            flex-direction: column !important;
            padding: 1rem !important;
            gap: 1rem !important;
          }
          .article-editor-settings-panel {
            flex: 1 1 100% !important;
            padding: 1rem !important;
          }
          .article-editor-editor-panel {
            flex: 1 1 100% !important;
            padding: 1rem !important;
          }
          .article-editor-cover-preview {
            height: 150px !important;
          }
          .article-editor-textarea {
            min-height: 300px !important;
          }
          .article-editor-formatting-toolbar {
            flex-wrap: wrap !important;
            gap: 4px !important;
          }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#040d14' }}>
      {/* Top Bar */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '0.875rem 2rem',
        backgroundColor: '#0a1f2e',
        borderBottom: '1px solid rgba(0, 212, 170, 0.15)',
        backdropFilter: 'blur(10px)',
        '@media (max-width: 768px)': {
          display: 'flex',
          flexDirection: 'column',
          padding: '0.75rem 1rem',
          gap: '0.5rem'
        }
      }}>
        {/* Left column: Back to Admin */}
        <div style={{ 
          justifySelf: 'start',
          '@media (max-width: 768px)': {
            display: 'none'
          }
        }}>
          <Link 
            to="/admin"
            style={{
              color: '#00d4aa',
              textDecoration: 'none',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ← Back
          </Link>
        </div>

        {/* Center column: Title and status */}
        <div style={{ 
          justifySelf: 'center', 
          textAlign: 'center',
          '@media (max-width: 768px)': {
            display: 'none'
          }
        }}>
          <div style={{
            color: '#e0f7f4',
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '0.25rem'
          }}>
            {isNewArticle ? 'New Article' : `Editing: ${articleTitle || 'Untitled'}`}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(224, 247, 244, 0.5)'
          }}>
            {lastSaved ? `Last saved at ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 
             (hasUnsavedChanges ? 'Unsaved changes' : '')}
          </div>
        </div>

        {/* Right column: Buttons */}
        <div style={{ 
          justifySelf: 'end',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          '@media (max-width: 768px)': {
            display: 'none'
          }
        }}>
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            style={{
              background: 'transparent',
              border: '1px solid rgba(0,212,170,0.4)',
              color: '#00d4aa',
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={handlePublish}
            disabled={saving}
            style={{
              background: 'linear-gradient(135deg, #00d4aa, #7b61ff)',
              color: 'white',
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
          >
            {saving ? 'Publishing...' : 'Publish'}
          </button>
        </div>

        {/* Mobile Layout - Row 1 */}
        <div style={{
          display: 'none',
          '@media (max-width: 768px)': {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            gap: '0.5rem'
          }
        }}>
          {/* Mobile Back Link */}
          <Link 
            to="/admin"
            style={{
              whiteSpace: 'nowrap',
              fontSize: '0.85rem',
              color: '#00d4aa',
              textDecoration: 'none',
              flexShrink: 0
            }}
          >
            ← Back
          </Link>

          {/* Mobile Title */}
          <div style={{
            flex: 1,
            textAlign: 'center',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#e0f7f4',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            padding: '0 0.5rem'
          }}>
            {isNewArticle ? 'New Article' : `Editing: ${articleTitle || 'Untitled'}`}
          </div>

          {/* Mobile Buttons */}
          <div style={{
            display: 'flex',
            gap: '0.4rem',
            flexShrink: 0
          }}>
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              style={{
                background: 'transparent',
                border: '1px solid rgba(0,212,170,0.4)',
                color: '#00d4aa',
                padding: '0.35rem 0.6rem',
                borderRadius: '8px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '0.75rem',
                fontWeight: '500',
                whiteSpace: 'nowrap'
              }}
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={handlePublish}
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg, #00d4aa, #7b61ff)',
                color: 'white',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '0.75rem',
                fontWeight: '600',
                whiteSpace: 'nowrap'
              }}
            >
              {saving ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>

        {/* Mobile Layout - Row 2 (Status) */}
        <div style={{
          display: 'none',
          '@media (max-width: 768px)': {
            display: 'block',
            textAlign: 'center',
            width: '100%'
          }
        }}>
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(224, 247, 244, 0.5)'
          }}>
            {lastSaved ? `Last saved at ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 
             (hasUnsavedChanges ? 'Unsaved changes' : '')}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="article-editor-main-content" style={{
        display: 'flex',
        padding: '2rem',
        gap: '2rem',
        maxWidth: '1400px',
        margin: '0 auto',
        flexDirection: 'row'
      }}>
        {/* Left Side - Article Settings (40%) */}
        <div className="article-editor-settings-panel" style={{
          flex: '0 0 40%',
          background: '#0a1f2e',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid rgba(0,212,170,0.1)'
        }}>
          <h3 style={{ color: '#e0f7f4', marginBottom: '1.5rem' }}>Article Settings</h3>
          
          {/* Cover Image */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              color: '#e0f7f4', 
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Cover Image URL
            </label>
            <input
              type="text"
              value={articleCoverImage}
              onChange={(e) => setArticleCoverImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              style={{
                width: '100%',
                background: '#040d14',
                border: '1px solid rgba(0,212,170,0.3)',
                borderRadius: '8px',
                color: '#e0f7f4',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                marginBottom: '1rem',
                boxSizing: 'border-box'
              }}
            />
            {/* Image Preview */}
            <div className="article-editor-cover-preview" style={{
              height: '200px',
              background: 'rgba(10, 31, 46, 0.5)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '1px solid rgba(0,212,170,0.1)'
            }}>
              {articleCoverImage ? (
                <img
                  src={articleCoverImage}
                  alt="Cover preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <div style={{
                display: articleCoverImage ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(224, 247, 244, 0.3)',
                fontSize: '0.875rem'
              }}>
                No image preview
              </div>
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              color: '#e0f7f4', 
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Title
            </label>
            <input
              type="text"
              value={articleTitle}
              onChange={(e) => setArticleTitle(e.target.value)}
              placeholder="Enter article title"
              style={{
                width: '100%',
                background: '#040d14',
                border: '1px solid rgba(0,212,170,0.3)',
                borderRadius: '8px',
                color: '#e0f7f4',
                padding: '0.75rem 1rem',
                fontSize: '1.5rem',
                fontWeight: '600',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Category */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              color: '#e0f7f4', 
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Category
            </label>
            <select
              value={articleCategory}
              onChange={(e) => setArticleCategory(e.target.value)}
              style={{
                width: '100%',
                background: '#040d14',
                border: '1px solid rgba(0,212,170,0.3)',
                borderRadius: '8px',
                color: '#e0f7f4',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Link to Question */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              color: '#e0f7f4', 
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Link to Question
            </label>
            <select
              value={articleQuestionId}
              onChange={(e) => setArticleQuestionId(e.target.value)}
              style={{
                width: '100%',
                background: '#040d14',
                border: '1px solid rgba(0,212,170,0.3)',
                borderRadius: '8px',
                color: '#e0f7f4',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                boxSizing: 'border-box'
              }}
            >
              <option value="">No linked question</option>
              {questions.map(q => (
                <option key={q._id} value={q._id}>
                  {q.text.length > 50 ? q.text.substring(0, 50) + '...' : q.text}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Side - Content Editor (60%) */}
        <div className="article-editor-editor-panel" style={{
          flex: '0 0 60%',
          background: '#0a1f2e',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid rgba(0,212,170,0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ color: '#e0f7f4', marginBottom: '1.5rem' }}>Content</h3>
          
          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1rem',
            borderBottom: '1px solid rgba(0,212,170,0.15)'
          }}>
            <button
              onClick={() => setActiveTab('write')}
              style={{
                padding: '0.5rem 1rem',
                background: activeTab === 'write' ? 'rgba(0,212,170,0.1)' : 'transparent',
                border: activeTab === 'write' ? '1px solid rgba(0,212,170,0.3)' : '1px solid transparent',
                borderRadius: '8px 8px 0 0',
                color: activeTab === 'write' ? '#00d4aa' : 'rgba(224, 247, 244, 0.6)',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Write
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              style={{
                padding: '0.5rem 1rem',
                background: activeTab === 'preview' ? 'rgba(0,212,170,0.1)' : 'transparent',
                border: activeTab === 'preview' ? '1px solid rgba(0,212,170,0.3)' : '1px solid transparent',
                borderRadius: '8px 8px 0 0',
                color: activeTab === 'preview' ? '#00d4aa' : 'rgba(224, 247, 244, 0.6)',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Preview
            </button>
          </div>

          {activeTab === 'write' ? (
            <>
              {/* Formatting Toolbar */}
              <div className="article-editor-formatting-toolbar" style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1rem',
                padding: '0.5rem',
                background: 'rgba(10, 31, 46, 0.5)',
                borderRadius: '8px',
                border: '1px solid rgba(0,212,170,0.1)',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={handleBold}
                  style={{
                    padding: '0.5rem',
                    background: 'transparent',
                    border: '1px solid rgba(0,212,170,0.2)',
                    borderRadius: '4px',
                    color: '#00d4aa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Bold"
                >
                  <FaBold />
                </button>
                <button
                  onClick={handleItalic}
                  style={{
                    padding: '0.5rem',
                    background: 'transparent',
                    border: '1px solid rgba(0,212,170,0.2)',
                    borderRadius: '4px',
                    color: '#00d4aa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Italic"
                >
                  <FaItalic />
                </button>
                <button
                  onClick={handleHeading1}
                  style={{
                    padding: '0.5rem',
                    background: 'transparent',
                    border: '1px solid rgba(0,212,170,0.2)',
                    borderRadius: '4px',
                    color: '#00d4aa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Heading 1"
                >
                  H1
                </button>
                <button
                  onClick={handleHeading2}
                  style={{
                    padding: '0.5rem',
                    background: 'transparent',
                    border: '1px solid rgba(0,212,170,0.2)',
                    borderRadius: '4px',
                    color: '#00d4aa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Heading 2"
                >
                  H2
                </button>
                <button
                  onClick={handleBlockquote}
                  style={{
                    padding: '0.5rem',
                    background: 'transparent',
                    border: '1px solid rgba(0,212,170,0.2)',
                    borderRadius: '4px',
                    color: '#00d4aa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Quote"
                >
                  <FaQuoteLeft />
                </button>
                <button
                  onClick={handleUnorderedList}
                  style={{
                    padding: '0.5rem',
                    background: 'transparent',
                    border: '1px solid rgba(0,212,170,0.2)',
                    borderRadius: '4px',
                    color: '#00d4aa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Bullet List"
                >
                  <FaListUl />
                </button>
                <button
                  onClick={handleOrderedList}
                  style={{
                    padding: '0.5rem',
                    background: 'transparent',
                    border: '1px solid rgba(0,212,170,0.2)',
                    borderRadius: '4px',
                    color: '#00d4aa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Numbered List"
                >
                  <FaListOl />
                </button>
                <button
                  onClick={handleLink}
                  style={{
                    padding: '0.5rem',
                    background: 'transparent',
                    border: '1px solid rgba(0,212,170,0.2)',
                    borderRadius: '4px',
                    color: '#00d4aa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Link"
                >
                  <FaLink />
                </button>
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={articleContent}
                onChange={(e) => setArticleContent(e.target.value)}
                placeholder="Start writing your article..."
                className="article-editor-textarea"
                style={{
                  flex: 1,
                  minHeight: '500px',
                  background: '#040d14',
                  border: '1px solid rgba(0,212,170,0.3)',
                  borderRadius: '8px',
                  color: '#e0f7f4',
                  padding: '1rem',
                  fontSize: '0.875rem',
                  lineHeight: '1.6',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  width: '100%'
                }}
              />

              {/* Word count and read time */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '1rem',
                fontSize: '0.75rem',
                color: 'rgba(224, 247, 244, 0.5)'
              }}>
                <span>{getWordCount(articleContent)} words</span>
                <span>{getReadTime(articleContent)} min read</span>
              </div>
            </>
          ) : (
            /* Preview Panel */
            <div style={{
              flex: 1,
              background: '#040d14',
              border: '1px solid rgba(0,212,170,0.3)',
              borderRadius: '8px',
              padding: '1.5rem',
              overflow: 'auto',
              minHeight: '500px'
            }}>
              {/* Cover Image in Preview */}
              {articleCoverImage && (
                <div style={{
                  marginBottom: '1.5rem',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  height: '200px'
                }}>
                  <img
                    src={articleCoverImage}
                    alt="Cover"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              )}

              {/* Title in Preview */}
              {articleTitle && (
                <h1 style={{
                  color: '#e0f7f4',
                  fontSize: '2rem',
                  fontWeight: '700',
                  marginBottom: '1rem',
                  lineHeight: '1.2'
                }}>
                  {articleTitle}
                </h1>
              )}

              {/* Category and Read Time */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
                color: 'rgba(224, 247, 244, 0.6)'
              }}>
                {articleCategory && (
                  <span style={{
                    background: 'rgba(0,212,170,0.1)',
                    color: '#00d4aa',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    border: '1px solid rgba(0,212,170,0.3)'
                  }}>
                    {articleCategory}
                  </span>
                )}
                <span>{getReadTime(articleContent)} min read</span>
              </div>

              {/* Content */}
              <div style={{
                color: '#e0f7f4',
                lineHeight: '1.6',
                fontSize: '0.875rem'
              }}>
                <ReactMarkdown>{articleContent || 'Start writing to see preview...'}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          color: 'white',
          fontWeight: '500',
          zIndex: 1000,
          background: toast.type === 'success' ? '#00d4aa' : '#ef4444',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          animation: 'slideIn 0.3s ease'
        }}>
          {toast.message}
        </div>
      )}

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      </div>
    </>
  )
}

export default ArticleEditor
