const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

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
      sandbox: false
    },
    frame: false,
    backgroundColor: '#18191c'
  })

  console.log('[APP] Loading app content...')
  win.loadFile('dist/index.html')

  win.webContents.on('did-finish-load', () => {
    console.log('[OK] Window loaded successfully')
  })

  win.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.error('[ERROR] Window failed to load:', errorCode, errorDescription)
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

app.on('window-all-closed', () => {
  console.log('[APP] All windows closed')
  if (process.platform !== 'darwin') {
    console.log('[APP] Quitting app...')
    app.quit()
  }
}) 