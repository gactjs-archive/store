import { Container } from "../types";
import { isStoreRecord } from "./isStoreRecord";

/**
 * A type guard for Container
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isContainer(value: any): value is Container {
  return Array.isArray(value) || isStoreRecord(value);
}
