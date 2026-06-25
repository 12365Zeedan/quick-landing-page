import { useEffect, useState } from "react";
import { isDesktop, mirrorToDisk, readFromDisk } from "@/lib/desktop-bridge";

const STORAGE_FILE = "local-storage.json";
const AUTO_SAVE_PREFIXES = ["pharmledger.", "pl_", "org."];

function isPersistentKey(key: string | null): boolean {
  return !!key && AUTO_SAVE_PREFIXES.some((prefix) => key.startsWith(prefix));
}

let skipMirror = false;
let pending: Record<string, string | null> = {};
let flushTimer: ReturnType<typeof window.setTimeout> | null = null;
let isFlushing = false;

async function readPersistedStorage(): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readFromDisk(STORAGE_FILE);
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (error) {
    console.warn("[desktop-storage] failed to read persisted storage", error);
    return null;
  }
}

async function writePersistedStorage(data: Record<string, unknown>): Promise<void> {
  await mirrorToDisk(STORAGE_FILE, JSON.stringify(data));
}

async function flushPendingStorage() {
  if (!isDesktop()) return;
  if (isFlushing) return;
  if (!Object.keys(pending).length) return;

  const items = { ...pending };
  pending = {};
  if (flushTimer) {
    window.clearTimeout(flushTimer);
    flushTimer = null;
  }

  isFlushing = true;
  try {
    const existing = (await readPersistedStorage()) ?? {};
    const next = { ...existing };
    for (const [key, value] of Object.entries(items)) {
      if (value === null) {
        delete next[key];
      } else {
        next[key] = value;
      }
    }
    await writePersistedStorage(next);
  } catch (error) {
    console.warn("[desktop-storage] failed to flush storage", error);
  } finally {
    isFlushing = false;
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flushPendingStorage();
  }, 120);
}

function queueStorageChange(key: string, value: string | null) {
  pending[key] = value;
  scheduleFlush();
}

function patchLocalStorageMirror() {
  if (!isDesktop() || typeof window === "undefined") return;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;
  const originalClear = Storage.prototype.clear;

  Storage.prototype.setItem = function (key: string, value: string) {
    originalSetItem.call(this, key, value);
    if (skipMirror || this !== window.localStorage) return;
    if (isPersistentKey(key)) {
      queueStorageChange(key, value);
    }
  };

  Storage.prototype.removeItem = function (key: string) {
    originalRemoveItem.call(this, key);
    if (skipMirror || this !== window.localStorage) return;
    if (isPersistentKey(key)) {
      queueStorageChange(key, null);
    }
  };

  Storage.prototype.clear = function () {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && isPersistentKey(key)) {
        keys.push(key);
      }
    }
    originalClear.call(this);
    if (skipMirror || this !== window.localStorage) return;
    if (keys.length) {
      for (const key of keys) {
        queueStorageChange(key, null);
      }
    }
  };
}

export async function initDesktopLocalStorage(): Promise<void> {
  if (!isDesktop() || typeof window === "undefined") return;

  patchLocalStorageMirror();

  skipMirror = true;
  try {
    const persisted = await readPersistedStorage();
    if (!persisted) return;

    for (const [key, value] of Object.entries(persisted)) {
      if (!isPersistentKey(key)) continue;
      try {
        if (typeof value === "string") {
          window.localStorage.setItem(key, value);
        } else {
          window.localStorage.setItem(key, JSON.stringify(value));
        }
      } catch (error) {
        console.warn(`[desktop-storage] failed to restore key ${key}`, error);
      }
    }
  } finally {
    skipMirror = false;
  }

  window.addEventListener("beforeunload", () => {
    void flushPendingStorage();
  });
}

export function useDesktopLocalStorageHydration(): boolean {
  const [hydrated, setHydrated] = useState(!isDesktop());

  useEffect(() => {
    if (!isDesktop()) return;
    let mounted = true;
    initDesktopLocalStorage()
      .catch((error) => console.error("[desktop-storage] init failed", error))
      .finally(() => {
        if (mounted) setHydrated(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return hydrated;
}
