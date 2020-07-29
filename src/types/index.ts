/**
 * `ValueOf` is the analog of `keyof` for values.
 * It produces a union of all the values in a value.
 *
 * For example:
 * ```ts
 * type Example = {
 *   a: number;
 *   b: string
 * }
 *
 * ValueOf<Example> string | number
 * ```
 *
 * @typeParam T -  the objects whose values we want a union of
 */
type ValueOf<T> = T[keyof T];

type MatchThen<T, U, V> = T extends U ? V : never;

/**
 * The primitive values allowed in the store
 *
 * @remarks
 * `Symbol`s are disallowed because they cannot be serialized.
 */
export type Primitive = string | number | bigint | boolean | null;

/**
 * @remarks
 * Not defined as `Record<string, StoreValue>` because TS incorrectly
 * throws a circular reference error
 */
export type StoreRecord = { [key: string]: StoreValue };

export type StoreArray = Array<StoreValue>;

/**
 * The containers allowed in the store.
 *
 * @remarks
 * The restriction to `StoreRecord` and `StoreArray` allows us to freeze
 * `StoreValue`s. All the other types allowed in the store are either
 * immutable (e.g `Primitive`) or freezable (e.g `Blob`). The ability
 * to freeze values allows us to implement **structural sharing**, which
 * makes store reads much more efficient.
 *
 * `Map`s and `Set`s are disallowed because they because they only provide
 * substantial value when references are allowed. Further, `Map`s and `Set`s
 * are unfreezable.
 */
export type Container = StoreRecord | StoreArray;

/**
 * The complex values allowed in the store.
 *
 * @remarks
 * `Complex` means not a Primitive value.
 *
 * The requirement for **cloneability** restricts us to {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm | cloneable built-in types}.
 *
 * `TypedArray`s are disallowed because they are necessarily referential types.
 *
 * `Date` is disallowed because it has mutative methods, and cannot be frozen.
 *
 * `RegExp` is not included because there appear to practical use cases
 */
export type Complex = Container | Blob | File;

/**
 * The type of value allowed in the store.
 *
 * @remarks
 * StoreValue was carefully engineered to guarantee **serializability**
 * and **immutability**.
 */
export type StoreValue = Primitive | Complex;

/**
 * `ContainerKey` is the building block of paths.
 *
 * @remarks
 * In order to circumvent {@link https://github.com/microsoft/TypeScript/issues/31619 | type instantiation limits} `ContainerKey`
 * is not defined as:
 * ```ts
 * type ContainerKey<S> = S extends Container
 * ? Exclude<keyof S, Exclude<keyof [], number>>
 * : never;
 *
 * The definition we use unfortunately recognizes built-in properties. We exclude a selected list of built-in properties
 * to reduce this leakage. However, we cannot exclude all built-in properties because that would make it impossible to
 * use those same property names elsewhere (e.g. a StoreRecord couldn't have a property "search" because that's a built-in method
 * on strings).
 * ```
 */
export type ContainerKey<S> = Exclude<
  keyof S,
  | "toString"
  | "toFixed"
  | "toExponential"
  | "toPrecision"
  | "valueOf"
  | "toLocaleString"
>;

export type _PathFor<S extends StoreValue, V extends StoreValue> =
  | MatchThen<S, V, []>
  | ValueOf<
      {
        [K1 in ContainerKey<S>]:
          | MatchThen<S[K1], V, [K1]>
          | ValueOf<
              {
                [K2 in ContainerKey<S[K1]>]:
                  | MatchThen<S[K1][K2], V, [K1, K2]>
                  | ValueOf<
                      {
                        [K3 in ContainerKey<S[K1][K2]>]:
                          | MatchThen<S[K1][K2][K3], V, [K1, K2, K3]>
                          | ValueOf<
                              {
                                [K4 in ContainerKey<S[K1][K2][K3]>]:
                                  | MatchThen<
                                      S[K1][K2][K3][K4],
                                      V,
                                      [K1, K2, K3, K4]
                                    >
                                  | ValueOf<
                                      {
                                        [K5 in ContainerKey<
                                          S[K1][K2][K3][K4]
                                        >]: MatchThen<
                                          S[K1][K2][K3][K4][K5],
                                          V,
                                          [K1, K2, K3, K4, K5]
                                        >;
                                      }
                                    >;
                              }
                            >;
                      }
                    >;
              }
            >;
      }
    >;

