import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';

let mainWindow: BrowserWindow | null = null;
let httpServer: any = null;

// Setup logging to file
const logFile = path.join(app.getPath('userData'), 'app.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  logStream.write(logMessage);
  console.log(message);
}

// Try to locate ffmpeg binary (prefer bundled ffmpeg-static)
function resolveFfmpegPath(): string | null {
  const staticPath = ffmpegStatic ? ffmpegStatic.replace('app.asar', 'app.asar.unpacked') : null;
  if (staticPath && fs.existsSync(staticPath)) {
    return staticPath;
  }
  // Fallback to system ffmpeg if available in PATH
  return 'ffmpeg';
}

// Convert recorded WEBM into MP4 using ffmpeg
function convertWebmToMp4(ffmpegPath: string, inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath, [
      '-y',
      '-i',
      inputPath,
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '22',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      outputPath,
    ]);

    let stderr = '';
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('error', (error) => {
      reject(error);
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
      }
    });
  });
}

function getDefaultExportFilePath() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(app.getPath('videos'), `VirtualScenario-${timestamp}.mp4`);
}

function copyFolderIfMissing(src: string, dest: string) {
  try {
    if (!fs.existsSync(src)) return;
    const srcStats = fs.statSync(src);
    if (!srcStats.isDirectory()) return;

    let copiedCount = 0;
    const copyRecursive = (from: string, to: string) => {
      if (!fs.existsSync(to)) {
        fs.mkdirSync(to, { recursive: true });
      }
      const entries = fs.readdirSync(from, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(from, entry.name);
        const destPath = path.join(to, entry.name);
        if (entry.isDirectory()) {
          copyRecursive(srcPath, destPath);
        } else if (!fs.existsSync(destPath)) {
          fs.copyFileSync(srcPath, destPath);
          copiedCount += 1;
        }
      }
    };

    copyRecursive(src, dest);
    if (copiedCount > 0) {
      log(`✅ Copied ${copiedCount} file(s) from ${src} to ${dest}`);
    } else {
      log(`ℹ️ No files copied; destination already has content: ${dest}`);
    }
  } catch (error) {
    log(`⚠️ Failed to copy initial data from ${src} to ${dest}: ${error}`);
  }
}

log('========================================');
log('Application starting...');
log(`Log file: ${logFile}`);

// Check if app is packaged (production) or running from source (development)
// TEMPORARY: Force production mode to test server startup
const isDev = false; // !app.isPackaged;
const SERVER_PORT = 3001;
const FRONTEND_PORT = 3000;

