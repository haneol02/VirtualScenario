import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  windowControl: (action: 'minimize' | 'maximize' | 'close') => {
    ipcRenderer.send('window-control', action);
  },
  onWindowState: (callback: (state: { isMaximized: boolean }) => void) => {
    const handler = (_: any, state: { isMaximized: boolean }) => callback(state);
    ipcRenderer.on('window-state', handler);
    return () => ipcRenderer.removeListener('window-state', handler);
  }
});