/**
 * `PathsFor` represents the paths in S with the value V.
 *
 * @remarks
 * Paths up to length 5 (e.g ["a", "b", "c", "d", "e", "f"]) are recognized.
 *
 * @typeParam S - the state tree
 * @typeParam V - the type of value we want
 */
export type PathFor<
  S extends StoreValue,
  V extends StoreValue
> = StoreValue extends V ? never : _PathFor<S, V>;

/**
 * `Path` represents all the paths in S
 *
 * @typeParam S - the state tree
 */
export type Path<S extends StoreValue> = _PathFor<S, StoreValue>;

/**
 * `PathFactory` makes it easy to construct and compose paths
 *
 * @remarks
 * The order of the overloads is significant. The key only overloads come before
 * the path extension overloads for maximum completion support.
 *
 * @typeParam S - the state tree
 */
export type PathFactory<S extends StoreValue> = {
  (): [];

  <K1 extends ContainerKey<S>>(key1: K1): [K1];

  <K1 extends ContainerKey<S>, K2 extends ContainerKey<S[K1]>>(
    key1: K1,
    key2: K2
  ): [K1, K2];

  <K1 extends ContainerKey<S>, K2 extends ContainerKey<S[K1]>>(
    path: [K1],
    key2: K2
  ): [K1, K2];

  <
    K1 extends ContainerKey<S>,
    K2 extends ContainerKey<S[K1]>,
    K3 extends ContainerKey<S[K1][K2]>
  >(
    key1: K1,
    key2: K2,
    key3: K3
  ): [K1, K2, K3];

  <
    K1 extends ContainerKey<S>,
    K2 extends ContainerKey<S[K1]>,
    K3 extends ContainerKey<S[K1][K2]>
  >(
    path: [K1],
    key2: K2,
    key3: K3
  ): [K1, K2, K3];

  <
    K1 extends ContainerKey<S>,
    K2 extends ContainerKey<S[K1]>,
    K3 extends ContainerKey<S[K1][K2]>
  >(
    path: [K1, K2],
    key3: K3
  ): [K1, K2, K3];

  <
    K1 extends ContainerKey<S>,
    K2 extends ContainerKey<S[K1]>,
    K3 extends ContainerKey<S[K1][K2]>,
    K4 extends ContainerKey<S[K1][K2][K3]>
  >(
    key1: K1,
    key2: K2,
    key3: K3,
    key4: K4
  ): [K1, K2, K3, K4];

  <
    K1 extends ContainerKey<S>,
    K2 extends ContainerKey<S[K1]>,
    K3 extends ContainerKey<S[K1][K2]>,
    K4 extends ContainerKey<S[K1][K2][K3]>
  >(
    path: [K1],
    key2: K2,
    key3: K3,
    key4: K4
  ): [K1, K2, K3, K4];

  <
    K1 extends ContainerKey<S>,
    K2 extends ContainerKey<S[K1]>,
    K3 extends ContainerKey<S[K1][K2]>,
    K4 extends ContainerKey<S[K1][K2][K3]>
  >(
    path: [K1, K2],
    key3: K3,
    key4: K4
  ): [K1, K2, K3, K4];

  <
    K1 extends ContainerKey<S>,
    K2 extends ContainerKey<S[K1]>,
    K3 extends ContainerKey<S[K1][K2]>,
    K4 extends ContainerKey<S[K1][K2][K3]>
  >(
    path: [K1, K2, K3],
    key4: K4
  ): [K1, K2, K3, K4];

  <
    K1 extends ContainerKey<S>,
    K2 extends ContainerKey<S[K1]>,
    K3 extends ContainerKey<S[K1][K2]>,
    K4 extends ContainerKey<S[K1][K2][K3]>,
    K5 extends ContainerKey<S[K1][K2][K3][K4]>
  >(
    key1: K1,
    key2: K2,
    key3: K3,
    key4: K4,
    key5: K5
  ): [K1, K2, K3, K4, K5];

  <
    K1 extends ContainerKey<S>,
    K2 extends ContainerKey<S[K1]>,
    K3 extends ContainerKey<S[K1][K2]>,
    K4 extends ContainerKey<S[K1][K2][K3]>,
    K5 extends ContainerKey<S[K1][K2][K3][K4]>
  >(
    path: [K1],
    key2: K2,
    key3: K3,
    key4: K4,
    key5: K5
  ): [K1, K2, K3, K4, K5];

  <
    K1 extends ContainerKey<S>,
    K2 extends ContainerKey<S[K1]>,
    K3 extends ContainerKey<S[K1][K2]>,
    K4 extends ContainerKey<S[K1][K2][K3]>,
    K5 extends ContainerKey<S[K1][K2][K3][K4]>
  >(
    path: [K1, K2],
    key3: K3,
    key4: K4,
    key5: K5
  ): [K1, K2, K3, K4, K5];

  <
    K1 extends ContainerKey<S>,
    K2 extends ContainerKey<S[K1]>,
    K3 extends ContainerKey<S[K1][K2]>,
    K4 extends ContainerKey<S[K1][K2][K3]>,
    K5 extends ContainerKey<S[K1][K2][K3][K4]>
  >(
    path: [K1, K2, K3],
    key4: K4,
    key5: K5
  ): [K1, K2, K3, K4, K5];

  <
    K1 extends ContainerKey<S>,
    K2 extends ContainerKey<S[K1]>,
    K3 extends ContainerKey<S[K1][K2]>,
    K4 extends ContainerKey<S[K1][K2][K3]>,
    K5 extends ContainerKey<S[K1][K2][K3][K4]>
  >(
    path: [K1, K2, K3, K4],
    key5: K5
  ): [K1, K2, K3, K4, K5];

  <V extends StoreValue, K1 extends ContainerKey<V>>(
    path: PathFor<S, V>,
    key1: K1
  ): V[K1] extends StoreValue ? PathFor<S, V[K1]> : never;

  <
    V extends StoreValue,
    K1 extends ContainerKey<V>,
    K2 extends ContainerKey<V[K1]>
  >(
    path: PathFor<S, V>,
    key1: K1,
    key2: K2
  ): V[K1][K2] extends StoreValue ? PathFor<S, V[K1][K2]> : never;

  <
    V extends StoreValue,
    K1 extends ContainerKey<V>,
    K2 extends ContainerKey<V[K1]>,
    K3 extends ContainerKey<V[K1][K2]>
  >(
    path: PathFor<S, V>,
    key1: K1,
    key2: K2,
    key3: K3
  ): V[K1][K2][K3] extends StoreValue ? PathFor<S, V[K1][K2][K3]> : never;

  <
    V extends StoreValue,
    K1 extends ContainerKey<V>,
    K2 extends ContainerKey<V[K1]>,
    K3 extends ContainerKey<V[K1][K2]>,
    K4 extends ContainerKey<V[K1][K2][K3]>
  >(
    path: PathFor<S, V>,
    key1: K1,
    key2: K2,
    key3: K3,
    key4: K4
  ): V[K1][K2][K3][K4] extends StoreValue
    ? PathFor<S, V[K1][K2][K3][K4]>
    : never;

  <
    V extends StoreValue,
    K1 extends ContainerKey<V>,
    K2 extends ContainerKey<V[K1]>,
    K3 extends ContainerKey<V[K1][K2]>,
    K4 extends ContainerKey<V[K1][K2][K3]>,
    K5 extends ContainerKey<V[K1][K2][K3][K4]>
  >(
    path: PathFor<S, V>,
    key1: K1,
    key2: K2,
    key3: K3,
    key4: K4,
    key5: K5
  ): V[K1][K2][K3][K4][K5] extends StoreValue
    ? PathFor<S, V[K1][K2][K3][K4][K5]>
    : never;

  <P extends Path<S>>(path: P): P;
};

