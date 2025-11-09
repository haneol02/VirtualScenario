import { app, BrowserWindow, Menu, shell } from 'electron';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

const isDev = process.env.NODE_ENV === 'development';
const SERVER_PORT = 3001;
const FRONTEND_PORT = 3000;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'VirtualScenario - 코레일 안전교육 시나리오 에디터',
    icon: path.join(__dirname, '../../assets/icon.png'), // Optional: add app icon
  });

  // Load frontend
  if (isDev) {
    // Development mode: load from Vite dev server
    mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`);
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode: load from built files
    const frontendPath = path.join(__dirname, '../frontend-dist/index.html');
    console.log('Loading frontend from:', frontendPath);
    console.log('File exists:', require('fs').existsSync(frontendPath));
    mainWindow.loadFile(frontendPath).catch(err => {
      console.error('Failed to load frontend:', err);
    });
    // Always open DevTools in production to debug
    mainWindow.webContents.openDevTools();
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackendServer() {
  if (isDev) {
    // In development, assume backend is already running separately
    console.log('Development mode: Backend server should be running separately on port', SERVER_PORT);
    return;
  }

  // Production mode: start backend server as child process
  const serverScript = path.join(__dirname, 'server.js');

  serverProcess = spawn('node', [serverScript], {
    env: { ...process.env, PORT: SERVER_PORT.toString() },
    stdio: 'inherit',
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start backend server:', err);
  });

  serverProcess.on('exit', (code) => {
    console.log(`Backend server exited with code ${code}`);
  });
}

function stopBackendServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

function createMenu() {
  const template: Array<Electron.MenuItemConstructorOptions> = [
    {
      label: '파일',
      submenu: [
        {
          label: '종료',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: '편집',
      submenu: [
        {
          label: '실행 취소',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo',
        },
        {
          label: '다시 실행',
          accelerator: 'CmdOrCtrl+Shift+Z',
          role: 'redo',
        },
        { type: 'separator' },
        {
          label: '잘라내기',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut',
        },
        {
          label: '복사',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy',
        },
        {
          label: '붙여넣기',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste',
        },
      ],
    },
    {
      label: '보기',
      submenu: [
        {
          label: '전체화면',
          accelerator: 'F11',
          click: () => {
            if (mainWindow) {
              mainWindow.setFullScreen(!mainWindow.isFullScreen());
            }
          },
        },
        {
          label: '새로고침',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow) {
              mainWindow.reload();
            }
          },
        },
        { type: 'separator' },
        {
          label: '개발자 도구',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools();
            }
          },
        },
      ],
    },
    {
      label: '도움말',
      submenu: [
        {
          label: 'VirtualScenario 정보',
          click: () => {
            const aboutMessage = `
VirtualScenario v0.1.0

코레일 안전교육 시나리오 에디터 & 3D 시뮬레이터

개발: 동아대학교 AI학과
            `.trim();

            if (mainWindow) {
              const { dialog } = require('electron');
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'VirtualScenario 정보',
                message: aboutMessage,
                buttons: ['확인'],
              });
            }
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App lifecycle
app.whenReady().then(() => {
  startBackendServer();
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopBackendServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackendServer();
});

app.on('will-quit', () => {
  stopBackendServer();
});
