import { computeTag } from "./computeTag";

/**
 * A type guard for `File`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isFile(value: any): value is File {
  return computeTag(value) === "[object File]";
}
