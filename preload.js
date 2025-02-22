const { contextBridge, ipcRenderer, shell, Notification } = require('electron')
const os = require('os')
const fs = require('fs')
const path = require('path')

console.log('[START] Preload script starting...')

// Test OS module
try {
  console.log('[TEST] Testing OS module access...')
  const testInfo = {
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    version: os.version(),
    type: os.type(),
    endianness: os.endianness(),
    hostname: os.hostname(),
    userInfo: os.userInfo().username,
    cpus: os.cpus()[0].model,
    totalMemory: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))}GB`,
    freeMemory: `${Math.round(os.freemem() / (1024 * 1024 * 1024))}GB`
  }
  console.log('[TEST] Detailed system info:', testInfo)
} catch (error) {
  console.error('[ERROR] OS module test failed:', error)
}

// Update config path to use AppData
const configDir = path.join(process.env.APPDATA || (process.platform === 'darwin' ? 
  path.join(os.homedir(), 'Library', 'Application Support') : 
  path.join(os.homedir(), '.config')), 'fantasy.comet')

// Ensure config directory exists
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true })
}

const configPath = path.join(configDir, 'config.json')

const defaultConfig = {
  apiKey: null,
  theme: 'dark',
  notifications: true,
  autoUpdate: false,
  lastCheck: null
}

const systemInfo = {
  windowControl: (action) => {
    console.log('[CONTROL] Window control requested:', action)
    ipcRenderer.send('window-control', action)
  },

  getSystemInfo: () => {
    try {
      console.log('[INFO] Fetching system information...')
      
      // Platform name mapping
      const platformNames = {
        'win32': 'Windows',
        'darwin': 'macOS',
        'linux': 'Linux'
      }

      const info = {
        platform: platformNames[os.platform()] || os.platform(),
        arch: os.arch(),
        cpus: os.cpus(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        uptime: os.uptime(),
        hostname: os.hostname(),
        username: os.userInfo().username,
        version: require('../package.json').version,
        osVersion: os.release()
      }
      console.log('[OK] System info retrieved:', info)
      return info
    } catch (error) {
      console.error('[ERROR] System info error:', error)
      return null
    }
  },

  // API Key Management
  getConfig: () => {
    try {
      if (fs.existsSync(configPath)) {
        const config = { ...defaultConfig, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) }
        return config
      }
      return defaultConfig
    } catch (error) {
      console.error('[ERROR] Failed to get config:', error)
      return defaultConfig
    }
  },

  saveConfig: (updates) => {
    try {
      const currentConfig = systemInfo.getConfig()
      const newConfig = { ...currentConfig, ...updates }
      
      fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2))
      return true
    } catch (error) {
      console.error('[ERROR] Failed to save config:', error)
      return false
    }
  },

  getApiKey: () => {
    const config = systemInfo.getConfig()
    return config.apiKey
  },

  saveApiKey: (apiKey) => {
    return systemInfo.saveConfig({ apiKey })
  },

  // Forum Posts API - Updated to match documentation exactly
  getForumPosts: async (count = 10) => {
    try {
      const apiKey = systemInfo.getApiKey()
      if (!apiKey) {
        throw new Error('API key not found')
      }

      console.log('[API] Fetching forum posts...')
      const url = `https://constelia.ai/api.php?key=${apiKey}&cmd=getForumPosts&count=${count}`
      console.log('[API] Request URL:', url)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[API] Error response:', errorText)
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('[API] Forum posts retrieved successfully')
      console.log('[API] Response data:', data)
      
      // Validate response format
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format')
      }

      return data
    } catch (error) {
      console.error('[ERROR] Failed to fetch forum posts:', error)
      return null
    }
  },

  openExternal: (url) => {
    shell.openExternal(url)
  },

  // Add to systemInfo object
  getMember: async (flags = '') => {
    try {
      const apiKey = systemInfo.getApiKey()
      if (!apiKey) {
        throw new Error('API key not found')
      }

      console.log('[API] Fetching member info with flags:', flags)
      const url = `https://constelia.ai/api.php?key=${apiKey}&cmd=getMember${flags ? `&${flags}` : ''}`
      console.log('[API] Request URL:', url)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[API] Error response:', errorText)
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('[API] Member info retrieved successfully')
      return data
    } catch (error) {
      console.error('[ERROR] Failed to fetch member info:', error)
      return null
    }
  },

  openConfigFolder: () => {
    try {
      shell.openPath(configDir)
      return true
    } catch (error) {
      console.error('[ERROR] Failed to open config folder:', error)
      return false
    }
  },

  sendNotification: (title, body) => {
    try {
      if (!title || !body) {
        throw new Error('Title and body are required for notifications')
      }

      // Send to main process to show notification
      ipcRenderer.send('show-notification', { title, body })
      return true
    } catch (error) {
      console.error('[ERROR] Failed to send notification:', error)
      return false
    }
  },

  // Add to systemInfo object
  rollLoot: async () => {
    try {
      const apiKey = systemInfo.getApiKey()
      if (!apiKey) {
        throw new Error('API key not found')
      }

      console.log('[API] Rolling for loot...')
      const url = `https://constelia.ai/api.php?key=${apiKey}&cmd=rollLoot`
      
      const response = await fetch(url)
      const data = await response.json()
      
      console.log('[API] Roll response:', data)
      
      if (data.status === 200 && data.message?.includes('rolled')) {
        throw new Error(data.message)
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[API] Error response:', errorText)
        throw new Error(`API request failed: ${response.status}`)
      }

      console.log('[API] Roll successful')
      return data
    } catch (error) {
      console.error('[ERROR] Failed to roll for loot:', error)
      throw error // Propagate the error to handle it in the component
    }
  },

  checkForUpdates: async () => {
    try {
      console.log('[UPDATE] Checking for updates...')
      const response = await fetch('https://api.github.com/repos/luinbytes/fantasy.comet/releases/latest')
      
      if (response.status === 404) {
        console.log('[UPDATE] No releases found')
        throw new Error('NO_RELEASES')
      }

      if (!response.ok) {
        console.error('[UPDATE] GitHub API error:', response.status)
        throw new Error(`GITHUB_API_ERROR:${response.status}`)
      }

      const release = await response.json()
      
      if (!release.tag_name) {
        console.error('[UPDATE] Invalid release format')
        throw new Error('INVALID_RELEASE')
      }

      const latestVersion = release.tag_name.replace('v', '')
      const currentVersion = require('../package.json').version

      console.log('[UPDATE] Current version:', currentVersion)
      console.log('[UPDATE] Latest version:', latestVersion)

      // Split versions into components
      const current = currentVersion.split('.').map(Number)
      const latest = latestVersion.split('.').map(Number)

      // Compare major, minor, and patch versions
      const isNewer = 
        latest[0] > current[0] || // Major version
        (latest[0] === current[0] && latest[1] > current[1]) || // Minor version
        (latest[0] === current[0] && latest[1] === current[1] && latest[2] > current[2]) // Patch version

      return {
        currentVersion,
        latestVersion,
        updateAvailable: isNewer,
        releaseUrl: release.html_url,
        releaseNotes: release.body,
        publishedAt: release.published_at
      }
    } catch (error) {
      console.error('[ERROR] Update check failed:', error)
      throw error
    }
  }
}

// Test the getSystemInfo function
try {
  console.log('[TEST] Testing getSystemInfo function...')
  const testResult = systemInfo.getSystemInfo()
  console.log('[TEST] getSystemInfo test result:', testResult ? 'Success' : 'Failed')
} catch (error) {
  console.error('[ERROR] getSystemInfo test failed:', error)
}

try {
  console.log('[APP] Exposing electronAPI...')
  contextBridge.exposeInMainWorld('electronAPI', systemInfo)
  console.log('[OK] electronAPI exposed successfully')
} catch (error) {
  console.error('[ERROR] API exposure error:', error)
}

// Verify exposure
setTimeout(() => {
  if (window.electronAPI) {
    console.log('[TEST] electronAPI is available in window object')
  } else {
    console.error('[ERROR] electronAPI not found in window object')
  }
}, 1000) 