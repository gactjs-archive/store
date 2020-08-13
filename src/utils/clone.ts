import { Complex, StoreValue } from "../types";
import { cloneComplex } from "./cloneComplex";
import { isContainer } from "./isContainer";
import { isPrimitive } from "./isPrimitive";
import { warning } from "./warning";

function cloneHelper<T extends StoreValue>(
  value: T,
  clonedValues: Set<StoreValue>
): T {
  if (isPrimitive(value)) {
    return value;
  }

  // ensure reference-agnosticism
  if (clonedValues.has(value)) {
    throw Error("StoreValues must be reference agnostic");
  }

  const result = cloneComplex(value as Complex);
  clonedValues.add(value);

  if (Object.getOwnPropertySymbols(value).length) {
    // warn instead of throw because jsdom adds a symbol property to File and Blob
    warning("Cannot clone a value with symbol properties");
  }

  if (!isContainer(value) && Object.getOwnPropertyNames(value).length) {
    throw Error("Only Containers are allowed to have ownProperties");
  }

  const descriptors = Object.getOwnPropertyDescriptors(value);

  // the one exception to the default descriptor invariant
  if (Array.isArray(value)) {
    delete descriptors.length;
  }

  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (descriptor.get || descriptor.set) {
      throw Error("Cannot clone a property with getter and/or setter");
    }

    if (
      !(descriptor.configurable && descriptor.enumerable && descriptor.writable)
    ) {
      throw Error("ownProperties must have the default descriptor");
    }

    Reflect.set(result, key, cloneHelper(descriptor.value, clonedValues));
  }

  return result as T;
}

/**
 * Creates a perfect deep clone
 *
 * @remarks
 * `clone` ensures the provided value conforms to the `StoreValue` invariants.
 *
 * Every value is cloned before entering the store, and thus every value in the store
 * is guaranteed to conform to the `StoreValue` invariants.
 *
 * The `StoreValue` invariants are
 * 1. value is of type `StoreValue`
 * 2. value is reference agnostic
 * 3. only containers have ownProperties
 * 4. all properties have the default descriptor
 *
 *
 * @typeParam T - the value being cloned
 */
export function clone<T extends StoreValue>(value: T): T {
  const clonedValues: Set<StoreValue> = new Set();

  return cloneHelper(value, clonedValues);
}