// Helper to log to renderer console
function logToRenderer(message: string) {
  if (mainWindow && mainWindow.webContents) {
    const safeMessage = message.replace(/'/g, "\\'").replace(/`/g, '\\`').replace(/\n/g, '\\n');
    mainWindow.webContents.executeJavaScript(`console.log('[Main Process] ${safeMessage}');`).catch(() => {});
  }
}

function createWindow() {
  // Prefer ICO on Windows, but gracefully fall back to PNG if ICO is missing
  const assetBase = app.isPackaged ? path.join(process.resourcesPath, 'assets') : path.join(__dirname, '../assets');
  const iconCandidates = process.platform === 'win32'
    ? [path.join(assetBase, 'Icon.ico'), path.join(assetBase, 'Icon.png')]
    : [path.join(assetBase, 'Icon.png')];
  const iconPath = iconCandidates.find(p => fs.existsSync(p));

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false, // hide native buttons, use custom titlebar
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Disable CORS for file:// protocol to access localhost
      preload: path.join(__dirname, 'preload.js'),
    },
    title: 'VirtualScenario - 코레일 안전교육 시나리오 에디터',
    icon: iconPath, // Optional: add app icon
  });

  // Load frontend
  console.log('Loading frontend...');
  console.log('app.isPackaged:', app.isPackaged);

  if (app.isPackaged) {
    // Production mode: load from built files in extraResources
    const frontendPath = path.join(process.resourcesPath, 'frontend', 'index.html');
    console.log('Loading frontend from:', frontendPath);
    mainWindow.loadFile(frontendPath);
  } else {
    // Development mode: load from Vite dev server
    console.log('Loading from dev server:', `http://localhost:${FRONTEND_PORT}`);
    mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`);
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Sync window state to renderer (for custom controls)
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window-state', { isMaximized: true });
  });
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window-state', { isMaximized: false });
  });
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('window-state', { isMaximized: mainWindow?.isMaximized() ?? false });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function startBackendServer() {
  log('========================================');
  log('🔍 Checking environment...');
  log(`isDev: ${isDev}`);
  log(`app.isPackaged: ${app.isPackaged}`);
  log(`process.defaultApp: ${process.defaultApp}`);
  log(`__dirname: ${__dirname}`);
  log('========================================');

  if (isDev) {
    // In development, assume backend is already running separately
    log(`⚠️ Development mode: Backend server should be running separately on port ${SERVER_PORT}`);
    return;
  }

  log('Starting backend server in Electron process...');

  try {
    log('[1/7] Importing modules...');
    // Import and start the Express server directly
    const express = require('express');
    const cors = require('cors');
    const fsModule = require('fs');
    log('[1/7] ✅ Modules imported');

    log('[2/7] Creating Express app...');
    const expressApp = express();
    const PORT = SERVER_PORT;
    log('[2/7] ✅ Express app created');

    // Determine base directory
    log('[3/7] Setting up directories...');
    const baseDir = path.join(app.getPath('userData'));
    const dataDir = path.join(baseDir, 'data');
    log(`Base directory: ${baseDir}`);

    // Ensure upload directories exist
    const uploadsDir = path.join(baseDir, 'uploads');
    const modelsDir = path.join(uploadsDir, 'models');
    const imagesDir = path.join(uploadsDir, 'images');

    [baseDir, dataDir, uploadsDir, modelsDir, imagesDir].forEach(dir => {
      if (!fsModule.existsSync(dir)) {
        fsModule.mkdirSync(dir, { recursive: true });
        log(`  ✅ Created directory: ${dir}`);
      }
    });
    log('[3/7] ✅ Directories ready');

    // Seed packaged data/uploads into user data on first run
    const packagedDataDir = path.join(process.resourcesPath, 'data');
    const packagedUploadsDir = path.join(process.resourcesPath, 'uploads');
    copyFolderIfMissing(packagedDataDir, dataDir);
    copyFolderIfMissing(packagedUploadsDir, uploadsDir);

    // Middleware
    log('[4/7] Setting up middleware...');
    expressApp.use(cors({ origin: true, credentials: true }));
    expressApp.use(express.json());
    expressApp.use('/uploads', express.static(uploadsDir));
    log('[4/7] ✅ Middleware configured');

    // Initialize database
    log('[5/7] Initializing database...');
    const { DatabaseManager } = require('./database');
    const dbPath = path.join(baseDir, 'data', 'scenario.db');
    const db = new DatabaseManager(dbPath);
    log('[5/7] ✅ Database initialized');

    // Routes
    log('[6/7] Setting up routes...');
    const { createProjectsRouter } = require('./routes/projects');
    const { createScenesRouter } = require('./routes/scenes');
    const { createBackgroundMapsRouter } = require('./routes/backgroundMaps');
    const { createAssetsRouter } = require('./routes/assets');

    expressApp.use('/api/projects', createProjectsRouter(db));
    expressApp.use('/api/scenes', createScenesRouter(db));
    expressApp.use('/api/background-maps', createBackgroundMapsRouter(db));
    expressApp.use('/api/assets', createAssetsRouter(db, uploadsDir));
    log('[6/7] ✅ Routes configured');

    // Health check
    expressApp.get('/api/health', (req: any, res: any) => {
      res.json({ status: 'ok', message: 'VirtualScenario Backend API' });
    });

    // Error handling
    expressApp.use((err: any, req: any, res: any, next: any) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    // Start server
    log('[7/7] Starting HTTP server...');
    httpServer = expressApp.listen(PORT, '127.0.0.1', () => {
      log('[7/7] ✅ HTTP server started');
      log('========================================');
      log(`🚀 Backend server running on http://localhost:${PORT}`);
      log('========================================');

      // Log to renderer console
      setTimeout(() => {
        logToRenderer('========================================');
        logToRenderer('🚀 Backend server is RUNNING');
        logToRenderer(`   URL: http://localhost:${PORT}`);
        logToRenderer('========================================');
      }, 2000);
    });

  } catch (error) {
    log('========================================');
    log('❌ FATAL ERROR: Failed to start backend server');
    log(`Error details: ${error}`);
    log('========================================');

    // Show error dialog to user
    if (mainWindow) {
      dialog.showErrorBox('Server Error', `Failed to start backend server:\n\n${error}`);
    }
  }
}

