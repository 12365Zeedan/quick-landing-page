import { useEffect, useState } from "react";
import { useOrg } from "@/lib/org-context";

/**
 * Persist a per-organization array in localStorage.
 * Each organization gets its own bucket so data never leaks across orgs.
 * Returns [items, setItems, hydrated].
 */
export function useOrgStorage<T>(
  prefix: string,
  fallback: T[] = [],
): [T[], React.Dispatch<React.SetStateAction<T[]>>, boolean] {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id ?? null;
  const key = `${prefix}.${orgId ?? "__none__"}`;

  const [items, setItems] = useState<T[]>(fallback);
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);

  // Load whenever the active org changes
  useEffect(() => {
    if (typeof window === "undefined") {
      setHydratedFor(orgId);
      return;
    }
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        setItems(Array.isArray(parsed) ? (parsed as T[]) : fallback);
      } else {
        setItems(fallback);
      }
    } catch (e) {
      console.warn(`[useOrgStorage:${prefix}] load failed`, e);
      setItems(fallback);
    }
    setHydratedFor(orgId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, key]);

  // Persist on changes once hydrated for this org
  useEffect(() => {
    if (hydratedFor !== orgId) return;
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (e) {
      console.warn(`[useOrgStorage:${prefix}] save failed`, e);
    }
  }, [items, hydratedFor, orgId, key, prefix]);

  return [items, setItems, hydratedFor === orgId];
}
