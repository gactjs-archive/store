import { isPrimitive } from "./isPrimitive";
import { isContainer } from "./isContainer";
import { cloneComplex } from "./cloneComplex";
import {
  StoreValue,
  Complex,
  Path,
  PathFor,
  Value,
  ReadManager
} from "../types";

/**
 * Creates a `ReadManager`
 */
export function createReadManager<S extends StoreValue>(): ReadManager<S> {
  const frozenClones: Map<string, StoreValue> = new Map();

  /**
   * structurally clones the provided value
   *
   * @remarks
   * value is guaranteed to conform to the `StoreValue` invariants since we only
   * structurally clone values that are already in the store
   */
  function clone<P extends Path<S>, V extends StoreValue>(
    path: P | PathFor<S, V>,
    value: Value<S, P, V>
  ): Value<S, P, V> {
    if (isPrimitive(value)) {
      return value;
    }

    if (frozenClones.has(String(path))) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return frozenClones.get(String(path))! as Value<S, P, V>;
    }

    const result = cloneComplex(value as Complex);

    if (isContainer(value)) {
      Object.entries(value).forEach(function([key, value]) {
        Reflect.set(
          result,
          key,
          clone(
            [...path, key] as Path<S>,
            value as Value<S, Path<S>, StoreValue>
          )
        );
      });
    }

    Object.freeze(result);
    frozenClones.set(String(path), result);

    return result as Value<S, P, V>;
  }

  /**
   * clears the map of stored frozen clones
   */
  function reset(): void {
    frozenClones.clear();
  }

  /**
   * removes stale (specified by a set of paths) frozen clones
   */
  function reconcile(paths: Set<Path<S>>): void {
    for (const path of paths) {
      frozenClones.delete(String(path));
    }
  }

  return {
    clone,
    reset,
    reconcile
  };
}
