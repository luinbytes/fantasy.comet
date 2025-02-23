const { app, BrowserWindow, ipcMain, Notification } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')

// Config setup
const configDir = path.join(process.env.APPDATA || (process.platform === 'darwin' ? 
  path.join(os.homedir(), 'Library', 'Application Support') : 
  path.join(os.homedir(), '.config')), 'fantasy.comet')

const configPath = path.join(configDir, 'config.json')

const defaultConfig = {
  apiKey: null,
  theme: 'dark',
  notifications: true,
  autoUpdate: false,
  lastCheck: null,
  zoomLevel: 1
}

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const config = { ...defaultConfig, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) }
      return config
    }
    return defaultConfig
  } catch (error) {
    console.error('[ERROR] Failed to load config:', error)
    return defaultConfig
  }
}

// Set app name and metadata
app.name = 'Fantasy.Comet'
app.setAppUserModelId('Fantasy.Comet')

console.log('[START] Electron app starting...')

let win

function createWindow() {
  console.log('[WIN] Creating main window...')
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
      webSecurity: true
    },
    frame: false,
    backgroundColor: '#18191c'
  })

  // Set initial zoom level from config
  const config = loadConfig()
  if (config.zoomLevel) {
    console.log('[ZOOM] Setting initial zoom level:', config.zoomLevel)
    win.webContents.setZoomLevel(config.zoomLevel - 1)
  }

  console.log('[APP] Loading app content...')
  win.loadFile('dist/index.html')

  win.webContents.on('did-finish-load', () => {
    console.log('[OK] Window loaded successfully')
  })

  win.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.error('[ERROR] Window failed to load:', errorCode, errorDescription)
  })

  // Set security policies for iframes
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://youtube.com https://*.youtube.com https://*.googlevideo.com https://*.google.com https://*.gstatic.com https://*.doubleclick.net;",
          "connect-src 'self' https://constelia.ai https://api.github.com https://*.youtube.com https://*.googlevideo.com https://*.google.com https://*.gstatic.com https://*.doubleclick.net;",
          "frame-src 'self' https://www.youtube.com https://youtube.com https://*.youtube.com https://youtube-nocookie.com;",
          "img-src 'self' https://constelia.ai data: https: blob:;",
          "media-src 'self' https://www.youtube.com https://youtube.com https://*.youtube.com https://*.googlevideo.com blob:;",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://*.youtube.com https://*.google.com https://*.gstatic.com https://*.doubleclick.net;",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
          "font-src 'self' https://fonts.gstatic.com;",
          "child-src 'self' https://www.youtube.com https://youtube.com https://*.youtube.com blob:;"
        ].join('; ')
      }
    })
  })

  // Enable remote content
  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const url = webContents.getURL()
    if (permission === 'media' || url.includes('youtube.com') || url.includes('youtube-nocookie.com')) {
      callback(true)
    } else {
      callback(false)
    }
  })
}

app.whenReady().then(() => {
  console.log('[OK] App is ready')
  createWindow()

  app.on('activate', () => {
    console.log('[APP] Activating app...')
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Handle window control events
ipcMain.on('window-control', (_, action) => {
  console.log('[CONTROL] Window action received:', action)
  if (!win) {
    console.error('[ERROR] Window not found')
    return
  }

  try {
    switch (action) {
      case 'minimize':
        win.minimize()
        console.log('[OK] Window minimized')
        break
      case 'maximize':
        if (win.isMaximized()) {
          win.unmaximize()
          console.log('[OK] Window unmaximized')
        } else {
          win.maximize()
          console.log('[OK] Window maximized')
        }
        break
      case 'close':
        console.log('[APP] Closing window...')
        win.close()
        break
    }
  } catch (error) {
    console.error('[ERROR] Window control error:', error)
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
    } else {
      console.warn('[WARN] Notifications not supported on this system')
    }
  } catch (error) {
    console.error('[ERROR] Failed to show notification:', error)
  }
})

// Add this IPC handler
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

// Add zoom level handler
ipcMain.on('set-zoom', (event, direction) => {
  if (direction === 'in') {
    win.webContents.zoomIn()
  } else if (direction === 'out') {
    win.webContents.zoomOut()
  }
  // Send the new zoom level back to the renderer
  const zoomLevel = win.webContents.getZoomLevel()
  event.reply('zoom-updated', zoomLevel)
})

// Add handler to get current zoom level
ipcMain.handle('get-zoom-level', () => {
  return win.webContents.getZoomLevel()
})

app.on('window-all-closed', () => {
  console.log('[APP] All windows closed')
  if (process.platform !== 'darwin') {
    console.log('[APP] Quitting app...')
    app.quit()
  }
}) 