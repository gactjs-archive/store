/**
 * Computes a tag that can be used to determine the type of a value
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function computeTag(value: any): string {
  return Object.prototype.toString.call(value);
}
