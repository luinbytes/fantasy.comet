import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  MoonIcon, 
  BellIcon, 
  ArrowPathIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  GlobeAltIcon,
  KeyIcon,
  Bars3Icon,
  SwatchIcon
} from '@heroicons/react/24/outline'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'

function Settings() {
  const { theme, toggleTheme, colorPalette, changeColorPalette } = useTheme()
  const { addToast } = useToast()
  const [notifications, setNotifications] = useState(() => {
    const config = window.electronAPI.getConfig()
    return config.notifications
  })
  const [autoUpdate, setAutoUpdate] = useState(() => {
    const config = window.electronAPI.getConfig()
    return config.autoUpdate
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const config = window.electronAPI.getConfig()
    return config.sidebarCollapsed || false
  })
  const [apiKey, setApiKey] = useState(() => {
    return window.electronAPI.getApiKey() || ''
  })
  const [checking, setChecking] = useState(false)
  const [isValidatingApiKey, setIsValidatingApiKey] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const apiKeyInputRef = useRef(null)
  const isDarkMode = theme === 'dark'

  // Color palette options
  const colorPalettes = [
    { id: 'default', name: 'Pink (Default)', color: '#f0a5c0' },
    { id: 'blue', name: 'Blue', color: '#60a5fa' },
    { id: 'green', name: 'Green', color: '#34d399' },
    { id: 'purple', name: 'Purple', color: '#a78bfa' },
    { id: 'orange', name: 'Orange', color: '#fb923c' }
  ]

  // Function to handle mouse movement over the input
  const handleMouseMove = (e) => {
    if (!apiKeyInputRef.current) return
    
    const rect = apiKeyInputRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    setMousePosition({ x })
  }

  // Function to mask the API key with a spotlight effect
  const getMaskedApiKey = () => {
    if (!isHovering) return '•'.repeat(apiKey.length)
    
    const spotlightWidth = 40 // Width of the spotlight in pixels
    const charWidth = 8 // Approximate width of a character in pixels
    
    return apiKey.split('').map((char, index) => {
      const charPosition = index * charWidth
      const distance = Math.abs(charPosition - mousePosition.x)
      
      // Show character if it's within the spotlight radius
      if (distance < spotlightWidth / 2) {
        return char
      }
      return '•'
    }).join('')
  }

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

  const handleSidebarCollapsedChange = (collapsed) => {
    setSidebarCollapsed(collapsed)
    window.electronAPI.saveConfig({ sidebarCollapsed: collapsed })
    addToast(
      `Sidebar will be ${collapsed ? 'collapsed' : 'expanded'} on next startup`,
      'info'
    )
  }

  const handleColorPaletteChange = (paletteId) => {
    changeColorPalette(paletteId)
    const paletteName = colorPalettes.find(p => p.id === paletteId)?.name || paletteId
    addToast(`Color palette changed to ${paletteName}`, 'info')
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

  const validateApiKey = (key) => {
    // Basic validation - check if it's a non-empty string with reasonable length
    if (!key || typeof key !== 'string' || key.trim().length < 8) {
      return false
    }
    
    // Check for common API key formats (adjust based on actual format)
    // This is a simple example - modify based on the actual API key format
    const validFormat = /^[A-Za-z0-9_-]{8,}$/
    return validFormat.test(key.trim())
  }

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      addToast('Please enter an API key', 'error')
      return
    }

    // Basic format validation
    if (!validateApiKey(apiKey)) {
      addToast('Invalid API key format', 'error')
      return
    }

    setIsValidatingApiKey(true)
    
    try {
      // Save the API key
      if (window.electronAPI.saveApiKey(apiKey.trim())) {
        // Try to make a simple API call to validate the key
        try {
          await window.electronAPI.getMember('username')
          addToast('API key validated and saved successfully', 'success')
        } catch (error) {
          // If the API call fails, the key is likely invalid
          window.electronAPI.saveApiKey('') // Clear the invalid key
          setApiKey('')
          addToast('Invalid API key. Please check and try again.', 'error')
        }
      } else {
        addToast('Failed to save API key', 'error')
      }
    } catch (error) {
      addToast('An error occurred while saving the API key', 'error')
    } finally {
      setIsValidatingApiKey(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* API Key Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-light-100 dark:bg-dark-200 p-6 rounded-xl shadow-md"
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          API Key Configuration
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <KeyIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">Constelia API Key</span>
          </div>
          <div className="flex flex-col space-y-2">
            <div className="relative">
              <input
                ref={apiKeyInputRef}
                type="text"
                value={getMaskedApiKey()}
                onChange={(e) => setApiKey(e.target.value)}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                placeholder="Enter your Constelia API key"
                className="w-full px-4 py-2 bg-light-200 dark:bg-dark-300 border border-light-300 dark:border-dark-100 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isValidatingApiKey}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your API key is required to access Constelia services. You can find your key in your Constelia account settings.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveApiKey}
              className="self-end px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isValidatingApiKey}
            >
              {isValidatingApiKey ? 'Validating...' : 'Save API Key'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Theme Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-light-100 dark:bg-dark-200 p-6 rounded-xl shadow-md"
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Theme
        </h3>
        <div className="space-y-6">
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

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <SwatchIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Color Palette</span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {colorPalettes.map((palette) => (
                <div 
                  key={palette.id}
                  onClick={() => handleColorPaletteChange(palette.id)}
                  className={`flex flex-col items-center cursor-pointer transition-all duration-200 ${
                    colorPalette === palette.id 
                      ? 'transform scale-105' 
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <div 
                    className={`w-10 h-10 rounded-full mb-1 border-2 ${
                      colorPalette === palette.id 
                        ? 'border-gray-800 dark:border-white' 
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: palette.color }}
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    {palette.id === 'default' ? 'Default' : palette.name.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Select a color palette to customize the app's appearance.
            </p>
          </div>
        </div>
      </motion.div>

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

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Sidebar Collapsed</span>
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleSidebarCollapsedChange(!sidebarCollapsed)}
              onKeyDown={(e) => e.key === 'Enter' && handleSidebarCollapsedChange(!sidebarCollapsed)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                sidebarCollapsed ? 'bg-primary' : 'bg-gray-400'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                  sidebarCollapsed ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Keybinds Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-light-100 dark:bg-dark-200 p-6 rounded-xl shadow-md"
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Keyboard Shortcuts
        </h3>
        <div className="space-y-4">
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
              <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Toggle Sidebar</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Ctrl + S
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

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FolderIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Clean Config</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const result = window.electronAPI.cleanConfig();
                if (result.success) {
                  if (result.removedKeys.length > 0) {
                    addToast(`Removed ${result.removedKeys.length} deprecated settings`, 'success');
                  } else {
                    addToast('Config file is already clean', 'info');
                  }
                } else {
                  addToast(`Failed to clean config: ${result.error}`, 'error');
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-light-200 dark:bg-dark-300 text-gray-600 dark:text-gray-400 hover:bg-light-300 dark:hover:bg-dark-100"
            >
              Clean Now
            </motion.button>
          </div>

          <div className="pt-4 border-t border-light-300 dark:border-dark-100">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Version: {window.electronAPI.getSystemInfo()?.version}</p>
              <p>Build: {process.env.BUILD_DATE || new Date().toISOString().split('T')[0].replace(/-/g, '.')}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Settings 