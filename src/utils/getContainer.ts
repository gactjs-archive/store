import getByPath from "./getByPath";
import { StoreValue, Container, Path, PathFor } from "../types";

/**
 * Gets parent of the value at a given path.
 *
 * @typeParam S - the state tree
 * @typeParam P - the path
 * @typeParam V - the value in S at P
 *
 */
export default function getContainer<
  S extends StoreValue,
  P extends Path<S>,
  V extends StoreValue
>(state: S, path: P | PathFor<S, V>): Container {
  if (path.length === 0) {
    throw Error("the state tree does not have a container");
  }

  const containerPath = path.slice(0, -1) as PathFor<S, Container>;
  return getByPath(state, containerPath);
}
