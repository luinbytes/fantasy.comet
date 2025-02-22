const { contextBridge, ipcRenderer, shell } = require('electron')
const os = require('os')
const fs = require('fs')
const path = require('path')

console.log('[START] Preload script starting...')

// Test OS module
try {
  console.log('[TEST] Testing OS module access...')
  const testInfo = {
    platform: os.platform(),
    arch: os.arch()
  }
  console.log('[TEST] OS module working:', testInfo)
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

const systemInfo = {
  windowControl: (action) => {
    console.log('[CONTROL] Window control requested:', action)
    ipcRenderer.send('window-control', action)
  },

  getSystemInfo: () => {
    try {
      console.log('[INFO] Fetching system information...')
      const info = {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        uptime: os.uptime(),
        hostname: os.hostname(),
        username: os.userInfo().username
      }
      console.log('[OK] System info retrieved:', info)
      return info
    } catch (error) {
      console.error('[ERROR] System info error:', error)
      return null
    }
  },

  // API Key Management
  saveApiKey: (key) => {
    try {
      const config = fs.existsSync(configPath) ? 
        JSON.parse(fs.readFileSync(configPath, 'utf8')) : {}
      
      config.apiKey = key
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
      return true
    } catch (error) {
      console.error('[ERROR] Failed to save API key:', error)
      return false
    }
  },

  getApiKey: () => {
    try {
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
        return config.apiKey
      }
      return null
    } catch (error) {
      console.error('[ERROR] Failed to get API key:', error)
      return null
    }
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
    if (url) {
      shell.openExternal(url)
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