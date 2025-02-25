const { app, BrowserWindow, ipcMain, Notification, session, shell, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { version } = require('./package.json')
const { autoUpdater } = require('electron-updater')

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
  forumSession.setUserAgent(`Fantasy.Comet/${version} (Electron)`)

  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      spellcheck: true,
      sandbox: false
    },
    icon: path.join(__dirname, 'assets', 'icons', process.platform === 'win32' ? 'icon.ico' : 'icon.png')
  })

  // Copy icon to dist folder for use in the app
  const iconSrc = path.join(__dirname, 'assets', 'icons', 'icon.png')
  const iconDest = path.join(__dirname, 'dist', 'assets', 'icons', 'icon.png')
  
  try {
    // Ensure the directory exists
    if (!fs.existsSync(path.join(__dirname, 'dist', 'assets', 'icons'))) {
      fs.mkdirSync(path.join(__dirname, 'dist', 'assets', 'icons'), { recursive: true })
    }
    
    // Copy the file
    fs.copyFileSync(iconSrc, iconDest)
    console.log('Icon copied successfully')
  } catch (err) {
    console.error('Error copying icon:', err)
  }

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
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://constelia.ai https://www.youtube.com https://youtube.com https://*.youtube.com https://*.googlevideo.com https://*.google.com https://*.gstatic.com https://*.doubleclick.net https://*.imgur.com https://imgur.com https://www.googletagmanager.com https://ced.sascdn.com https://ced-ns.sascdn.com https://d3c8j8snkzfr1n.cloudfront.net https://js.assemblyexchange.com https://quicklyedit.com https://www.google-analytics.com https://btloader.com;",
          "connect-src 'self' https://constelia.ai https://api.github.com https://*.youtube.com https://*.googlevideo.com https://*.google.com https://*.gstatic.com https://*.doubleclick.net https://*.imgur.com https://imgur.com https://www.googletagmanager.com https://ced.sascdn.com https://ced-ns.sascdn.com https://d3c8j8snkzfr1n.cloudfront.net https://js.assemblyexchange.com https://quicklyedit.com https://www.google-analytics.com https://btloader.com;",
          "frame-src 'self' https://constelia.ai https://www.youtube.com https://youtube.com https://*.youtube.com https://youtube-nocookie.com https://*.imgur.com https://imgur.com;",
          "img-src 'self' https://constelia.ai data: https: blob:;",
          "media-src 'self' https://www.youtube.com https://youtube.com https://*.youtube.com https://*.googlevideo.com https://*.imgur.com https://imgur.com blob:;",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://constelia.ai https://www.youtube.com https://*.youtube.com https://*.google.com https://*.gstatic.com https://*.doubleclick.net https://*.imgur.com https://imgur.com https://www.googletagmanager.com https://ced.sascdn.com https://ced-ns.sascdn.com https://d3c8j8snkzfr1n.cloudfront.net https://js.assemblyexchange.com https://quicklyedit.com https://www.google-analytics.com https://btloader.com;",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://constelia.ai https://*.imgur.com https://imgur.com;",
          "font-src 'self' https://fonts.gstatic.com https://constelia.ai https://*.imgur.com https://imgur.com;",
          "child-src 'self' https://constelia.ai https://www.youtube.com https://youtube.com https://*.youtube.com https://*.imgur.com https://imgur.com blob:;"
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
        icon: path.join(__dirname, 'assets', 'icons', 'icon.png'),
        silent: false,
        appName: app.name
      }).show()
    }
  } catch (error) {
    console.error(`[ERROR] Failed to show notification: ${error.message}`)
  }
})

// Handle external modal requests
ipcMain.on('open-external-modal', (_, url) => {
  if (!win) return
  
  try {
    // Forward the message to the renderer process
    win.webContents.send('open-external-modal', url)
  } catch (error) {
    console.error(`[ERROR] Failed to open external modal: ${error.message}`)
    // Fallback to opening in external browser if modal fails
    shell.openExternal(url)
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