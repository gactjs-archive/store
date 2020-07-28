import { deepFreeze } from "./utils/deepFreeze";
import { clone } from "./utils/clone";
import { createReadManager } from "./utils/createReadManager";
import { getByPath } from "./utils/getByPath";
import { getContainer } from "./utils/getContainer";
import { createPathFactory } from "./utils/createPathFactory";
import { computePathLineage } from "./utils/computePathLineage";
import {
  StoreRecord,
  StoreValue,
  PathFor,
  Path,
  Value,
  Updater,
  EventType,
  InitEvent,
  GetEvent,
  SetEvent,
  UpdateEvent,
  RemoveEvent,
  CRUDEvent,
  TransactionEvent,
  StoreEvent,
  Listener,
  Store
} from "./types";

function createInitEvent<S extends StoreValue>(state: S): InitEvent<S> {
  return deepFreeze({ state, type: EventType.Init });
}

function createGetEvent<S extends StoreValue>(
  path: Path<S>,
  value: StoreValue,
  meta: StoreRecord | null
): GetEvent<S> {
  return deepFreeze({ path, value, meta, type: EventType.Get });
}

function createSetEvent<S extends StoreValue>(
  path: Path<S>,
  prevValue: StoreValue,
  value: StoreValue,
  meta: StoreRecord | null
): SetEvent<S> {
  return deepFreeze({
    prevValue,
    value,
    path,
    meta,
    type: EventType.Set
  });
}

function createUpdateEvent<S extends StoreValue>(
  path: Path<S>,
  prevValue: StoreValue,
  value: StoreValue,
  meta: StoreRecord | null
): UpdateEvent<S> {
  return deepFreeze({
    path,
    prevValue,
    value,
    meta,
    type: EventType.Update
  });
}

function createRemoveEvent<S extends StoreValue>(
  path: Path<S>,
  prevValue: StoreValue,
  meta: StoreRecord | null
): RemoveEvent<S> {
  return deepFreeze({
    path,
    prevValue,
    meta,
    type: EventType.Remove
  });
}

function createTransactionEvent<S extends StoreValue>(
  transactionEvents: Array<CRUDEvent<S>>,
  meta: StoreRecord | null
): TransactionEvent<S> {
  return deepFreeze({
    meta,
    type: EventType.Transaction,
    events: transactionEvents
  });
}

/**
 * Creates a Gact store.
 *
 * @typeParam S - the state tree;
 */
