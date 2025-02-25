const { contextBridge, ipcRenderer, shell, Notification } = require('electron')
const os = require('os')
const fs = require('fs')
const path = require('path')
const { version } = require('./package.json')

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
  colorPalette: 'default',
  notifications: true,
  autoUpdate: false,
  lastCheck: null,
  sidebarCollapsed: false,
  smoothScrolling: true,
  smoothScrollingSpeed: 0.6
}

// Clean config file on startup to remove deprecated settings
const cleanConfigFile = () => {
  try {
    if (fs.existsSync(configPath)) {
      const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      
      // Filter out any keys that aren't in defaultConfig
      const filteredConfig = {}
      let configChanged = false
      
      // Only keep keys that exist in defaultConfig
      Object.keys(defaultConfig).forEach(key => {
        if (key in userConfig) {
          filteredConfig[key] = userConfig[key]
        } else {
          filteredConfig[key] = defaultConfig[key]
        }
      })
      
      // Check if any keys were removed
      const removedKeys = Object.keys(userConfig).filter(key => !(key in defaultConfig))
      configChanged = removedKeys.length > 0
      
      // If config had unused keys, save the cleaned version
      if (configChanged) {
        fs.writeFileSync(configPath, JSON.stringify(filteredConfig, null, 2))
        console.log(`[CONFIG] Removed deprecated settings: ${removedKeys.join(', ')}`)
      }
    }
  } catch (error) {
    console.error(`[CONFIG] Error cleaning config file: ${error.message}`)
  }
}

// Clean config file on startup
cleanConfigFile()

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
        version: version,
        osVersion: os.release()
      }
    } catch (error) {
      console.error(`[SYSTEM] Failed to get system info: ${error.message}`)
      return null
    }
  },

  getConfig: () => {
    try {
      if (fs.existsSync(configPath)) {
        const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))
        
        // Filter out any keys that aren't in defaultConfig
        const filteredConfig = {}
        
        // Only keep keys that exist in defaultConfig
        Object.keys(defaultConfig).forEach(key => {
          if (key in userConfig) {
            filteredConfig[key] = userConfig[key]
          } else {
            filteredConfig[key] = defaultConfig[key]
          }
        })
        
        return filteredConfig
      }
      return defaultConfig
    } catch (error) {
      console.error(`[CONFIG] Error reading config: ${error.message}`)
      return defaultConfig
    }
  },

  saveConfig: (updates) => {
    try {
      const currentConfig = systemInfo.getConfig()
      const newConfig = { ...currentConfig }
      
      // Only update keys that exist in defaultConfig
      Object.keys(updates).forEach(key => {
        if (key in defaultConfig) {
          newConfig[key] = updates[key]
        } else {
          console.log(`[CONFIG] Ignoring unknown config key: ${key}`)
        }
      })
      
      fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2))
      return true
    } catch (error) {
      console.error(`[CONFIG] Error saving config: ${error.message}`)
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
    // Check if the URL is from a media site that should be opened in a modal
    const isMediaSite = 
      url.includes('imgur.com') || 
      url.includes('youtube.com') || 
      url.includes('youtu.be') ||
      url.includes('i.redd.it') ||
      url.includes('v.redd.it') ||
      url.includes('gfycat.com') ||
      url.includes('giphy.com');
    
    if (isMediaSite) {
      // Send a message to the renderer to open the URL in a modal
      ipcRenderer.send('open-external-modal', url);
    } else {
      // For non-media sites, use the default external browser
      shell.openExternal(url);
    }
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
      const currentVersion = version

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

      const flagParams = flags.split(',').join('&')
      const url = `https://constelia.ai/api.php?key=${apiKey}&cmd=getMember${flagParams ? `&${flagParams}` : ''}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.rolls && Array.isArray(data.rolls)) {
        data.rolls = data.rolls
          .slice(0, 3)
          .map(roll => ({
            ...roll,
            time: parseInt(roll.time || roll.timestamp),
            timestamp: parseInt(roll.time || roll.timestamp) * 1000
          }))
      }

      return data
    } catch (error) {
      console.error(`[MEMBER] ${error.message}`)
      throw error
    }
  },

  getForumPosts: async (count = 20) => {
    try {
      const apiKey = systemInfo.getApiKey()
      if (!apiKey) throw new Error('API key not found')

      const validCount = Math.min(Math.max(0, count), 20)
      const url = `https://constelia.ai/api.php?key=${apiKey}&cmd=getForumPosts&count=${validCount}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const posts = await response.json()
      
      const sortedPosts = posts.sort((a, b) => {
        const dateA = parseInt(String(b.post_date).replace(/"/g, ''))
        const dateB = parseInt(String(a.post_date).replace(/"/g, ''))
        return dateA - dateB
      })
      
      return sortedPosts.map(post => {
        const timestamp = parseInt(String(post.post_date).replace(/"/g, ''))
        const milliseconds = timestamp * 1000
        const dateObj = new Date(milliseconds)
        
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
    } catch (error) {
      console.error(`[FORUM] ${error.message}`)
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
        
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`)
        }

        return await response.json()
      } catch (error) {
        console.error('[ERROR] Failed to fetch software list:', error)
        throw error
      }
    },
    
    getSoftware: async (name, flags = '') => {
      try {
        const apiKey = systemInfo.getApiKey()
        if (!apiKey) throw new Error('API key not found')

        const flagParams = flags ? `&${flags}` : ''
        const url = `https://constelia.ai/api.php?key=${apiKey}&cmd=getSoftware&name=${name}${flagParams}`
        
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`)
        }

        return await response.json()
      } catch (error) {
        console.error('[ERROR] Failed to fetch software details:', error)
        throw error
      }
    }
  },

  cleanConfig: () => {
    try {
      if (fs.existsSync(configPath)) {
        const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))
        
        // Filter out any keys that aren't in defaultConfig
        const filteredConfig = {}
        
        // Only keep keys that exist in defaultConfig
        Object.keys(defaultConfig).forEach(key => {
          if (key in userConfig) {
            filteredConfig[key] = userConfig[key]
          } else {
            filteredConfig[key] = defaultConfig[key]
          }
        })
        
        // Check if any keys were removed
        const removedKeys = Object.keys(userConfig).filter(key => !(key in defaultConfig))
        const configChanged = removedKeys.length > 0
        
        // If config had unused keys, save the cleaned version
        if (configChanged) {
          fs.writeFileSync(configPath, JSON.stringify(filteredConfig, null, 2))
          console.log(`[CONFIG] Removed deprecated settings: ${removedKeys.join(', ')}`)
          return {
            success: true,
            removedKeys: removedKeys
          }
        }
        
        return { success: true, removedKeys: [] }
      }
      return { success: true, removedKeys: [] }
    } catch (error) {
      console.error(`[CONFIG] Error cleaning config file: ${error.message}`)
      return { success: false, error: error.message }
    }
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  // System methods
  getSystemInfo: systemInfo.getSystemInfo,
  windowControl: systemInfo.windowControl,
  getConfig: systemInfo.getConfig,
  saveConfig: systemInfo.saveConfig,
  cleanConfig: systemInfo.cleanConfig,
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
  
  // IPC for external modal
  ipcRenderer: {
    on: (channel, func) => {
      if (channel === 'open-external-modal') {
        ipcRenderer.on(channel, func)
      }
    },
    removeListener: (channel, func) => {
      if (channel === 'open-external-modal') {
        ipcRenderer.removeListener(channel, func)
      }
    }
  }
}) 