function stopBackendServer() {
  if (httpServer) {
    console.log('Stopping backend server...');
    httpServer.close();
    httpServer = null;
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
VirtualScenario v1.1.0

코레일 안전교육 시나리오 에디터 & 3D 시뮬레이터

문의: gksdjf051@gmail.com
            `.trim();

            if (mainWindow) {
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

// Wait for server to start (simpler version for in-process server)
function waitForServer(port: number, timeout = 5000): Promise<void> {
  return new Promise((resolve) => {
    // In-process server starts almost immediately
    setTimeout(() => {
      console.log('✅ Backend server should be ready');
      resolve();
    }, 1000);
  });
}

// App lifecycle
app.whenReady().then(async () => {
  log('🚀 Electron app is ready!');
  log('Starting initialization...');

  try {
    await startBackendServer();
    console.log('Backend server initialization complete');
  } catch (error) {
    console.error('Backend server initialization failed:', error);
  }

  if (!isDev) {
    // Wait a moment for server to be fully ready
    console.log('Waiting for server...');
    await waitForServer(SERVER_PORT);
  }

  console.log('Creating window...');
  createWindow();

  console.log('Creating menu...');
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  console.log('✅ Initialization complete!');
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

ipcMain.handle('export-video', async (_event, payload: { webmBuffer: Uint8Array }) => {
  try {
    const ffmpegPath = resolveFfmpegPath();
    if (!ffmpegPath) {
      return { canceled: false, error: 'ffmpeg 실행 파일을 찾을 수 없습니다. ffmpeg-static 또는 시스템 ffmpeg를 설치해주세요.' };
    }

    const saveOptions = {
      title: '시나리오 영상을 MP4로 저장',
      defaultPath: getDefaultExportFilePath(),
      filters: [{ name: 'MP4 비디오', extensions: ['mp4'] }],
    };
    const { canceled, filePath } = mainWindow
      ? await dialog.showSaveDialog(mainWindow, saveOptions)
      : await dialog.showSaveDialog(saveOptions);

    if (canceled || !filePath) {
      return { canceled: true };
    }

    if (!payload?.webmBuffer || payload.webmBuffer.length === 0) {
      return { canceled: false, error: '녹화 데이터가 비어 있습니다.' };
    }

    log(`🎞️ Received recorded buffer: ${payload.webmBuffer.length} bytes`);

    const tempWebmPath = path.join(app.getPath('temp'), `virtualscenario-export-${Date.now()}.webm`);
    fs.writeFileSync(tempWebmPath, Buffer.from(payload.webmBuffer));

    try {
      log(`🎬 Converting recorded WEBM to MP4 using ffmpeg at ${ffmpegPath}`);
      await convertWebmToMp4(ffmpegPath, tempWebmPath, filePath);
      log(`✅ Video exported to ${filePath}`);
      return { canceled: false, filePath };
    } catch (error) {
      const message = (error as Error).message || '알 수 없는 오류가 발생했습니다.';
      log(`❌ Failed to export video: ${message}`);
      return { canceled: false, error: message };
    } finally {
      fs.existsSync(tempWebmPath) && fs.unlink(tempWebmPath, () => {});
    }
  } catch (error) {
    const message = (error as Error).message || '알 수 없는 오류가 발생했습니다.';
    log(`❌ Export video error: ${message}`);
    return { canceled: false, error: message };
  }
});

// IPC for custom titlebar controls
ipcMain.on('window-control', (event, action: 'minimize' | 'maximize' | 'close') => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  switch (action) {
    case 'minimize':
      win.minimize();
      break;
    case 'maximize':
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
      break;
    case 'close':
      win.close();
      break;
    default:
      break;
  }
});
