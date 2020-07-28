import { StoreValue, Path, PathFactory, PathFactoryResult } from "../types";

/**
 * Creates a path factory
 *
 * @remarks
 * - paths are canonicalized (i.e the same reference is returned for the same path)
 * - paths are frozen (i.e immutable)
 * - a `pathFactory` makes it easy to create paths of the correct tuple type
 * - a `pathFactory` also enables easy path composition
 *
 * @typeParam S - the state tree
 */
export function createPathFactory<S extends StoreValue>(): PathFactoryResult<
  S
> {
  const canonicalPaths: Map<string, readonly string[]> = new Map();

  function fromFactory(path: Path<S>): boolean {
    return canonicalPaths.get(String(path)) === path;
  }

  function path(
    ...pathParts: Array<string | Array<string>>
  ): readonly string[] {
    const path: Array<string> = [];
    for (const pathPart of pathParts) {
      if (Array.isArray(pathPart)) {
        path.push(...pathPart);
      } else {
        path.push(pathPart);
      }
    }

    const pathKey = String(path);
    if (canonicalPaths.has(pathKey)) {
      return canonicalPaths.get(pathKey)!;
    } else {
      canonicalPaths.set(pathKey, Object.freeze(path));
      return path;
    }
  }

  return { path: path as PathFactory<S>, fromFactory };
}
