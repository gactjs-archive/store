import isPrimitive from "./isPrimitive";
import isContainer from "./isContainer";

/**
 * Deep freezes values
 *
 * @remarks
 * value is guaranteed to conform to the `StoreValue`s invariants
 */
export default function deepFreeze<T>(value: T): T {
  if (isPrimitive(value)) {
    return value;
  }

  if (isContainer(value)) {
    Object.values(value).forEach(deepFreeze);
  }

  return Object.isFrozen(value) ? value : Object.freeze(value);
}