/**
 * `PathFactoryResult` pairs a pathFactory with `fromFactory`, which
 * allows us to determine whether a given path was produced by the
 * pathFactory
 */
export type PathFactoryResult<S extends StoreValue> = {
  path: PathFactory<S>;
  fromFactory(path: Path<S>): boolean;
};

/**
 * `ValueAt` represents the value in S at P
 *
 * @typeParam S - the state tree
 * @typeParam P - the path of the value
 */
export type ValueAt<S extends StoreValue, P extends Path<S>> = P extends
  | []
  | [infer K1]
  | [infer K1, infer K2]
  | [infer K1, infer K2, infer K3]
  | [infer K1, infer K2, infer K3, infer K4]
  | [infer K1, infer K2, infer K3, infer K4, infer K5]
  | [infer K1, infer K2, infer K3, infer K4, infer K5]
  ? K1 extends ContainerKey<S>
    ? K2 extends ContainerKey<S[K1]>
      ? K3 extends ContainerKey<S[K1][K2]>
        ? K4 extends ContainerKey<S[K1][K2][K3]>
          ? K5 extends ContainerKey<S[K1][K2][K3][K4]>
            ? S[K1][K2][K3][K4][K5]
            : S[K1][K2][K3][K4]
          : S[K1][K2][K3]
        : S[K1][K2]
      : S[K1]
    : S
  : never;

