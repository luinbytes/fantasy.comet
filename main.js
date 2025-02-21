const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

let win

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    frame: false,
    backgroundColor: '#18191c'
  })

  win.loadFile('dist/index.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.on('window-control', (_, action) => {
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
}) 