export {};

declare global {
  interface Window {
    electronAPI?: {
      windowControl: (action: 'minimize' | 'maximize' | 'close') => void;
      onWindowState?: (callback: (state: { isMaximized: boolean }) => void) => () => void;
      exportVideo?: (webmBuffer: Uint8Array) => Promise<{
        canceled: boolean;
        filePath?: string;
        error?: string;
      }>;
    };
  }
}
