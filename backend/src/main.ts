// @ts-ignore - electron is in devDependencies for electron-builder
import { app, BrowserWindow, Menu, shell } from 'electron';
import * as path from 'path';
import { DatabaseManager } from './database';
import { registerProjectsHandlers } from './ipc/projects';
import { registerScenesHandlers } from './ipc/scenes';
import { registerObjectsHandlers } from './ipc/objects';
import { registerDialoguesHandlers } from './ipc/dialogues';
import { registerBackgroundMapsHandlers } from './ipc/background-maps';
import { registerAssetsHandlers } from './ipc/assets';

let mainWindow: BrowserWindow | null = null;
let db: DatabaseManager | null = null;

const isDev = process.env.NODE_ENV === 'development';
const FRONTEND_PORT = 3000;

function initializeDatabase() {
  try {
    db = new DatabaseManager();
    console.log('[Electron] Database initialized successfully');
  } catch (error) {
    console.error('[Electron] Failed to initialize database:', error);
    throw error;
  }
}

function registerIpcHandlers() {
  if (!db) {
    throw new Error('Database not initialized');
  }

  registerProjectsHandlers(db);
  registerScenesHandlers(db);
  registerObjectsHandlers(db);
  registerDialoguesHandlers(db);
  registerBackgroundMapsHandlers(db);
  registerAssetsHandlers(db);

  console.log('[Electron] All IPC handlers registered');
}

function createWindow() {
  const preloadPath = isDev
    ? path.join(__dirname, 'preload.js')
    : path.join(__dirname, 'preload.js');

  console.log('[Electron] Preload script path:', preloadPath);
  console.log('[Electron] Preload exists:', require('fs').existsSync(preloadPath));

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
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
    // Open DevTools in production to debug
    mainWindow.webContents.openDevTools();
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

  // Initialize database and IPC handlers
  initializeDatabase();
  registerIpcHandlers();

  // Create window and menu
  createWindow();
  createMenu();

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
});