/**
 * `Value` extends `ValueAt` to handle both the generic and concrete case
 *
 * @remarks
 * A limitation of TypeScript is it cannot do {@link https://github.com/microsoft/TypeScript/issues/37675 |
 * "higher-order reasoning and immediate resolution at the same time".}
 *
 * Value works around this limitation by employing a two-pronged approach.
 * In the generic case, V will be inferred, and we can simply return it.
 * In the concrete case, V will not be inferred and be we can use the resolved
 * path P and `ValueAt` to recover the the type of value.
 *
 * @typeParam S - the state tree
 * @typeParam P - the path of the value
 * @typeParam V - the type of the value at P in S (not inferred in the concrete case)
 */
export type Value<
  S extends StoreValue,
  P extends Path<S>,
  V extends StoreValue
> = StoreValue extends V ? ValueAt<S, P> : V;

/**
 * Enables efficient immutable reads through structural sharing and deep freezing
 *
 * @typeParam S - the state tree
 */
export type ReadManager<S extends StoreValue> = {
  reset(): void;
  reconcile(paths: Set<Path<S>>): void;
  clone<P extends Path<S>, V extends StoreValue>(
    path: P | PathFor<S, V>,
    value: Value<S, P, V>
  ): Value<S, P, V>;
};

export enum EventType {
  Init = "INIT",
  Get = "GET",
  Set = "SET",
  Update = "UPDATE",
  Remove = "REMOVE",
  Transaction = "TRANSACTION"
}

/**
 * `Updater`s specify an update to a value in the store.
 *
 * If an `Updater` returns a value, then we use that as the updated value.
 *
 * If an `Updater` does not return a value, then we assume the inputted value
 * has been mutated, and use that as the updated value.
 *
 * @typeParam T - the type of value we are updating.
 */
export type Updater<T> = (value: T) => T | void;

/**
 * `InitEvent` captures the initialization of the store.
 *
 * @remarks
 * `InitEvent` is completely frozen (i.e immutable).
 *
 * @typeParam S - the state tree
 */
export type InitEvent<S extends StoreValue> = {
  type: EventType.Init;
  state: S;
};

/**
 * `GetEvent` captures getting a value from the store.
 *
 * @remarks
 * `GetEvent` is completely frozen (i.e. immutable).
 */
