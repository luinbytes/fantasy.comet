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
        version: '1.2.0',
        osVersion: os.release()
      }
    } catch (error) {
      console.error('[ERROR] Failed to get system info:', error)
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
      const currentVersion = '1.2.0'

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

      // Ensure count is between 0 and 20
      const validCount = Math.min(Math.max(0, count), 20)

      const url = `https://constelia.ai/api.php?key=${apiKey}&cmd=getForumPosts&count=${validCount}`
      console.log('[API] Fetching forum posts:', url)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const posts = await response.json()
      console.log('[API] Raw forum posts:', posts)
      
      // Sort posts chronologically by date (newest to oldest)
      const sortedPosts = posts.sort((a, b) => {
        // Remove any quotes and parse as integers
        const dateA = parseInt(String(b.post_date).replace(/"/g, ''))
        const dateB = parseInt(String(a.post_date).replace(/"/g, ''))
        return dateA - dateB
      })
      
      console.log('[API] Sorted posts:', sortedPosts)
      
      // Transform the data with correct field names from API
      const transformedPosts = sortedPosts.map(post => {
        // Remove any quotes and parse as integer
        const timestamp = parseInt(String(post.post_date).replace(/"/g, ''))
        const milliseconds = timestamp * 1000
        const dateObj = new Date(milliseconds)
        
        console.log('[API] Processing post:', {
          id: post.id,
          original_date: post.post_date,
          cleaned_date: String(post.post_date).replace(/"/g, ''),
          parsed_timestamp: timestamp,
          milliseconds,
          date_object: dateObj,
          formatted: dateObj.toLocaleString()
        })
        
        return {
          id: post.id,
          thread_id: post.thread_id,
          thread_title: post.title,
          username: post.username,
          post_date: timestamp,
          message: post.message,
          elapsed: post.elapsed,
          thread_url: `https://constelia.ai/forums/index.php?threads/${post.thread_id}`,
          formatted_date: dateObj.toLocaleString()
        }
      })

      console.log('[API] Transformed posts:', transformedPosts)
      return transformedPosts
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
  },

  software: {
    getAllSoftware: async () => {
      try {
        const apiKey = systemInfo.getApiKey()
        if (!apiKey) throw new Error('API key not found')

        const url = `https://constelia.ai/api.php?key=${apiKey}&cmd=getAllSoftware`
        console.log('[SOFTWARE] Fetching software list...')
        
        const response = await fetch(url)
        if (!response.ok) {
          console.error('[SOFTWARE] API request failed:', response.status)
          throw new Error(`API request failed: ${response.status}`)
        }

        const data = await response.json()
        console.log('[SOFTWARE] API Response:', data) // This will show us the data structure
        return data
      } catch (error) {
        console.error('[SOFTWARE] Error fetching software list:', error)
        throw error
      }
    },
    
    getSoftware: async (name, flags = '') => {
      try {
        const apiKey = systemInfo.getApiKey()
        if (!apiKey) throw new Error('API key not found')

        // Add flags as parameters
        const flagParams = flags ? `&${flags}` : ''
        const url = `https://constelia.ai/api.php?key=${apiKey}&cmd=getSoftware&name=${name}${flagParams}`
        
        console.log('[SOFTWARE] Fetching software details:', name)
        const response = await fetch(url)
        
        if (!response.ok) {
          console.error('[SOFTWARE] API request failed:', response.status)
          throw new Error(`API request failed: ${response.status}`)
        }

        const data = await response.json()
        console.log('[SOFTWARE] API Response:', data)
        return data
      } catch (error) {
        console.error('[SOFTWARE] Error fetching software details:', error)
        throw error
      }
    }
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  // System methods
  getSystemInfo: systemInfo.getSystemInfo,
  windowControl: systemInfo.windowControl,
  getConfig: systemInfo.getConfig,
  saveConfig: systemInfo.saveConfig,
  getApiKey: systemInfo.getApiKey,
  saveApiKey: systemInfo.saveApiKey,
  openExternal: systemInfo.openExternal,
  openConfigFolder: systemInfo.openConfigFolder,
  sendNotification: systemInfo.sendNotification,
  checkForUpdates: systemInfo.checkForUpdates,

  // Software methods
  getAllSoftware: systemInfo.software.getAllSoftware,
  getSoftware: systemInfo.software.getSoftware,

  // Member methods
  getMember: systemInfo.getMember,
  getForumPosts: systemInfo.getForumPosts,
  rollLoot: systemInfo.rollLoot,
}) 