import { createHash } from "node:crypto";

/**
 * Generate a hash key from the provided data
 * Ensures consistent hashing by sorting object keys
 */
export function hashKey(data: any): string {
   const json = JSON.stringify(data, Object.keys(data).sort());
   return createHash("sha256").update(json).digest("hex");
}