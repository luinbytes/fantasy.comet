import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  MoonIcon, 
  BellIcon, 
  ArrowPathIcon,
  FolderIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'

function Settings() {
  const { theme, toggleTheme } = useTheme()
  const { addToast } = useToast()
  const [notifications, setNotifications] = useState(() => {
    const config = window.electronAPI.getConfig()
    return config.notifications
  })
  const [autoUpdate, setAutoUpdate] = useState(() => {
    const config = window.electronAPI.getConfig()
    return config.autoUpdate
  })
  const [checking, setChecking] = useState(false)
  const isDarkMode = theme === 'dark'

  const handleNotificationsChange = (enabled) => {
    setNotifications(enabled)
    window.electronAPI.saveConfig({ notifications: enabled })
    addToast(
      `Desktop notifications ${enabled ? 'enabled' : 'disabled'}`,
      'info'
    )
  }

  const handleAutoUpdateChange = (enabled) => {
    setAutoUpdate(enabled)
    window.electronAPI.saveConfig({ autoUpdate: enabled })
    if (enabled) {
      addToast('Auto updates enabled - checking for updates...', 'info')
      // Trigger an immediate update check when enabling
      handleCheckUpdate(true)
    } else {
      addToast('Auto updates disabled - use Check Now button to check manually', 'info')
    }
  }

  const handleOpenConfigFolder = () => {
    if (window.electronAPI.openConfigFolder()) {
      addToast('Config folder opened', 'success')
    } else {
      addToast('Failed to open config folder', 'error')
    }
  }

  const handleCheckUpdate = async (silent = false) => {
    if (checking) return
    
    setChecking(true)
    if (!silent) {
      addToast('Checking for updates...', 'info')
    }

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
      console.error('Update check failed:', error)
      
      // Only show error toasts for manual checks
      if (!silent) {
        // Handle specific error cases
        switch(error.message) {
          case 'NO_RELEASES':
            addToast('No releases found on GitHub', 'error')
            break
          case 'INVALID_RELEASE':
            addToast('Invalid release information received', 'error')
            break
          case error.message.startsWith('GITHUB_API_ERROR:') && error.message:
            const status = error.message.split(':')[1]
            addToast(`GitHub API error (${status}). Try again later.`, 'error')
            break
          default:
            addToast('Failed to check for updates. Check your connection.', 'error')
        }
      }
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-light-100 dark:bg-dark-200 p-6 rounded-xl shadow-md"
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          General Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MoonIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Dark Mode</span>
            </div>
            <div 
              role="button"
              tabIndex={0}
              onClick={toggleTheme}
              onKeyDown={(e) => e.key === 'Enter' && toggleTheme()}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                isDarkMode ? 'bg-primary' : 'bg-gray-400'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Window Zoom</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Use Ctrl - or Ctrl Shift + to adjust
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BellIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Desktop Notifications</span>
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleNotificationsChange(!notifications)}
              onKeyDown={(e) => e.key === 'Enter' && handleNotificationsChange(!notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                notifications ? 'bg-primary' : 'bg-gray-400'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                  notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ArrowPathIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Auto Updates</span>
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleAutoUpdateChange(!autoUpdate)}
              onKeyDown={(e) => e.key === 'Enter' && handleAutoUpdateChange(!autoUpdate)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                autoUpdate ? 'bg-primary' : 'bg-gray-400'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                  autoUpdate ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* System & Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-light-100 dark:bg-dark-200 p-6 rounded-xl shadow-md"
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          System & Info
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FolderIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Config Location</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenConfigFolder}
              className="px-3 py-1.5 rounded-lg bg-light-200 dark:bg-dark-300 text-gray-600 dark:text-gray-400 hover:bg-light-300 dark:hover:bg-dark-100"
            >
              Open Folder
            </motion.button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ArrowPathIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Check for Updates</span>
            </div>
            <button
              onClick={() => handleCheckUpdate(false)}
              disabled={checking}
              className="px-3 py-1.5 rounded-lg bg-light-200 dark:bg-dark-300 text-gray-600 dark:text-gray-400 hover:bg-light-300 dark:hover:bg-dark-100"
            >
              {checking ? 'Checking...' : 'Check Now'}
            </button>
          </div>

          <div className="pt-4 border-t border-light-300 dark:border-dark-100">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Version: {window.electronAPI.getSystemInfo()?.version || '1.3.0'}</p>
              <p>Build: 2024.01</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Settings 