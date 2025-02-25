import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChartBarIcon, UserGroupIcon, CogIcon, BellIcon, EnvelopeIcon, ArrowPathIcon, ChatBubbleLeftIcon, XMarkIcon, MinusIcon, ArrowsPointingOutIcon, ArrowLeftIcon, ArrowRightIcon, GlobeAltIcon, Bars3Icon } from '@heroicons/react/24/outline'
import { XMarkIcon as SolidXMarkIcon, MinusIcon as SolidMinusIcon, ArrowsPointingOutIcon as SolidArrowsPointingOutIcon } from '@heroicons/react/20/solid'
import Settings from './components/Settings'
import Software from './components/Software'
import { ThemeProvider } from './context/ThemeContext'
import ActivityChart from './components/ActivityChart'
import MemberInfo from './components/MemberInfo'
import { ToastProvider, useToast } from './context/ToastContext'
import NotificationDrawer from './components/NotificationDrawer'
import Skeleton from './components/Skeleton'
import ForumPosts from './components/ForumPosts'
import ForumWebView from './components/ForumWebView'
import { ForumContext } from './contexts/ForumContext'
import ApiKeySetup from './components/ApiKeySetup'

// Separate the main app content from the providers
function AppContent() {
  const { addToast } = useToast()
  const contentRef = useRef(null)
  const scrollAnimationRef = useRef(null)
  const lastScrollTime = useRef(Date.now())
  const [selectedTab, setSelectedTab] = useState('dashboard')
  const [systemInfo, setSystemInfo] = useState(null)
  const [memberInfo, setMemberInfo] = useState(null)
  const [recentRolls, setRecentRolls] = useState([])
  const [canRoll, setCanRoll] = useState(false)
  const [lastRollTime, setLastRollTime] = useState(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [nextRefreshTime, setNextRefreshTime] = useState(Date.now() + 300000)
  const [cooldownEndTime, setCooldownEndTime] = useState(0)
  const [refreshCountdown, setRefreshCountdown] = useState(0)
  const [previousTab, setPreviousTab] = useState('dashboard')
  const activityChartRef = React.useRef(null)
  const [timeUntilRoll, setTimeUntilRoll] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [software, setSoftware] = useState([])
  const [selectedSoftwareDetails, setSelectedSoftwareDetails] = useState(null)
  const [softwareDetailsLoading, setSoftwareDetailsLoading] = useState(false)
  const systemInfoInterval = useRef(null)
  const velocityRef = useRef(0)
  const lastDeltaRef = useRef(0)
  const momentumRef = useRef(null)
  const [isForumModalOpen, setIsForumModalOpen] = useState(false)
  const [isForumFullView, setIsForumFullView] = useState(false)
  const webviewRef = useRef(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      const config = window.electronAPI.getConfig()
      return config.sidebarCollapsed || false
    } catch (error) {
      console.error('Failed to get sidebar state from config:', error)
      return false
    }
  })

  // Function to toggle sidebar
  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev
      // Save to config
      try {
        window.electronAPI.saveConfig({ sidebarCollapsed: newState })
      } catch (error) {
        console.error('Failed to save sidebar state to config:', error)
      }
      return newState
    });
    addToast(`Sidebar ${isSidebarCollapsed ? 'expanded' : 'collapsed'}`, 'info');
  }, [isSidebarCollapsed, addToast]);

  // Add keyboard shortcut for sidebar toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Ctrl+S
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault(); // Prevent default save action
        toggleSidebar();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  // Add smooth scroll function
  const smoothScroll = useCallback((element, target, duration = 300) => {
    // Cancel any existing animation
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current)
    }

    const start = element.scrollTop
    const distance = target - start
    const startTime = performance.now()

    const easeInOutQuad = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t

    const animation = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      element.scrollTop = start + distance * easeInOutQuad(progress)

      if (progress < 1) {
        scrollAnimationRef.current = requestAnimationFrame(animation)
      } else {
        scrollAnimationRef.current = null
      }
    }

    scrollAnimationRef.current = requestAnimationFrame(animation)
  }, [])

  // Add scroll event listener
  useEffect(() => {
    const handleWheel = (e) => {
      const scrollableElement = e.target.closest('.overflow-y-auto')
      if (!scrollableElement) return

      e.preventDefault()
      
      const now = Date.now()
      const timeDelta = now - lastScrollTime.current
      lastScrollTime.current = now

      // Calculate scroll amount based on deltaMode with further reduced sensitivity
      const multiplier = e.deltaMode === 1 ? 8 : 0.25
      const scrollAmount = e.deltaY * multiplier

      // Update velocity based on scroll input with smooth easing
      velocityRef.current = (scrollAmount + lastDeltaRef.current * 0.3) / 2
      lastDeltaRef.current = scrollAmount

      // Cancel any existing momentum animation
      if (momentumRef.current) {
        cancelAnimationFrame(momentumRef.current)
      }

      // Apply immediate scroll with easing
      scrollableElement.scrollTop += scrollAmount

      // Start momentum scrolling with easing in and out
      let velocity = velocityRef.current * 0.6
      let time = 0
      const applyMomentum = () => {
        time += 1/60  // Assuming 60fps
        
        // Ease both in and out using a custom curve
        const easeInOut = (t) => {
          // Smoother easing function that starts slow, speeds up, then slows down
          return t < 0.5 
            ? 4 * t * t * t 
            : 1 - Math.pow(-2 * t + 2, 3) / 2
        }
        
        const easedVelocity = velocity * easeInOut(1 - Math.min(time, 1))
        
        if (Math.abs(easedVelocity) < 0.1) {
          momentumRef.current = null
          return
        }

        scrollableElement.scrollTop += easedVelocity
        momentumRef.current = requestAnimationFrame(applyMomentum)
      }

      momentumRef.current = requestAnimationFrame(applyMomentum)
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    
    return () => {
      window.removeEventListener('wheel', handleWheel)
      if (momentumRef.current) {
        cancelAnimationFrame(momentumRef.current)
      }
    }
  }, [])

  // Keep smooth scrolling only for programmatic scrolls (like clicking links)
  const smoothScrollToElement = useCallback((element) => {
    if (!contentRef.current || !element) return

    const elementRect = element.getBoundingClientRect()
    const containerRect = contentRef.current.getBoundingClientRect()
    const relativeTop = elementRect.top - containerRect.top + contentRef.current.scrollTop
    const targetScroll = relativeTop - 100 // 100px padding from top

    // Cancel any existing animation
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current)
    }

    const start = contentRef.current.scrollTop
    const distance = targetScroll - start
    const duration = 300
    const startTime = performance.now()

    const easeInOutQuad = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t

    const animation = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      contentRef.current.scrollTop = start + distance * easeInOutQuad(progress)

      if (progress < 1) {
        scrollAnimationRef.current = requestAnimationFrame(animation)
      } else {
        scrollAnimationRef.current = null
      }
    }

    scrollAnimationRef.current = requestAnimationFrame(animation)
  }, [])

  // Modify the system info effect to only run on dashboard
  useEffect(() => {
    const loadSystemInfo = () => {
      if (typeof window.electronAPI === 'undefined') return

      try {
        const info = window.electronAPI.getSystemInfo()
        if (info) {
          setSystemInfo({
            platform: info.platform,
            arch: info.arch,
            cpus: info.cpus,
            totalMemory: info.totalMemory,
            freeMemory: info.freeMemory,
            uptime: info.uptime,
            hostname: info.hostname,
            username: info.username,
            version: info.version
          })
        }
      } catch (error) {
        console.error('[ERROR] System info fetch error:', error)
      }
    }

    // Only start polling if we're on the dashboard
    if (selectedTab === 'dashboard') {
      loadSystemInfo() // Initial load
      systemInfoInterval.current = setInterval(loadSystemInfo, 5000)
      
      return () => {
        if (systemInfoInterval.current) {
          clearInterval(systemInfoInterval.current)
          systemInfoInterval.current = null
        }
      }
    } else {
      // Clean up interval if we switch away from dashboard
      if (systemInfoInterval.current) {
        clearInterval(systemInfoInterval.current)
        systemInfoInterval.current = null
      }
    }
  }, [selectedTab]) // Re-run when tab changes

  useEffect(() => {
    const fetchData = async () => {
      try {
        const memberInfo = await window.electronAPI.getMember('xp,history')
        if (memberInfo) {
          setUnreadMessages(memberInfo.unread_conversations)
          
          if (memberInfo.unread_alerts > 0) {
            setAlerts([{
              title: 'Constelia Alerts',
              message: `You have ${memberInfo.unread_alerts} unread forum alerts`,
              time: new Date().toLocaleString(),
              link: 'https://constelia.ai/forums/index.php?account/alerts',
              type: 'constelia'
            }])
            addToast(`You have ${memberInfo.unread_alerts} unread forum alerts`, 'info')
          } else {
            setAlerts([])
          }
        }
      } catch (error) {
        console.error('[ERROR] Failed to fetch member info:', error)
      }
    }

    // Initial fetch
    fetchData()

    // Set up interval for periodic updates (silent updates)
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, []) // Only run on mount

  // Helper function to format time remaining
  const formatTimeRemaining = (timestamp) => {
    const seconds = Math.max(0, Math.floor((timestamp - Date.now()) / 1000))
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleTabChange = (newTab) => {
    setPreviousTab(selectedTab)
    setSelectedTab(newTab)
    // That's it - no notifications or data fetching
  }

  // Handle API key being set
  const handleApiKeySet = (key) => {
    setHasApiKey(true)
    // Trigger data fetch after API key is set
    fetchAllData()
  }

  // Handle API errors related to missing or invalid API key
  const handleApiError = (error) => {
    console.error('[API ERROR]', error.message ? error.message : error)
    
    if (error.message === 'API key not found' || error.message.includes('API key not found')) {
      setHasApiKey(false)
      addToast('API key is missing. Please enter your API key.', 'error')
    } else if (error.message.includes('Invalid API key') || error.message.includes('Authentication failed')) {
      setHasApiKey(false)
      // Clear the invalid API key securely
      window.electronAPI.saveApiKey('')
      addToast('Invalid API key. Please check and re-enter your API key.', 'error')
    }
  }

  // Modify fetchAllData to handle API key errors
  const fetchAllData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch system info first
      const systemInfo = window.electronAPI.getSystemInfo()
      setSystemInfo(systemInfo)

      // Fetch member data
      try {
        const memberData = await window.electronAPI.getMember()
        setMemberInfo(memberData)
        
        if (memberData.rolls) {
          setRecentRolls(memberData.rolls)
          setCanRoll(memberData.can_roll)
          setLastRollTime(memberData.last_roll_time)
          
          if (memberData.cooldown_end) {
            setCooldownEndTime(memberData.cooldown_end * 1000)
          }
        }
      } catch (error) {
        console.error('[ERROR] Member data fetch error:', error)
        handleApiError(error)
        return // Stop further processing if API key is invalid
      }
      
      // Fetch software data if not already loaded
      if (!selectedSoftwareDetails) {
        try {
          // Fetch software data before using it
          const softwareData = await window.electronAPI.getAllSoftware()
          if (softwareData) {
            setSoftware(Object.values(softwareData))
          }
        } catch (error) {
          console.error('[ERROR] Software data fetch error:', error)
          handleApiError(error)
        }
      }
      
      // Update loading state and initial load flag
      setIsLoading(false)
      setIsInitialLoad(false)
      setNextRefreshTime(Date.now() + 300000) // 5 minutes
      
      // Show welcome toast only on initial load, not during refreshes
      if (isInitialLoad) {
        addToast(`Welcome back, ${memberInfo?.username || systemInfo?.username || 'User'}!`, 'success')
      }
    } catch (error) {
      console.error('[ERROR] Data fetch error:', error)
      setIsLoading(false)
      addToast('Failed to load data. Please try again.', 'error')
    }
  }

  // Initial load
  useEffect(() => {
    fetchAllData()
  }, [])

  // Auto refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() >= nextRefreshTime) {
        fetchAllData()
        setNextRefreshTime(Date.now() + 300000) // 5 minutes
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [nextRefreshTime])

  // Manual refresh handler
  const handleManualRefresh = async () => {
    if (Date.now() < cooldownEndTime) {
      const remainingSeconds = Math.ceil((cooldownEndTime - Date.now()) / 1000)
      addToast(`Please wait ${remainingSeconds}s before refreshing again`, 'info')
      return
    }

    setIsRefreshing(true)
    setCooldownEndTime(Date.now() + 30000)
    await fetchAllData()
    setIsRefreshing(false)
  }

  const formatBytes = (bytes) => {
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(2)} GB`
  }

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / (3600 * 24))
    const hours = Math.floor((seconds % (3600 * 24)) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const tabTitles = {
    dashboard: 'Dashboard',
    Software: 'Software',
    settings: 'System Settings',
    Forum: 'Forum Posts'
  }

  const handleWindowControl = (action) => {
    console.log('🎮 Window control action requested:', action)
    if (window.electronAPI) {
      window.electronAPI.windowControl(action)
    } else {
      console.error('❌ electronAPI not available for window control')
    }
  }

  const renderSystemInfo = () => {
    if (!systemInfo) {
      return <p className="text-gray-600 dark:text-gray-400">Loading system information...</p>
    }

    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-500 dark:text-gray-400">Platform</p>
          <p className="text-gray-800 dark:text-gray-200 font-medium">
            {systemInfo.platform} {systemInfo.version} ({systemInfo.arch})
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Hostname</p>
          <p className="text-gray-800 dark:text-gray-200 font-medium">{systemInfo.hostname}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">CPU</p>
          <p className="text-gray-800 dark:text-gray-200 font-medium">{systemInfo.cpus[0].model}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">CPU Cores</p>
          <p className="text-gray-800 dark:text-gray-200 font-medium">{systemInfo.cpus.length} cores</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Memory</p>
          <p className="text-gray-800 dark:text-gray-200 font-medium">
            {formatBytes(systemInfo.freeMemory)} free of {formatBytes(systemInfo.totalMemory)}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Uptime</p>
          <p className="text-gray-800 dark:text-gray-200 font-medium">{formatUptime(systemInfo.uptime)}</p>
        </div>
      </div>
    )
  }

  // Software details handlers
  const fetchSoftwareDetails = async (name) => {
    if (!name) return

    try {
      setSoftwareDetailsLoading(true)
      const data = await window.electronAPI.getSoftware(name, 'scripts&checksum')
      setSelectedSoftwareDetails(data)
    } catch (error) {
      console.error('[ERROR] Failed to fetch software details:', error)
      addToast('Failed to load software details', 'error')
      setSelectedSoftwareDetails(null)
    } finally {
      setSoftwareDetailsLoading(false)
    }
  }

  const renderContent = () => {
    if (isForumFullView) {
      return (
        <ForumWebView 
          isOpen={true} 
          onClose={() => {
            console.log('[FORUM] Closing full view')
            setIsForumFullView(false)
          }} 
          isFullView={true} 
        />
      )
    }

    switch(selectedTab) {
      case 'settings':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="h-full"
          >
            <Settings />
          </motion.div>
        )
      case 'Software':
        return (
          <Software 
            softwareData={software} 
            loading={isLoading}
            onSoftwareSelect={fetchSoftwareDetails}
            selectedSoftware={selectedSoftwareDetails}
            detailsLoading={softwareDetailsLoading}
            onCloseDetails={() => setSelectedSoftwareDetails(null)}
          />
        )
      case 'Forum':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="h-full"
          >
            <ForumPosts />
          </motion.div>
        )
      default:
        return (
          <div className="h-full flex flex-col gap-6">
            {/* Member Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
              className="bg-light-100 dark:bg-dark-200 p-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-light-300 dark:border-dark-100"
            >
              <MemberInfo 
                memberInfo={memberInfo}
                recentRolls={recentRolls}
                canRoll={canRoll}
                lastRollTime={lastRollTime}
                timeUntilRoll={timeUntilRoll}
                onRoll={handleRoll}
              />
            </motion.div>
            
            {/* System Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
              className="bg-light-100 dark:bg-dark-200 p-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-light-300 dark:border-dark-100"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">System Information</h3>
                <span className="text-primary">⚡</span>
              </div>
              {renderSystemInfo()}
            </motion.div>

            {/* Activity Chart Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
              transition={{ delay: 0.2 }}
              className="flex-1 min-h-[400px] bg-light-100 dark:bg-dark-200 p-3 pb-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-light-300 dark:border-dark-100"
            >
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Activity Chart</h3>
              <div className="h-full min-h-[350px]">
                <ActivityChart ref={activityChartRef} />
              </div>
            </motion.div>
          </div>
        )
    }
  }

  // Add auto-update check
  useEffect(() => {
    const checkUpdatesOnStartup = async () => {
      if (isInitialLoad) {
        console.log('[UPDATE] Checking auto-update configuration...')
        const config = window.electronAPI.getConfig()
        if (config.autoUpdate) {
          console.log('[UPDATE] Auto-update enabled, checking for updates...')
          await handleCheckUpdate(false) // Changed to false to show toasts
        } else {
          console.log('[UPDATE] Auto-update disabled, skipping check')
        }
      }
    }
    
    checkUpdatesOnStartup()
  }, [isInitialLoad])

  const handleCheckUpdate = async (silent = false) => {
    try {
      const updateInfo = await window.electronAPI.checkForUpdates()
      
      if (updateInfo.updateAvailable) {
        addToast(
          `Update available: v${updateInfo.latestVersion}`, 
          'info'
        )
        window.electronAPI.openExternal(updateInfo.releaseUrl)
      } else if (!silent) {
        addToast(
          `You're running the latest version (v${updateInfo.currentVersion})`, 
          'success'
        )
      }
    } catch (error) {
      console.error('[ERROR] Update check error:', error)
      const errorMessage = {
        'NO_INTERNET': 'No internet connection available',
        'UPDATE_TIMEOUT': 'Update check timed out',
        'NO_RESPONSE': 'Could not reach update server',
        'NO_RELEASES': 'No releases found',
        'GITHUB_API_ERROR': 'GitHub API error',
        'INVALID_RELEASE': 'Invalid release data'
      }[error.message] || 'Failed to check for updates'
      
      if (!silent) {
        addToast(errorMessage, 'error')
      }
    }
  }

  // Fetch member info and roll data
  const fetchMemberData = async (silent = false) => {
    try {
      const info = await window.electronAPI.getMember('rolls')
      if (info) {
        setMemberInfo(info)
        
        if (info.rolls && Array.isArray(info.rolls)) {
          setRecentRolls(info.rolls.slice(0, 3))
          
          if (info.rolls.length > 0) {
            const lastRoll = info.rolls[0]
            const timestamp = lastRoll.time
            const lastRollDate = new Date(timestamp * 1000)
            
            if (!isNaN(lastRollDate.getTime())) {
              setLastRollTime(lastRollDate)
              const now = new Date()
              const hoursSinceLastRoll = (now - lastRollDate) / (1000 * 60 * 60)
              setTimeUntilRoll(Math.max(0, Math.ceil(24 - hoursSinceLastRoll)))
              setCanRoll(hoursSinceLastRoll >= 24)
            } else {
              setCanRoll(true)
            }
          } else {
            setCanRoll(true)
          }
        }
      }
    } catch (error) {
      console.error('[ERROR] Failed to fetch member data:', error)
      if (!silent) {
        addToast('Failed to load member information', 'error')
      }
    }
  }

  // Initial data fetch only on mount
  useEffect(() => {
    if (isInitialLoad) {
      fetchMemberData(true)
      setIsInitialLoad(false)
    }
  }, [isInitialLoad])

  const handleRoll = async () => {
    if (!canRoll) return

    try {
      const result = await window.electronAPI.rollLoot()
      if (result) {
        addToast(`You rolled: ${result.item}!`, 'success')
        fetchMemberData(true)
      }
    } catch (error) {
      console.error('[ERROR] Failed to roll:', error)
      if (error.message?.includes('rolled')) {
        addToast(error.message, 'info')
        fetchMemberData(true)
      } else {
        addToast('Failed to roll for loot', 'error')
      }
    }
  }

  // Update countdown timer every second
  useEffect(() => {
    if (!lastRollTime) return

    const updateTimer = () => {
      const now = new Date()
      const hoursSinceLastRoll = (now - lastRollTime) / (1000 * 60 * 60)
      const hoursRemaining = Math.max(0, Math.ceil(24 - hoursSinceLastRoll))
      setTimeUntilRoll(hoursRemaining)
      setCanRoll(hoursSinceLastRoll >= 24)
    }

    updateTimer() // Initial update
    const timer = setInterval(updateTimer, 1000)

    return () => clearInterval(timer)
  }, [lastRollTime])

  // Add countdown timer for refresh button
  useEffect(() => {
    if (Date.now() >= cooldownEndTime) {
      setRefreshCountdown(0)
      return
    }

    const updateCountdown = () => {
      const remaining = Math.ceil((cooldownEndTime - Date.now()) / 1000)
      setRefreshCountdown(remaining > 0 ? remaining : 0)
    }

    updateCountdown() // Initial update
    const timer = setInterval(updateCountdown, 50) // Update more frequently for smoother countdown

    return () => clearInterval(timer)
  }, [cooldownEndTime])

  // Simulate minimum load time for smooth transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Add this function near the top of the AppContent component
  const handleForumLinkClick = (url, isShiftClick = false) => {
    if (isShiftClick) {
      setIsForumModalOpen(true)
      return
    }

    // Always open in the app now
    setIsForumFullView(true)
  }

  // Check if API key is set
  useEffect(() => {
    const apiKey = window.electronAPI.getApiKey()
    setHasApiKey(!!apiKey)
  }, [])

  // Add API error listener
  useEffect(() => {
    // Set up event listener for API errors
    const handleApiError = (event, error) => {
      console.error('[API ERROR]', error)
      
      if (error.includes('API key not found') || error.includes('Invalid API key')) {
        setHasApiKey(false)
        addToast('API key issue detected. Please re-enter your API key.', 'error')
      }
    }
    
    // Register the event listener if electronAPI is available
    if (window.electronAPI && window.electronAPI.onApiError) {
      window.electronAPI.onApiError(handleApiError)
    }
    
    // Clean up the listener when component unmounts
    return () => {
      if (window.electronAPI && window.electronAPI.removeApiErrorListener) {
        window.electronAPI.removeApiErrorListener(handleApiError)
      }
    }
  }, [addToast])

  // Render the main app content
  return (
    <div className="flex flex-col h-screen bg-light-200 dark:bg-dark-300 text-gray-800 dark:text-gray-200">
      {/* API Key Setup Screen */}
      {!hasApiKey ? (
        <div className="flex items-center justify-center h-screen bg-light-200 dark:bg-dark-300">
          <div className="w-full max-w-md px-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 text-center"
            >
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">Welcome to Constelia Comet</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Please set up your API key to continue
              </p>
            </motion.div>
            <ApiKeySetup onKeySet={handleApiKeySet} />
          </div>
        </div>
      ) : (
        // Existing app content
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="h-full bg-light-200 dark:bg-dark-400"
        >
          {/* Fixed Title Bar */}
          <div className="fixed top-0 left-0 right-0 h-8 bg-light-300 dark:bg-dark-300 flex items-center justify-between px-4 select-none drag z-50">
            <div className="text-gray-600 dark:text-gray-400 text-sm">Fantasy.Comet</div>
            <div className="flex items-center space-x-2 no-drag">
              <motion.button
                whileHover={{ backgroundColor: '#2c2e33' }}
                onClick={() => handleWindowControl('minimize')}
                className="p-1 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <MinusIcon className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ backgroundColor: '#2c2e33' }}
                onClick={() => handleWindowControl('maximize')}
                className="p-1 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <ArrowsPointingOutIcon className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ backgroundColor: '#e53935' }}
                onClick={() => handleWindowControl('close')}
                className="p-1 rounded-md text-gray-600 dark:text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Main Content with top padding for title bar */}
          <div className="flex flex-1 pt-8">
            {/* Sidebar */}
            <motion.div 
              initial={{ 
                width: isSidebarCollapsed ? '64px' : '256px',
                x: 0
              }}
              animate={{ 
                x: 0,
                width: isSidebarCollapsed ? '64px' : '256px',
                transition: { 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30 
                }
              }}
              className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-light-100 dark:bg-dark-200 shadow-xl z-10 h-[calc(100vh-2rem)] flex flex-col transition-all duration-300`}
            >
              <div className={`${isSidebarCollapsed ? 'p-3' : 'p-6'} transition-all duration-300`}>
                <AnimatePresence mode="wait">
                  {!isSidebarCollapsed && (
                    <motion.h1 
                      initial={{ opacity: 1, x: 0 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2, delay: 0.15 }}
                      className="text-2xl font-bold text-primary"
                    >
                      {tabTitles[selectedTab]}
                    </motion.h1>
                  )}
                </AnimatePresence>
              </div>
              <nav className={`mt-6 ${isSidebarCollapsed ? 'px-1' : 'px-2'} flex-1 transition-all duration-300`}>
                {[
                  { name: 'Dashboard', icon: ChartBarIcon, id: 'dashboard' },
                  { name: 'Software', icon: UserGroupIcon, id: 'Software' },
                  { name: 'Forum', icon: ChatBubbleLeftIcon, id: 'Forum' },
                  { name: 'Settings', icon: CogIcon, id: 'settings' }
                ].map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-start'} ${isSidebarCollapsed ? 'px-2' : 'px-4'} py-3 mb-2 rounded-lg text-left transition-all duration-300 ${
                      selectedTab === item.id 
                        ? 'bg-primary text-dark-400 shadow-md' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-light-200 dark:hover:bg-dark-100'
                    }`}
                  >
                    <motion.div
                      animate={{ 
                        rotate: isSidebarCollapsed && selectedTab === item.id ? [0, -10, 10, -5, 5, 0] : 0 
                      }}
                      transition={{ duration: 0.5, type: "spring" }}
                    >
                      <item.icon className={`w-5 h-5 ${isSidebarCollapsed ? '' : 'mr-3'}`} />
                    </motion.div>
                    <AnimatePresence mode="wait">
                      {!isSidebarCollapsed && (
                        <motion.span
                          initial={{ opacity: 1, width: "auto" }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2, delay: 0.15 }}
                          className="whitespace-nowrap overflow-hidden"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
              </nav>
              
              {/* Forum Button at bottom of sidebar */}
              <div className={`${isSidebarCollapsed ? 'p-2' : 'p-4'} border-t border-light-300 dark:border-dark-100 transition-all duration-300`}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsForumFullView(true)}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-center'} ${isSidebarCollapsed ? 'px-2' : 'px-4'} py-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-300`}
                >
                  <ChatBubbleLeftIcon className={`w-5 h-5 ${isSidebarCollapsed ? '' : 'mr-2'}`} />
                  <AnimatePresence mode="wait">
                    {!isSidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 1, width: "auto" }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2, delay: 0.15 }}
                        className="whitespace-nowrap overflow-hidden"
                      >
                        Open Forum
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </motion.div>

            {/* Main content area */}
            <div className="flex-1 flex flex-col overflow-hidden h-[calc(100vh-2rem)]">
              {/* Header */}
              <div className="h-14 bg-light-100 dark:bg-dark-200 shadow-sm flex items-center justify-between px-8 z-10">
                <div className="flex items-center">
                  {/* Sidebar toggle button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleSidebar}
                    className="p-2 mr-4 rounded-full hover:bg-light-200 dark:hover:bg-dark-100 transition-colors duration-200"
                    title="Toggle Sidebar (Ctrl+S)"
                  >
                    <motion.div
                      animate={{ 
                        rotate: isSidebarCollapsed ? 180 : 0 
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </motion.div>
                  </motion.button>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Welcome back, {memberInfo?.username || systemInfo?.username || 'User'}!
                  </h2>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Refresh Button with Timer */}
                  <div className="relative group">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={isRefreshing || refreshCountdown > 0}
                      onClick={handleManualRefresh}
                      className="p-2 rounded-full hover:bg-light-200 dark:hover:bg-dark-100 transition-colors duration-200 relative disabled:opacity-50"
                    >
                      <ArrowPathIcon 
                        className={`w-6 h-6 text-gray-600 dark:text-gray-400 transition-all duration-700 
                          ${isRefreshing ? 'rotate-180' : ''} 
                          ${refreshCountdown > 0 ? 'opacity-50' : ''}`} 
                      />
                      {refreshCountdown > 0 && (
                        <div className="absolute -bottom-1 -right-1 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {refreshCountdown}
                        </div>
                      )}
                    </motion.button>
                    {/* Tooltip showing next auto-refresh */}
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      <div className="bg-dark-200 text-gray-400 text-xs py-1 px-2 rounded">
                        Auto refresh in {formatTimeRemaining(nextRefreshTime)}
                      </div>
                    </div>
                  </div>

                  {/* Messages Button */}
                  {unreadMessages > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 rounded-full hover:bg-light-200 dark:hover:bg-dark-100 transition-colors duration-200 relative"
                      onClick={(e) => handleForumLinkClick('https://constelia.ai/forums/index.php?direct-messages/', e.shiftKey)}
                    >
                      <EnvelopeIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadMessages}
                      </span>
                    </motion.button>
                  )}
                  
                  {/* Notifications Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-full hover:bg-light-200 dark:hover:bg-dark-100 transition-colors duration-200 relative"
                    onClick={() => setIsNotificationDrawerOpen(true)}
                  >
                    <BellIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    {alerts.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {alerts.length}
                      </span>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Content area */}
              <div ref={contentRef} className="flex-1 p-6 pb-12 overflow-y-auto">
                {isLoading ? (
                  <div className="w-full p-4 space-y-4">
                    <div className="flex space-x-4">
                      <Skeleton className="w-64 h-32" />
                      <Skeleton className="flex-1 h-32" />
                    </div>
                    <Skeleton className="w-full h-64" />
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-48" />
                      <Skeleton className="h-48" />
                    </div>
                  </div>
                ) : (
                  <ForumContext.Provider value={{ scrollRef: { smoothScrollToElement } }}>
                    {renderContent()}
                  </ForumContext.Provider>
                )}
              </div>
            </div>
          </div>

          {/* Notification Drawer */}
          <NotificationDrawer 
            isOpen={isNotificationDrawerOpen}
            onClose={() => setIsNotificationDrawerOpen(false)}
            alerts={alerts}
          />

          {/* Forum Modal */}
          <AnimatePresence>
            {isForumModalOpen && (
              <ForumWebView 
                isOpen={isForumModalOpen} 
                onClose={() => setIsForumModalOpen(false)}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}

// Main App component with providers
function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App 