export type GetEvent<S extends StoreValue> = {
  type: EventType.Get;
  path: Path<S>;
  value: StoreValue;
  meta: StoreRecord | null;
};

/**
 * `SetEvent` captures setting a value in the store.
 *
 * @remarks
 * `SetEvent` is completely frozen (i.e. immutable).
 */
export type SetEvent<S extends StoreValue> = {
  type: EventType.Set;
  path: Path<S>;
  prevValue: StoreValue;
  value: StoreValue;
  meta: StoreRecord | null;
};

/**
 * `UpdateEvent` captures updating a value in the store.
 *
 * @remarks
 * `UpdateEvent` is completely frozen (i.e. immutable).
 */
export type UpdateEvent<S extends StoreValue> = {
  type: EventType.Update;
  path: Path<S>;
  prevValue: StoreValue;
  value: StoreValue;
  meta: StoreRecord | null;
};

/**
 * `RemoveEvent` captures deleting a value in the store.
 *
 * @remarks
 * `RemoveEvent` is completely frozen (i.e. immutable).
 */
export type RemoveEvent<S extends StoreValue> = {
  type: EventType.Remove;
  path: Path<S>;
  prevValue: StoreValue;
  meta: StoreRecord | null;
};

/**
 * `WriteEvent`s capture writes to the store.
 *
 *  @remarks
 * `WriteEvent`s are completely frozen (i.e. immutable).
 */
export type WriteEvent<S extends StoreValue> =
  | SetEvent<S>
  | UpdateEvent<S>
  | RemoveEvent<S>;

/**
 * `CrudEvent`s capture read and writes to the store.
 *
 *  @remarks
 * `CrudEvent`s are completely frozen (i.e. immutable).
 */
export type CRUDEvent<S extends StoreValue> = GetEvent<S> | WriteEvent<S>;

/**
 * `TransactionEvent` captures a transaction.
 *
 * @remarks
 * `TransactionEvent` is completely frozen (i.e. immutable).
 */
export type TransactionEvent<S extends StoreValue> = {
  type: EventType.Transaction;
  events: Array<CRUDEvent<S>>;
  meta: StoreRecord | null;
};

/**
 * `StoreEvent`s capture all store activity.
 *
 * @remarks
 * `StoreEvent`s are completely frozen (i.e. immutable).
 */
export type StoreEvent<S extends StoreValue> =
  | InitEvent<S>
  | CRUDEvent<S>
  | TransactionEvent<S>;

/**
 * `Listener`s subscribe to the stream of `StoreEvent`s.
 *
 * @remarks
 * It is common for a `Listener` to want to perform operations on the store
 * that will generate further events. In order to avoid infinite loops, it is
 * recommended that the `meta` argument be used to identify activity originating
 * from the subscriber.
 *
 * @typeParam S - the state tree
 */
export type Listener<S extends StoreValue> = (event: StoreEvent<S>) => void;

/**
 * `Store` implements an **accountable centralized state tree**.
 *
 * @typeParam S - the state tree
 */
export type Store<S extends StoreValue> = {
  subscribe(listener: Listener<S>): () => void;

  canMutateSubscriptions(): boolean;

  path: PathFactory<S>;

  get<P extends Path<S>, V extends StoreValue>(
    path: P | PathFor<S, V>,
    meta?: StoreValue
  ): Value<S, P, V>;

  set<P extends Path<S>, V extends StoreValue>(
    path: P | PathFor<S, V>,
    value: Value<S, P, V>,
    meta?: StoreValue
  ): void;

  update<P extends Path<S>, V extends StoreValue>(
    path: P | PathFor<S, V>,
    updater: Updater<Value<S, P, V>>,
    meta?: StoreValue
  ): void;

  remove<P extends Path<S>, V extends StoreValue>(
    path: P | PathFor<S, V>,
    meta?: StoreValue
  ): void;

  transaction(transaction: () => void, meta?: StoreValue): void;
};
