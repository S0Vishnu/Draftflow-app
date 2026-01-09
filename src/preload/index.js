import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  openFile: () => electronAPI.ipcRenderer.invoke('dialog:openFile'),
  openFolder: () => electronAPI.ipcRenderer.invoke('dialog:openFolder'),
  readDir: (path) => electronAPI.ipcRenderer.invoke('fs:readDir', path),
  createFolder: (path) => electronAPI.ipcRenderer.invoke('fs:createFolder', path),
  createFile: (path) => electronAPI.ipcRenderer.invoke('fs:createFile', path),
  deleteEntry: (path) => electronAPI.ipcRenderer.invoke('fs:deleteEntry', path),
  renameEntry: (oldPath, newPath) => electronAPI.ipcRenderer.invoke('fs:renameEntry', { oldPath, newPath }),
  copyEntry: (sourcePath, destPath) => electronAPI.ipcRenderer.invoke('fs:copyEntry', { sourcePath, destPath }),
  showInFolder: (path) => electronAPI.ipcRenderer.invoke('fs:showInFolder', path),
  openPath: (path) => electronAPI.ipcRenderer.invoke('fs:openPath', path),
  getStats: (path) => electronAPI.ipcRenderer.invoke('fs:getStats', path),
  watchDir: (path) => electronAPI.ipcRenderer.invoke('fs:watchDir', path),
  onFileChange: (callback) => {
    const subscription = (_event, value) => callback(value);
    electronAPI.ipcRenderer.on('fs:fileChanged', subscription);
    return () => electronAPI.ipcRenderer.removeListener('fs:fileChanged', subscription);
  },
  confirm: (options) => electronAPI.ipcRenderer.invoke('dialog:confirm', options)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
