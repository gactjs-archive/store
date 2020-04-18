import { Primitive } from "../types";

/**
 * A type guard for `Primitive`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function isPrimitive(value: any): value is Primitive {
  const type = typeof value;

  return (
    type === "string" ||
    type === "number" ||
    type === "bigint" ||
    type === "boolean" ||
    value === null
  );
}
