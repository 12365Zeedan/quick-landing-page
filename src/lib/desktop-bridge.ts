// Bridge between the web app and the Electron preload API.
// When running in the browser, all methods are no-ops or return null.
// When running inside the Electron shell, they delegate to window.pharmledger
// which talks to the main process via IPC and reads/writes real files on disk.

declare global {
  interface Window {
    pharmledger?: {
      isDesktop: true;
      dataRoot: () => Promise<string>;
      writeFile: (relPath: string, contents: string) => Promise<string>;
      readFile: (relPath: string) => Promise<string | null>;
      exportBackup: (json: string) => Promise<string | null>;
      importBackup: () => Promise<string | null>;
      openDataFolder: () => Promise<string>;
    };
  }
}

export const isDesktop = (): boolean =>
  typeof window !== "undefined" && !!window.pharmledger?.isDesktop;

export async function mirrorToDisk(relPath: string, contents: string): Promise<void> {
  if (!isDesktop()) return;
  try {
    await window.pharmledger!.writeFile(relPath, contents);
  } catch (e) {
    console.warn("[desktop-bridge] mirrorToDisk failed", e);
  }
}

export async function readFromDisk(relPath: string): Promise<string | null> {
  if (!isDesktop()) return null;
  try {
    return await window.pharmledger!.readFile(relPath);
  } catch {
    return null;
  }
}

export async function openDataFolder(): Promise<string | null> {
  if (!isDesktop()) return null;
  return window.pharmledger!.openDataFolder();
}

export async function getDataRoot(): Promise<string | null> {
  if (!isDesktop()) return null;
  return window.pharmledger!.dataRoot();
}

/** Save backup JSON to a user-chosen path (Electron) or trigger a browser download. */
export async function saveBackup(json: string): Promise<string | null> {
  if (isDesktop()) {
    return window.pharmledger!.exportBackup(json);
  }
  // Browser fallback — download file
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pharmledger-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return a.download;
}

/** Read backup JSON from disk (Electron) or prompt for a file (browser). */
export async function loadBackup(): Promise<string | null> {
  if (isDesktop()) {
    return window.pharmledger!.importBackup();
  }
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return resolve(null);
      resolve(await f.text());
    };
    input.click();
  });
}
