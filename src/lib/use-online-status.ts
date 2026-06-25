import { useEffect, useState } from "react";

/** Reactive online/offline indicator. SSR-safe (defaults to true). */
export function useOnlineStatus(): boolean {
  // Start true on both server and client to avoid hydration mismatch; sync to
  // real value on mount.
  const [online, setOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof navigator !== "undefined") setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return online;
}
