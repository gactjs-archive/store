import { Complex, Path, PathFor, ReadManager, StoreValue } from "../types";
import { cloneComplex } from "./cloneComplex";
import { isContainer } from "./isContainer";
import { isPrimitive } from "./isPrimitive";

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
  function clone<V extends StoreValue>(path: PathFor<S, V>, value: V): V {
    if (isPrimitive(value)) {
      return value;
    }

    if (frozenClones.has(String(path))) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return frozenClones.get(String(path))! as V;
    }

    const result = cloneComplex(value as Complex);

    if (isContainer(value)) {
      Object.entries(value).forEach(function([key, value]) {
        Reflect.set(result, key, clone([...path, key] as Path<S>, value));
      });
    }

    Object.freeze(result);
    frozenClones.set(String(path), result);

    return result as V;
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
    reconcile,
    reset
  };
}
