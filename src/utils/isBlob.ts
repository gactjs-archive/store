import { computeTag } from "./computeTag";

/**
 * Type guard for Blob
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isBlob(value: any): value is Blob {
  return computeTag(value) === "[object Blob]";
}
