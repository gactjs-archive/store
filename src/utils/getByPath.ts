import { PathFor, StoreValue } from "../types";
import { isContainer } from "./isContainer";

/**
 * Gets the value in the provided state at the provided path.
 *
 * @remarks
 * Throws if the path does not exist
 *
 * @typeParam S - the state tree
 * @typeParam P - the path
 * @typeParam V - the value in S at P
 */
export function getByPath<S extends StoreValue, V extends StoreValue>(
  state: S,
  path: PathFor<S, V>
): V {
  let value: StoreValue = state;
  for (const pathPart of path) {
    if (
      !(
        isContainer(value) &&
        Object.prototype.hasOwnProperty.call(value, pathPart)
      )
    ) {
      throw Error(`${path} does not exist`);
    }

    value = Reflect.get(value, pathPart);
  }

  return value as V;
}
