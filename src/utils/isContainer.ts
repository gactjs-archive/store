import isStoreRecord from "./isStoreRecord";
import { Container } from "../types";

/**
 * A type guard for Container
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function isContainer(value: any): value is Container {
  return Array.isArray(value) || isStoreRecord(value);
}
