import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChartBarIcon, UserGroupIcon, CogIcon, BellIcon } from '@heroicons/react/24/outline'
import { XMarkIcon, MinusIcon, ArrowsPointingOutIcon } from '@heroicons/react/20/solid'
import Settings from './components/Settings'
import Users from './components/Users'
import { ThemeProvider } from './context/ThemeContext'
import ActivityChart from './components/ActivityChart'

function App() {
  const [selectedTab, setSelectedTab] = useState('dashboard')
  const [systemInfo, setSystemInfo] = useState(null)

  useEffect(() => {
    const loadSystemInfo = () => {
      console.log('[DEBUG] Window object:', window)
      console.log('[CHECK] Checking electronAPI availability...')
      
      if (typeof window.electronAPI === 'undefined') {
        console.error('[ERROR] electronAPI is not defined')
        console.log('[DEBUG] Available window properties:', Object.keys(window))
        return
      }

      if (!window.electronAPI.getSystemInfo) {
        console.error('[ERROR] getSystemInfo is not defined')
        return
      }

      try {
        console.log('[INFO] Fetching system information...')
        const info = window.electronAPI.getSystemInfo()
        console.log('[INFO] System info received:', info)
        
        if (info) {
          setSystemInfo(info)
          console.log('[OK] System info state updated')
        } else {
          console.error('[ERROR] System info is null')
        }
      } catch (error) {
        console.error('[ERROR] System info fetch error:', error)
      }
    }

    console.log('[START] Initial system info load')
    loadSystemInfo()
    
    console.log('[TIMER] Setting up refresh interval')
    const interval = setInterval(loadSystemInfo, 5000)
    return () => {
      console.log('[CLEANUP] Removing refresh interval')
      clearInterval(interval)
    }
  }, [])

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
    users: 'User Management',
    settings: 'System Settings'
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
            {systemInfo.platform.charAt(0).toUpperCase() + systemInfo.platform.slice(1)} ({systemInfo.arch})
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

  const renderContent = () => {
    switch(selectedTab) {
      case 'settings':
        return <Settings />
      case 'users':
        return <Users systemInfo={systemInfo} />
      default:
        return (
          <div className="h-full flex flex-col gap-4">
            {/* System Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
              className="bg-light-100 dark:bg-dark-200 p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-light-300 dark:border-dark-100"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">System Information</h3>
                <span className="text-primary">⚡</span>
              </div>
              {renderSystemInfo()}
            </motion.div>

            {/* Activity Chart Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-1 min-h-0 bg-light-100 dark:bg-dark-200 p-4 rounded-xl shadow-md border border-light-300 dark:border-dark-100"
            >
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Activity Chart</h3>
              <div className="h-[calc(100%-2rem)]">
                <ActivityChart />
              </div>
            </motion.div>
          </div>
        )
    }
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-light-200 dark:bg-dark-400 transition-colors duration-200">
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
            initial={{ x: -100 }}
            animate={{ x: 0 }}
            className="w-64 bg-light-100 dark:bg-dark-200 shadow-xl z-10 h-[calc(100vh-2rem)]"
          >
            <div className="p-6">
              <h1 className="text-2xl font-bold text-primary">
                {tabTitles[selectedTab]}
              </h1>
            </div>
            <nav className="mt-6 px-2">
              {[
                { name: 'Dashboard', icon: ChartBarIcon, id: 'dashboard' },
                { name: 'Users', icon: UserGroupIcon, id: 'users' },
                { name: 'Settings', icon: CogIcon, id: 'settings' },
              ].map((item) => (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTab(item.id)}
                  className={`w-full flex items-center px-4 py-3 mb-2 rounded-lg text-left transition-colors duration-200 ease-in-out ${
                    selectedTab === item.id 
                      ? 'bg-primary text-dark-400 shadow-md' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-light-200 dark:hover:bg-dark-100'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </motion.button>
              ))}
            </nav>
          </motion.div>

          {/* Main content area */}
          <div className="flex-1 flex flex-col overflow-hidden h-[calc(100vh-2rem)]">
            {/* Header */}
            <div className="h-14 bg-light-100 dark:bg-dark-200 shadow-sm flex items-center justify-between px-8 z-10">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Welcome back, {systemInfo?.username || 'User'}!
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full hover:bg-light-200 dark:hover:bg-dark-100 transition-colors duration-200"
              >
                <BellIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </motion.button>
            </div>

            {/* Content area */}
            <div className="flex-1 p-6 overflow-hidden">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App 