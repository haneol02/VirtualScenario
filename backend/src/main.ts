// @ts-ignore - electron is in devDependencies for electron-builder
import { app, BrowserWindow, Menu, shell } from 'electron';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

const isDev = process.env.NODE_ENV === 'development';
const FRONTEND_PORT = 3000;
const BACKEND_PORT = 3001;

function startExpressServer() {
  console.log('[Electron] Starting Express server...');

  if (isDev) {
    // Development mode: use tsx to run TypeScript directly
    serverProcess = spawn('npx', ['tsx', 'src/server.ts'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      shell: true,
    });
  } else {
    // Production mode: run compiled JavaScript
    serverProcess = spawn('node', ['dist/server.js'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      shell: true,
    });
  }

  serverProcess.on('error', (error) => {
    console.error('[Electron] Failed to start Express server:', error);
  });

  serverProcess.on('exit', (code) => {
    console.log('[Electron] Express server exited with code:', code);
  });

  console.log('[Electron] Express server started on port', BACKEND_PORT);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'VirtualScenario - 코레일 안전교육 시나리오 에디터',
    icon: path.join(__dirname, '../../assets/icon.png'),
  });

  // Load frontend
  if (isDev) {
    // Development mode: load from Vite dev server
    mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`);
    mainWindow.webContents.openDevTools();
    console.log('[Electron] Development mode: Loading from http://localhost:' + FRONTEND_PORT);
  } else {
    // Production mode: load from built files in extraResources
    const resourcesPath = (process as any).resourcesPath || path.join(__dirname, '..');
    const frontendPath = path.join(resourcesPath, 'frontend-dist', 'index.html');
    console.log('[Electron] Loading frontend from:', frontendPath);
    console.log('[Electron] Resources path:', resourcesPath);
    console.log('[Electron] File exists:', require('fs').existsSync(frontendPath));

    // List files in frontend-dist to debug
    const frontendDir = path.join(resourcesPath, 'frontend-dist');
    if (require('fs').existsSync(frontendDir)) {
      console.log('[Electron] Frontend directory contents:', require('fs').readdirSync(frontendDir));
    }

    mainWindow.loadFile(frontendPath).catch((err: Error) => {
      console.error('[Electron] Failed to load frontend:', err);
    });
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }: { url: string}) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMenu() {
  const template: any[] = [
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
  console.log('[Electron] App is ready');

  // Start Express server
  startExpressServer();

  // Wait a bit for server to start, then create window
  setTimeout(() => {
    createWindow();
    createMenu();
  }, 2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  console.log('[Electron] App is quitting');

  // Kill Express server
  if (serverProcess) {
    console.log('[Electron] Stopping Express server...');
    serverProcess.kill();
  }
});
