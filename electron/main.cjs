// Electron main process — PharmLedger desktop shell.
// Loads the local production build when packaged, or the Vite dev server in
// development. All user data is persisted client-side (IndexedDB + localStorage)
// and mirrored to %APPDATA%/pharmledger/ via the preload IPC bridge.
const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { pathToFileURL } = require("url");

const DATA_ROOT = path.join(app.getPath("userData"), "pharmledger-data");
function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
ensureDir(DATA_ROOT);

const isDev = Boolean(
  process.env.ELECTRON_START_URL || process.env.NODE_ENV === "development" || !app.isPackaged
);
const startUrl = process.env.ELECTRON_START_URL;
const distRoot = path.join(__dirname, "..", "dist");
const distClientRoot = path.join(distRoot, "client");
const distServerEntry = path.join(distRoot, "server", "server.js");

let mainWindow = null;
let productionServer = null;

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".css": "text/css",
    ".html": "text/html",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".eot": "application/vnd.ms-fontobject",
    ".map": "application/json",
  }[ext] ?? "application/octet-stream";
}

function sendStaticFile(filePath, res) {
  if (!fs.existsSync(filePath)) {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }

  const mimeType = getMimeType(filePath);
  res.writeHead(200, {
    "content-type": mimeType,
  });
  fs.createReadStream(filePath).pipe(res);
}

function probeUrl(url, timeout = 2000) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(response.statusCode < 500);
    });
    request.on("error", () => resolve(false));
    request.setTimeout(timeout, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function waitForDevServer(url, maxMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (await probeUrl(url)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

async function createProductionServer() {
  if (productionServer) return productionServer.address();
  const serverModule = await import(pathToFileURL(distServerEntry).href);
  const appHandler = serverModule.default ?? serverModule;

  productionServer = http.createServer(async (req, res) => {
    try {
      const host = req.headers.host ?? "127.0.0.1";
      const requestUrl = new URL(req.url ?? "/", `http://${host}`);
      const pathname = decodeURIComponent(requestUrl.pathname);

      if (pathname.startsWith("/assets/") || pathname === "/favicon.ico") {
        const filePath = path.join(distClientRoot, pathname);
        if (!filePath.startsWith(distClientRoot)) {
          res.statusCode = 400;
          res.end("Bad request");
          return;
        }
        sendStaticFile(filePath, res);
        return;
      }

      const headers = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (value === undefined) continue;
        headers[key] = Array.isArray(value) ? value.join(",") : value;
      }

      const request = new Request(requestUrl.toString(), {
        method: req.method,
        headers,
        body: req.method === "GET" || req.method === "HEAD" ? null : req,
      });

      const response = await appHandler.fetch(request, {}, {});
      const responseHeaders = {};
      for (const [key, value] of response.headers.entries()) {
        responseHeaders[key] = value;
      }

      res.writeHead(response.status, responseHeaders);
      if (response.body) {
        const buffer = await response.arrayBuffer();
        res.end(Buffer.from(buffer));
      } else {
        res.end();
      }
    } catch (error) {
      console.error("Production server error:", error);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  await new Promise((resolve, reject) => {
    productionServer.on("error", reject);
    productionServer.listen(0, "127.0.0.1", () => resolve());
  });

  return productionServer.address();
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    title: "PharmLedger",
    backgroundColor: "#0b0f1a",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const offlineHtml = path.join(__dirname, "offline.html");

  async function loadApp() {
    if (isDev && startUrl) {
      if (!(await waitForDevServer(startUrl))) {
        throw new Error(`Dev server never responded at ${startUrl}`);
      }
      await mainWindow.loadURL(startUrl);
      return;
    }

    if (isDev) {
      const url = "http://localhost:8080";
      if (!(await waitForDevServer(url))) {
        throw new Error(`Dev server never responded at ${url}`);
      }
      await mainWindow.loadURL(url);
      return;
    }

    try {
      const address = await createProductionServer();
      const url = `http://${address.address}:${address.port}`;
      await mainWindow.loadURL(url);
      return;
    } catch (error) {
      console.error("Failed to start local production server:", error);
    }

    mainWindow.loadFile(offlineHtml);
  }

  try {
    await loadApp();
  } catch (error) {
    console.error("Failed to load app content:", error);
    await mainWindow.loadFile(offlineHtml);
  }

  mainWindow.webContents.on("did-fail-load", (_evt, code) => {
    if ([-105, -106, -2, -109, -118].includes(code)) {
      mainWindow.loadFile(offlineHtml);
    }
  });

  // Open external links in the default browser, not inside the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ===== IPC: local file backup bridge =====

ipcMain.handle("pharmledger:data-root", () => DATA_ROOT);

ipcMain.handle("pharmledger:write-file", async (_evt, relPath, contents) => {
  const safe = path.normalize(relPath).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(DATA_ROOT, safe);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, contents, "utf8");
  return full;
});

ipcMain.handle("pharmledger:read-file", async (_evt, relPath) => {
  const safe = path.normalize(relPath).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(DATA_ROOT, safe);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, "utf8");
});

ipcMain.handle("pharmledger:export-backup", async (_evt, jsonContents) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "تصدير نسخة احتياطية",
    defaultPath: `pharmledger-backup-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (result.canceled || !result.filePath) return null;
  fs.writeFileSync(result.filePath, jsonContents, "utf8");
  return result.filePath;
});

ipcMain.handle("pharmledger:import-backup", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "استيراد نسخة احتياطية",
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return fs.readFileSync(result.filePaths[0], "utf8");
});

ipcMain.handle("pharmledger:open-data-folder", () => {
  shell.openPath(DATA_ROOT);
  return DATA_ROOT;
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
