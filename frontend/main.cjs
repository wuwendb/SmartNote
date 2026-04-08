const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess = null;
const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

function createBackendServer() {
  if (isDev) {
    backendProcess = spawn('uv', ['run', 'python', 'main.py'], {
      cwd: path.join(__dirname, '..', 'backend'),
      shell: true
    });
  } else {
    const backendExe = path.join(process.resourcesPath, 'backend.exe');
    backendProcess = spawn(backendExe, [], { shell: false });
  }

  backendProcess.stdout.on('data', (data) => console.log(`backend: ${data}`));
  backendProcess.stderr.on('data', (data) => console.error(`backend err: ${data}`));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createBackendServer();
  // Give the backend a second to bind
  setTimeout(createWindow, 1500);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
