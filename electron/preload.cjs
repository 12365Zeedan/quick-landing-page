// Preload script — exposes a narrow, safe API to the renderer (web app).
// The renderer can detect Electron via `window.pharmledger` and use it to
// mirror localStorage to disk and trigger manual backup export/import.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pharmledger", {
  isDesktop: true,
  dataRoot: () => ipcRenderer.invoke("pharmledger:data-root"),
  writeFile: (relPath, contents) =>
    ipcRenderer.invoke("pharmledger:write-file", relPath, contents),
  readFile: (relPath) => ipcRenderer.invoke("pharmledger:read-file", relPath),
  exportBackup: (json) => ipcRenderer.invoke("pharmledger:export-backup", json),
  importBackup: () => ipcRenderer.invoke("pharmledger:import-backup"),
  openDataFolder: () => ipcRenderer.invoke("pharmledger:open-data-folder"),
});
