import NodeCache from "node-cache";
import { createHash } from "node:crypto";

/**
 * Generate a hash key from the provided data
 * Ensures consistent hashing by sorting object keys
 */
function hashKey(data: any): string {
  const json = JSON.stringify(data, Object.keys(data).sort());
  return createHash("sha256").update(json).digest("hex");
}

/**
 * Domain-specific idempotency caches using node-cache
 * Each domain gets its own cache instance with 15-minute TTL
 */
export const idempotencyCaches = {
  transactions: new NodeCache({
    stdTTL: 15 * 60, // 15 minutes in seconds
    checkperiod: 5 * 60, // Check for expired keys every 5 minutes
    useClones: false, // Don't clone values for better performance
  }),
};

/**
 * Check if data exists in cache and return the cached value
 */
export function getCached<T>(cache: NodeCache, data: any): T | undefined {
  const key = hashKey(data);
  return cache.get<T>(key);
}

/**
 * Store data in cache with the generated hash as key
 */
export function setCached<T>(cache: NodeCache, data: any, value: T): void {
  const key = hashKey(data);
  cache.set(key, value);
}

/**
 * Check if data exists in cache
 */
export function hasCached(cache: NodeCache, data: any): boolean {
  const key = hashKey(data);
  return cache.has(key);
}