export function createStore<S extends StoreValue>(initialState: S): Store<S> {
  let initialized = false;
  let state: S = clone(initialState);
  let transactionWrites: Array<() => void> = [];
  let transactionEvents: Array<CRUDEvent<S>> = [];
  let activeUpdate = false;
  let activeTransaction = false;
  const { path, fromFactory } = createPathFactory<S>();
  const listeners: Set<Listener<S>> = new Set();
  const readManager = createReadManager<S>();

  /**
   * Distributes a `StoreEvent` to all listeners
   */
  function notifyListeners(event: StoreEvent<S>): void {
    for (const listener of listeners) {
      listener(event);
    }
  }

  /**
   * `announce` enhances `notifyListeners` with transaction-awareness.
   *
   * If we are in the middle of a transaction, then each event is added
   * to the transaction events. Otherwise, we notify listeners like normal.
   *
   */
  function announce(event: CRUDEvent<S>): void {
    if (activeTransaction) {
      transactionEvents.push(event);
    } else {
      notifyListeners(event);
    }
  }

  /**
   * `makeInitAware` is a higher-order function that wraps the functions
   * of the **access layer** to ensure that the store's event stream
   * begins with an `InitEvent`.
   *
   * @typeParam T - the function being wrapped
   */
  function makeInitAware<T extends (...args: any[]) => unknown>(fn: T): T {
    return function(...args) {
      if (!initialized) {
        initialized = true;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const readOnlyState = readManager.clone([] as any, state as any) as S;

        notifyListeners(createInitEvent(readOnlyState));
      }

      return fn(...args);
    } as T;
  }

  /**
   * `makePathFactoryAware` is a higher-order function that wraps the CRUD
   * functions of the **access layer** to ensure only paths created by the
   * store's pathFactory are used.
   *
   * @typeParam T - the function being wrapped
   */
  function makePathFactoryAware<T extends (...args: any[]) => unknown>(
    fn: T
  ): T {
    return function(...args) {
      const path = args[0];
      if (!fromFactory(path)) {
        throw Error("You must use paths created with store.path");
      }

      return fn(...args);
    } as T;
  }

  /**
   * `makeUpdateAware` is a higher-order function that wraps writers to ensure
   * that an update never includes any other writes.
   *
   * @typeParam T - the writer being wrapped
   */
  function makeUpdateAware<T extends (...args: any[]) => void>(writer: T): T {
    return function(...args) {
      if (activeUpdate) {
        throw Error("An update cannot include other writes");
      }

      writer(...args);
    } as T;
  }

  /**
   * `makeTransactionAware` is a higher-order function that wraps writers to provide
   * transaction-awareness. The execution of writes is delayed until the end of the
   * transaction.
   *
   * @typeParam T - the writer being wrapped
   */
  function makeTransactionAware<T extends (...args: any[]) => void>(
    writer: T
  ): T {
    return function(...args): void {
      if (activeTransaction) {
        transactionWrites.push(function() {
          writer(...args);
        });
      } else {
        writer(...args);
      }
    } as T;
  }

  /**
   * `enhanceWriter` is a higher-order function that wraps a writer with pathFactory,
   * update, transaction, and init awareness.
   *
   * @typeParam T - the writer being wrapped
   */
  function enhanceWriter<T extends (...args: any[]) => void>(writer: T): T {
    return makeInitAware(
      makeTransactionAware(makeUpdateAware(makePathFactoryAware(writer)))
    );
  }

  /**
   * Reads a value from the store.
   *
   * @remarks
   * The value returned is completely frozen (i.e immutable)
   *
   * @typeParam P - the path of the value
   * @typeParam V - the type of value at P
   */
  function get<P extends Path<S>, V extends StoreValue>(
    path: P | PathFor<S, V>,
    meta: StoreRecord | null = null
  ): Value<S, P, V> {
    const value = readManager.clone(path, getByPath(state, path));

    announce(createGetEvent(path as Path<S>, value as StoreValue, meta));

    return value;
  }

  /**
   * Sets a value in the store.
   *
   * @remarks
   * The value passed to `set` is cloned to ensure immutability.
   *
   * @typeParam P - the path of the value
   * @typeParam V - the type of value at P
   */
  function set<P extends Path<S>, V extends StoreValue>(
    path: P | PathFor<S, V>,
    value: Value<S, P, V>,
    meta: StoreRecord | null = null
  ): void {
    let prevValue: Value<S, P, V> | null = null;

    value = clone(value as StoreValue) as Value<S, P, V>;

    if (path.length === 0) {
      // will never use this `state` again, so it's okay if it gets frozen
      prevValue = state as Value<S, P, V>;

      readManager.reset();
      state = value as S;
    } else {
      const container = getContainer(state, path);
      const key = path[path.length - 1];

      if (Object.prototype.hasOwnProperty.call(container, key)) {
        prevValue = Reflect.get(container, key);

        readManager.reconcile(
          computePathLineage(path, prevValue as Value<S, P, V>)
        );
      }

      Reflect.set(container, key, value);
    }

    announce(
      createSetEvent(
        path as Path<S>,
        prevValue as StoreValue,
        readManager.clone(path, value) as StoreValue,
        meta
      )
    );
  }

  /**
   * Updates a value in the store.
   *
   * @remarks
   * The updated value, either the value passed to or returned from the updater,
   * is cloned to ensure immutability
   *
   * @typeParam P - the path of the value
   * @typeParam V - the type of value at P
   */
  function update<P extends Path<S>, V extends StoreValue>(
    path: P | PathFor<S, V>,
    updater: Updater<Value<S, P, V>>,
    meta: StoreRecord | null = null
  ): void {
    activeUpdate = true;

    let prevValue: Value<S, P, V>;
    let value: Value<S, P, V>;
    if (path.length === 0) {
      prevValue = readManager.clone(path, getByPath(state, path));
      readManager.reset();

      // will never use this `state` again, so we can allow it to be mutated directly
      value = state as Value<S, P, V>;
      const updatedValue = updater(value);
      if (updatedValue !== undefined) {
        value = updatedValue;
      }

      state = clone(value as StoreValue) as S;
    } else {
      const container = getContainer(state, path);
      const key = path[path.length - 1];

      if (!Object.prototype.hasOwnProperty.call(container, key)) {
        throw Error(`${path} does not exist`);
      }

      value = Reflect.get(container, key);
      prevValue = readManager.clone(path, value);

      readManager.reconcile(computePathLineage(path, prevValue));

      const updatedValue = updater(value);
      if (updatedValue !== undefined) {
        value = updatedValue;
      }

      value = clone(value as StoreValue) as Value<S, P, V>;

      Reflect.set(container, key, value);
    }

    activeUpdate = false;

    announce(
      createUpdateEvent(
        path as Path<S>,
        prevValue as StoreValue,
        readManager.clone(path, value) as StoreValue,
        meta
      )
    );
  }

  /**
   * Removes a value from the store.
   *
   * @typeParam P - the path of the value
   * @typeParam V - the type of value at P
   */
  function remove<P extends Path<S>, V extends StoreValue>(
    path: P | PathFor<S, V>,
    meta: StoreRecord | null = null
  ): void {
    if (path.length === 0) {
      throw Error("remove must be called with path.length >= 1");
    }

    const container = getContainer(state, path);
    const key = path[path.length - 1];
    const prevValue: Value<S, P, V> = Reflect.get(container, key);

    if (!Object.prototype.hasOwnProperty.call(container, key)) {
      throw Error(`${path} does not exist`);
    }

    Reflect.deleteProperty(container, key);

    readManager.reconcile(computePathLineage(path, prevValue));

    announce(createRemoveEvent(path as Path<S>, prevValue as StoreValue, meta));
  }

  /**
   * Lets you compose CRUD operations into an atomic operation.
   *
   * @remarks
   * Transactions must be synchronous.
   *
   * If you suspend your transaction (e.g. `await`), then all the CRUD events
   * that happen during suspension will be considered part of the transaction.
   *
   * If you try to add operations in a callback or `Promise` handler, then those
   * operations will not be included in the transaction.
   *
   * Gact cannot ensure that your transaction is synchronous. However, one way in which
   * a transaction's asynchrony will be revealed is attempting multiple simultaneous
   * transactions.
   */
  function transaction(
    runTransaction: () => void,
    meta: StoreRecord | null = null
  ): void {
    if (activeUpdate) {
      throw Error("Cannot run a transaction during an update");
    }

    if (activeTransaction) {
      throw Error(
        "Only one transaction can run at a time. Hint: make sure your transactions are synchronous"
      );
    }

    activeTransaction = true;

    // process transaction
    runTransaction();
    transactionWrites.forEach(function(write) {
      write();
    });

    const event = createTransactionEvent(transactionEvents, meta);

    // reset
    transactionWrites = [];
    transactionEvents = [];
    activeTransaction = false;

    notifyListeners(event);
  }

  /**
   * Ensures the integrity of the set of listeners.
   *
   * We cannot have the set of listeners change as we loop through them to notify
   * of a write.
   */
  function canMutateSubscriptions(): boolean {
    return !activeUpdate && !activeTransaction;
  }

  /**
   * Subscribes the provided listener to the stream of store events.
   */
  function subscribe(listener: Listener<S>): () => void {
    if (!canMutateSubscriptions()) {
      throw Error("Cannot subscribe during an update or transaction");
    }

    listeners.add(listener);

    return function unsubscribe(): void {
      if (!canMutateSubscriptions()) {
        throw Error("Cannot unsubscribe during an update or transaction");
      }

      listeners.delete(listener);
    };
  }

  return deepFreeze({
    subscribe,
    canMutateSubscriptions,
    path,
    get: makeInitAware(makePathFactoryAware(get)),
    set: enhanceWriter(set),
    update: enhanceWriter(update),
    remove: enhanceWriter(remove),
    transaction: makeInitAware(transaction)
  });
}
