const { contextBridge, ipcRenderer, shell, Notification } = require('electron')
const os = require('os')
const fs = require('fs')
const path = require('path')

// Config setup
const configDir = path.join(process.env.APPDATA || (process.platform === 'darwin' ? 
  path.join(os.homedir(), 'Library', 'Application Support') : 
  path.join(os.homedir(), '.config')), 'fantasy.comet')

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
    ipcRenderer.send('window-control', action)
  },

  getSystemInfo: () => {
    try {
      const platformNames = {
        'win32': 'Windows',
        'darwin': 'macOS',
        'linux': 'Linux'
      }

      return {
        platform: platformNames[os.platform()] || os.platform(),
        arch: os.arch(),
        cpus: os.cpus(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        uptime: os.uptime(),
        hostname: os.hostname(),
        username: os.userInfo().username,
        version: '1.1.0',
        osVersion: os.release()
      }
    } catch (error) {
      return null
    }
  },

  getConfig: () => {
    try {
      if (fs.existsSync(configPath)) {
        const config = { ...defaultConfig, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) }
        return config
      }
      return defaultConfig
    } catch (error) {
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

  openExternal: (url) => {
    shell.openExternal(url)
  },

  openConfigFolder: () => {
    try {
      shell.openPath(configDir)
      return true
    } catch (error) {
      return false
    }
  },

  sendNotification: (title, body) => {
    try {
      if (!title || !body) return false
      ipcRenderer.send('show-notification', { title, body })
      return true
    } catch (error) {
      return false
    }
  },

  checkForUpdates: async () => {
    try {
      const response = await fetch('https://api.github.com/repos/luinbytes/fantasy.comet/releases/latest', {
        headers: {
          'User-Agent': 'Fantasy-Comet-App'
        }
      })
      
      if (response.status === 404) {
        throw new Error('NO_RELEASES')
      }

      if (!response.ok) {
        throw new Error(`GITHUB_API_ERROR:${response.status}`)
      }

      const release = await response.json()
      
      if (!release || !release.tag_name) {
        throw new Error('INVALID_RELEASE')
      }

      const latestVersion = release.tag_name.replace('v', '')
      const currentVersion = '1.1.0'

      const current = currentVersion.split('.').map(Number)
      const latest = latestVersion.split('.').map(Number)

      const isNewer = 
        latest[0] > current[0] || 
        (latest[0] === current[0] && latest[1] > current[1]) || 
        (latest[0] === current[0] && latest[1] === current[1] && latest[2] > current[2])

      return {
        currentVersion,
        latestVersion,
        updateAvailable: isNewer,
        releaseUrl: release.html_url,
        releaseNotes: release.body,
        publishedAt: release.published_at
      }
    } catch (error) {
      throw error
    }
  },

  getMember: async (flags = '') => {
    try {
      const apiKey = systemInfo.getApiKey()
      if (!apiKey) throw new Error('API key not found')

      // Split flags and add them as separate parameters
      const flagParams = flags.split(',').join('&')
      const url = `https://constelia.ai/api.php?key=${apiKey}&cmd=getMember${flagParams ? `&${flagParams}` : ''}`
      
      console.log('[MEMBER] Fetching member data with URL:', url)
      const response = await fetch(url)
      
      if (!response.ok) {
        console.error('[MEMBER] API request failed:', response.status)
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('[MEMBER] Raw API response:', data)
      
      // Transform roll data if present
      if (data.rolls && Array.isArray(data.rolls)) {
        console.log('[MEMBER] Processing rolls:', data.rolls)
        data.rolls = data.rolls
          .slice(0, 3) // Only take the 3 most recent rolls
          .map(roll => ({
            ...roll,
            time: parseInt(roll.time || roll.timestamp),
            timestamp: parseInt(roll.time || roll.timestamp) * 1000
          }))
        console.log('[MEMBER] Processed rolls:', data.rolls)
      } else {
        console.warn('[MEMBER] No rolls data found in response')
      }

      return data
    } catch (error) {
      console.error('[MEMBER] Error fetching member data:', error)
      throw error
    }
  },

  getForumPosts: async (count = 20) => {
    try {
      const apiKey = systemInfo.getApiKey()
      if (!apiKey) throw new Error('API key not found')

      const url = `https://constelia.ai/api.php?key=${apiKey}&cmd=getForumPosts&count=${count}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const posts = await response.json()
      
      // Sort posts chronologically by post_date (oldest to newest)
      const sortedPosts = posts.sort((a, b) => parseInt(b.post_date) - parseInt(a.post_date))
      
      // Transform the data
      return sortedPosts.map(post => ({
        ...post,
        post_date: parseInt(post.post_date),
        timestamp: parseInt(post.post_date) * 1000,
        message: post.message.substring(0, 100) + (post.message.length > 100 ? '...' : '')
      }))
    } catch (error) {
      console.error('[ERROR] Failed to fetch forum posts:', error)
      throw error
    }
  },

  rollLoot: async () => {
    try {
      const apiKey = systemInfo.getApiKey()
      if (!apiKey) throw new Error('API key not found')

      const url = `https://constelia.ai/api.php?key=${apiKey}&cmd=rollLoot`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      throw error
    }
  }
}

contextBridge.exposeInMainWorld('electronAPI', systemInfo) 