import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import ApiKeySetup from './ApiKeySetup'
import { useToast } from '../context/ToastContext'
import Skeleton from './Skeleton'

const ActivityChart = forwardRef((props, ref) => {
  const { addToast } = useToast()
  const [activityData, setActivityData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPoint, setSelectedPoint] = useState(null)
  const [stats, setStats] = useState({
    totalPosts: 0,
    uniqueUsers: 0,
    timeSpan: ''
  })

  // Expose updateData method to parent
  useImperativeHandle(ref, () => ({
    updateData: (posts) => {
      if (posts) {
        const chartData = groupPostsByHour(posts)
        setActivityData(chartData)
        
        // Update stats
        const uniqueUsers = new Set(posts.map(post => post.username)).size
        const oldestPost = new Date(Math.min(...posts.map(post => parseInt(post.post_date) * 1000)))
        const newestPost = new Date(Math.max(...posts.map(post => parseInt(post.post_date) * 1000)))
        setStats({
          totalPosts: posts.length,
          uniqueUsers,
          timeSpan: `${oldestPost.toLocaleString()} - ${newestPost.toLocaleString()}`
        })
      }
    }
  }))

  // Initial load
  useEffect(() => {
    const storedKey = window.electronAPI.getApiKey()
    if (!storedKey) {
      setError('API key required')
      setLoading(false)
      return
    }
    
    const fetchInitialData = async () => {
      try {
        const posts = await window.electronAPI.getForumPosts(20)
        if (!posts) {
          throw new Error('Failed to fetch posts')
        }
        
        const chartData = groupPostsByHour(posts)
        setActivityData(chartData)
        
        // Update stats
        const uniqueUsers = new Set(posts.map(post => post.username)).size
        const oldestPost = new Date(Math.min(...posts.map(post => parseInt(post.post_date) * 1000)))
        const newestPost = new Date(Math.max(...posts.map(post => parseInt(post.post_date) * 1000)))
        setStats({
          totalPosts: posts.length,
          uniqueUsers,
          timeSpan: `${oldestPost.toLocaleString()} - ${newestPost.toLocaleString()}`
        })
      } catch (err) {
        setError('Failed to load activity data')
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  const groupPostsByHour = (posts) => {
    if (!posts.length) return []

    // Find the time range from the posts
    const oldestPost = Math.min(...posts.map(post => post.timestamp))
    const newestPost = Math.max(...posts.map(post => post.timestamp))
    
    // Round to nearest hour
    const startTime = new Date(oldestPost)
    startTime.setMinutes(0, 0, 0)
    
    const endTime = new Date(newestPost)
    endTime.setMinutes(59, 59, 999)
    
    // Calculate number of hours between start and end
    const hoursDiff = Math.ceil((endTime - startTime) / (60 * 60 * 1000))
    
    // Create array for each hour in the range
    const hours = Array.from({ length: hoursDiff + 1 }, (_, i) => {
      const hour = new Date(startTime.getTime() + (i * 60 * 60 * 1000))
      return {
        time: hour.getHours().toString().padStart(2, '0') + ':00',
        count: 0,
        posts: [],
        timestamp: hour.getTime()
      }
    })

    // Group posts into hours
    posts.forEach(post => {
      const postDate = new Date(post.timestamp)
      const hourIndex = Math.floor((postDate - startTime) / (60 * 60 * 1000))
      
      if (hourIndex >= 0 && hourIndex < hours.length) {
        hours[hourIndex].count++
        hours[hourIndex].posts.push({
          ...post,
          formattedDate: new Date(post.timestamp).toLocaleString()
        })
      }
    })

    return hours
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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-[300px] w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    )
  }

  if (error === 'API key required') {
    return (
      <div className="h-full flex items-center justify-center">
        <ApiKeySetup onKeySet={() => {
          // Refresh data after key is set
          fetchInitialData()
        }} />
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="h-full relative" onClick={handleBackgroundClick}>
      <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
        <div className="bg-light-200 dark:bg-dark-300 rounded-lg p-3">
          <div className="text-gray-500 dark:text-gray-400">Total Posts</div>
          <div className="text-gray-800 dark:text-gray-200 font-medium">{stats.totalPosts}</div>
        </div>
        <div className="bg-light-200 dark:bg-dark-300 rounded-lg p-3">
          <div className="text-gray-500 dark:text-gray-400">Unique Users</div>
          <div className="text-gray-800 dark:text-gray-200 font-medium">{stats.uniqueUsers}</div>
        </div>
        <div className="bg-light-200 dark:bg-dark-300 rounded-lg p-3">
          <div className="text-gray-500 dark:text-gray-400">Time Range</div>
          <div className="text-gray-800 dark:text-gray-200 font-medium text-xs">{stats.timeSpan}</div>
        </div>
      </div>
      <div className="h-[calc(100%-6rem)]">
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
                    <div className="text-gray-500 text-xs mt-1 italic">
                      Click for more info
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
      </div>

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
})

ActivityChart.displayName = 'ActivityChart'

export default ActivityChart 