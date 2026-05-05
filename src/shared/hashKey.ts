import { createHash } from "node:crypto";

/**
 * Generate a hash key from the provided data
 * Ensures consistent hashing by sorting object keys
 */
export function hashKey(data: any): string {
   const sorted = Object.fromEntries(
      Object.entries(data).sort(([a], [b]) => a.localeCompare(b))
   );
   const json = JSON.stringify(sorted);
   return createHash("sha256").update(json).digest("hex");
}