import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import ApiKeySetup from './ApiKeySetup'

function ActivityChart() {
  const [activityData, setActivityData] = useState([])
  const [apiKey, setApiKey] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPoint, setSelectedPoint] = useState(null)

  useEffect(() => {
    const storedKey = window.electronAPI.getApiKey()
    setApiKey(storedKey)
    
    if (storedKey) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [])

  const groupPostsByHour = (posts) => {
    console.log('Raw posts data:', posts)

    // Find the oldest post time
    const oldestPostTime = Math.min(...posts.map(post => parseInt(post.post_date)))
    const startTime = new Date(oldestPostTime * 1000)
    startTime.setMinutes(0, 0, 0) // Round to hour
    
    const now = new Date()
    now.setMinutes(0, 0, 0) // Round to hour

    // Calculate hours between oldest post and now
    const hoursDiff = Math.ceil((now - startTime) / 3600000)
    
    // Create a map to store posts by hour
    const hourMap = new Map()
    
    // Initialize hours from oldest to now
    for (let i = 0; i <= hoursDiff; i++) {
      const hour = new Date(startTime.getTime() + i * 3600000)
      const timeKey = hour.getHours().toString().padStart(2, '0') + ':00'
      hourMap.set(timeKey, { 
        time: timeKey,
        count: 0,
        posts: []
      })
    }

    // Group posts by hour
    posts.forEach(post => {
      try {
        if (!post.post_date) {
          console.warn('Post missing post_date field:', post)
          return
        }

        const date = new Date(parseInt(post.post_date) * 1000)
        if (isNaN(date.getTime())) {
          console.warn('Invalid post_date format:', post.post_date)
          return
        }

        const timeKey = date.getHours().toString().padStart(2, '0') + ':00'

        if (hourMap.has(timeKey)) {
          const hourData = hourMap.get(timeKey)
          hourData.count++
          hourData.posts.push({
            ...post,
            formattedDate: date.toLocaleString()
          })
        }
      } catch (err) {
        console.error('Error processing post:', err, post)
      }
    })

    return Array.from(hourMap.values())
      .sort((a, b) => {
        const timeA = parseInt(a.time.split(':')[0])
        const timeB = parseInt(b.time.split(':')[0])
        return timeA - timeB
      })
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const posts = await window.electronAPI.getForumPosts(10)
      if (posts && Array.isArray(posts)) {
        const chartData = groupPostsByHour(posts)
        setActivityData(chartData)
      } else {
        throw new Error('Invalid data format received from API')
      }
    } catch (err) {
      setError('Failed to fetch activity data')
      console.error('[ERROR] Activity fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeySet = (key) => {
    setApiKey(key)
    fetchData()
  }

  const handlePostClick = (post) => {
    if (window.electronAPI && post) {
      // Convert title to URL-friendly format (lowercase, hyphens for spaces)
      const urlTitle = post.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

      // Construct URL with both thread_id and post_id to link directly to the post
      const forumUrl = `https://constelia.ai/forums/index.php?threads/${urlTitle}.${post.thread_id}/post-${post.post_id}`;
      console.log('Opening forum URL:', forumUrl, post);
      window.electronAPI.openExternal(forumUrl);
    }
  }

  const handlePointClick = (data) => {
    setSelectedPoint(data)
  }

  const handleClosePopup = (e) => {
    e?.stopPropagation()
    setSelectedPoint(null)
  }

  const handleBackgroundClick = (e) => {
    if (selectedPoint && e.target === e.currentTarget) {
      handleClosePopup()
    }
  }

  if (!apiKey) {
    return <ApiKeySetup onKeySet={handleKeySet} />
  }

  if (loading) {
    return <div className="text-gray-500 dark:text-gray-400">Loading activity data...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="h-full relative" onClick={handleBackgroundClick}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={activityData} 
          margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="text-gray-300 dark:text-gray-700" />
          <XAxis 
            dataKey="time" 
            className="text-gray-500 dark:text-gray-400"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            className="text-gray-500 dark:text-gray-400"
            tick={{ fontSize: 12 }}
            allowDecimals={false}
            domain={[0, 'auto']}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              
              const data = payload[0].payload;
              return (
                <div className="bg-dark-200 rounded-lg shadow-lg p-2 border border-dark-100">
                  <div className="text-white font-medium">
                    {data.count} posts
                  </div>
                  <div className="text-gray-400 text-sm">
                    {data.time}
                  </div>
                </div>
              );
            }}
            cursor={false}
          />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="var(--primary)" 
            strokeWidth={2}
            dot={{ 
              fill: 'var(--primary)',
              cursor: 'pointer',
              onClick: (e) => handlePointClick(e.payload)
            }}
            activeDot={{
              r: 6,
              fill: 'var(--secondary)',
              cursor: 'pointer',
              onClick: (_, e) => handlePointClick(e.payload)
            }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Popup */}
      {selectedPoint && (
        <div 
          className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={handleBackgroundClick}
        >
          <div 
            className="bg-dark-200 rounded-lg shadow-lg p-4 border border-dark-100 w-[90%] max-w-4xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <div className="text-lg font-semibold text-white">
                {selectedPoint.count} posts this hour
                <div className="text-sm text-gray-400 font-normal">
                  {selectedPoint.time}
                </div>
              </div>
              <button 
                onClick={handleClosePopup}
                className="p-1.5 hover:bg-dark-100 rounded-lg transition-colors group"
              >
                <svg 
                  className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {selectedPoint.posts.map((post, i) => (
                  <button 
                    key={i} 
                    onClick={() => handlePostClick(post)}
                    title="Click to open forum post"
                    className="p-3 bg-dark-300 rounded-lg text-left hover:bg-dark-100 transition-colors cursor-pointer flex flex-col h-full group"
                  >
                    <div className="font-medium text-white mb-1 break-words line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </div>
                    <div className="mt-auto">
                      <div className="text-gray-300 text-sm">by {post.username}</div>
                      <div className="text-gray-400 text-xs mt-1">{post.formattedDate}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ActivityChart 