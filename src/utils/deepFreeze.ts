import { isContainer } from "./isContainer";
import { isPrimitive } from "./isPrimitive";

/**
 * Deep freezes values
 *
 * @remarks
 * value is guaranteed to conform to the `StoreValue`s invariants
 */
export function deepFreeze<T>(value: T): T {
  if (isPrimitive(value)) {
    return value;
  }

  if (isContainer(value)) {
    Object.values(value).forEach(deepFreeze);
  }

  return Object.isFrozen(value) ? value : Object.freeze(value);
}
