const { app, BrowserWindow, ipcMain, Notification, session } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')

// Config setup
const configDir = path.join(process.env.APPDATA || (process.platform === 'darwin' ? 
  path.join(os.homedir(), 'Library', 'Application Support') : 
  path.join(os.homedir(), '.config')), 'fantasy.comet')

const configPath = path.join(configDir, 'config.json')

// Create session storage directory
const sessionDir = path.join(configDir, 'session-storage')
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true })
}

const defaultConfig = {
  apiKey: null,
  theme: 'dark',
  notifications: true,
  autoUpdate: false,
  lastCheck: null
}

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const config = { ...defaultConfig, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) }
      return config
    }
    return defaultConfig
  } catch (error) {
    return defaultConfig
  }
}

// Set app name and metadata
app.name = 'Fantasy.Comet'
app.setAppUserModelId('Fantasy.Comet')

let win

function createWindow() {
  // Set up persistent session for forum
  const forumSession = session.fromPartition('persist:forum', {
    cache: {
      directory: path.join(sessionDir, 'Cache'),
      maxSize: 50 * 1024 * 1024 // 50MB cache limit
    }
  })
  
  // Set custom user agent to avoid potential blocking
  forumSession.setUserAgent('Fantasy.Comet/1.4.0 (Electron)')

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
      webSecurity: true,
      partition: 'persist:forum',
      webviewTag: true
    },
    frame: false,
    backgroundColor: '#18191c'
  })

  // Set initial zoom level from config
  const config = loadConfig()

  win.loadFile('dist/index.html')

  win.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.error(`[ERROR] Window failed to load: ${errorCode} - ${errorDescription}`)
  })

  // Update CSP to allow forum content
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://constelia.ai https://www.youtube.com https://youtube.com https://*.youtube.com https://*.googlevideo.com https://*.google.com https://*.gstatic.com https://*.doubleclick.net;",
          "connect-src 'self' https://constelia.ai https://api.github.com https://*.youtube.com https://*.googlevideo.com https://*.google.com https://*.gstatic.com https://*.doubleclick.net;",
          "frame-src 'self' https://constelia.ai https://www.youtube.com https://youtube.com https://*.youtube.com https://youtube-nocookie.com;",
          "img-src 'self' https://constelia.ai data: https: blob:;",
          "media-src 'self' https://www.youtube.com https://youtube.com https://*.youtube.com https://*.googlevideo.com blob:;",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://constelia.ai https://www.youtube.com https://*.youtube.com https://*.google.com https://*.gstatic.com https://*.doubleclick.net;",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://constelia.ai;",
          "font-src 'self' https://fonts.gstatic.com https://constelia.ai;",
          "child-src 'self' https://constelia.ai https://www.youtube.com https://youtube.com https://*.youtube.com blob:;"
        ].join('; ')
      }
    })
  })

  // Add permission handling for the forum
  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const url = webContents.getURL()
    if (permission === 'media' || 
        url.includes('youtube.com') || 
        url.includes('youtube-nocookie.com') ||
        url.includes('constelia.ai')) {
      callback(true)
    } else {
      callback(false)
    }
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Handle window control events
ipcMain.on('window-control', (_, action) => {
  if (!win) return

  try {
    switch (action) {
      case 'minimize':
        win.minimize()
        break
      case 'maximize':
        if (win.isMaximized()) {
          win.unmaximize()
        } else {
          win.maximize()
        }
        break
      case 'close':
        win.close()
        break
    }
  } catch (error) {
    console.error(`[ERROR] Window control error: ${error.message}`)
  }
})

// Update notification handler
ipcMain.on('show-notification', (_, { title, body }) => {
  try {
    if (Notification.isSupported()) {
      new Notification({
        title: title || app.name,
        body,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        silent: false,
        appName: app.name
      }).show()
    }
  } catch (error) {
    console.error(`[ERROR] Failed to show notification: ${error.message}`)
  }
})

// Add this IPC handler
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
}) 