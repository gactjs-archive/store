import { StoreRecord } from "../types";

/**
 * A type guard for `StoreRecord`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function isStoreRecord(value: any): value is StoreRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const proto = Object.getPrototypeOf(value);

  return proto === null || proto === Object.prototype;
}
