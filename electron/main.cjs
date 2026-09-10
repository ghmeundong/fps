const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')

const isDev = !app.isPackaged

function createWindow() {
  const window = new BrowserWindow({
    fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: '#0b0e12',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  if (isDev) {
    void window.loadURL('http://localhost:5173')
  } else {
    void window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

ipcMain.on('app-quit', () => app.quit())

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
