import { Path, PathFor, StoreValue } from "../types";
import { isContainer } from "./isContainer";

function computeAncestorPaths<S extends StoreValue, V extends StoreValue>(
  path: PathFor<S, V>
): Set<Path<S>> {
  const ancestorPaths: Set<Path<S>> = new Set();
  for (let i = 0; i < path.length; i++) {
    ancestorPaths.add(path.slice(0, i) as Path<S>);
  }
  return ancestorPaths;
}

function computeDescendantPaths<S extends StoreValue, V extends StoreValue>(
  path: PathFor<S, V>,
  value: V | null
): Set<Path<S>> {
  // only containers have descendant paths
  if (!isContainer(value)) {
    return new Set();
  }

  const descendantPaths: Set<Path<S>> = new Set();

  for (const [key, childValue] of Object.entries(value)) {
    const childPath = [...path, key] as Path<S>;
    descendantPaths.add(childPath);
    for (const descendantPath of computeDescendantPaths(
      childPath,
      childValue
    )) {
      descendantPaths.add(descendantPath);
    }
  }

  return descendantPaths;
}

/**
 * Computes the set of paths containing the path itself, ancestors, and descendants.
 *
 * @typeParam S - the state tree
 * @typeParam P - the path
 * @typeParam V - the value in S at P
 */
export function computePathLineage<S extends StoreValue, V extends StoreValue>(
  path: PathFor<S, V>,
  value: V | null
): Set<Path<S>> {
  return new Set([
    ...computeAncestorPaths(path),
    (path as unknown) as Path<S>,
    ...computeDescendantPaths(path, value)
  ]);
}
