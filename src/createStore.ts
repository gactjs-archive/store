import {
  CRUDEvent,
  EventType,
  GetEvent,
  InitEvent,
  Listener,
  PathFor,
  RemoveEvent,
  SetEvent,
  Store,
  StoreEvent,
  StoreRecord,
  StoreValue,
  TransactionEvent,
  UpdateEvent,
  Updater
} from "./types";
import { clone } from "./utils/clone";
import { computePathLineage } from "./utils/computePathLineage";
import { createPathFactory } from "./utils/createPathFactory";
import { createReadManager } from "./utils/createReadManager";
import { deepFreeze } from "./utils/deepFreeze";
import { getByPath } from "./utils/getByPath";
import { getContainer } from "./utils/getContainer";

function createInitEvent<S extends StoreValue>(state: S): InitEvent<S> {
  return deepFreeze({ state, type: EventType.Init });
}

function createGetEvent<S extends StoreValue, V extends StoreValue>(
  path: PathFor<S, V>,
  value: V,
  meta: StoreRecord | null
): GetEvent<S, V> {
  return deepFreeze({ meta, path, type: EventType.Get, value });
}

function createSetEvent<S extends StoreValue, V extends StoreValue>(
  path: PathFor<S, V>,
  prevValue: V | null,
  value: V,
  meta: StoreRecord | null
): SetEvent<S, V> {
  return deepFreeze({
    meta,
    path,
    prevValue,
    type: EventType.Set,
    value
  });
}

function createUpdateEvent<S extends StoreValue, V extends StoreValue>(
  path: PathFor<S, V>,
  prevValue: V,
  value: V,
  meta: StoreRecord | null
): UpdateEvent<S, V> {
  return deepFreeze({
    meta,
    path,
    prevValue,
    type: EventType.Update,
    value
  });
}

function createRemoveEvent<S extends StoreValue, V extends StoreValue>(
  path: PathFor<S, V>,
  prevValue: V,
  meta: StoreRecord | null
): RemoveEvent<S, V> {
  return deepFreeze({
    meta,
    path,
    prevValue,
    type: EventType.Remove
  });
}

function createTransactionEvent<S extends StoreValue>(
  transactionEvents: Array<CRUDEvent<S>>,
  meta: StoreRecord | null
): TransactionEvent<S> {
  return deepFreeze({
    events: transactionEvents,
    meta,
    type: EventType.Transaction
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
  function notifyListeners<V extends StoreValue>(
    event: StoreEvent<S, V>
  ): void {
    for (const listener of listeners) {
      listener(event as StoreEvent<S>);
    }
  }

  /**
   * `announce` enhances `notifyListeners` with transaction-awareness.
   *
   * If we are in the middle of a transaction, then each event is added
   * to the transaction events. Otherwise, we notify listeners like normal.
   *
   */
  function announce<V extends StoreValue>(event: CRUDEvent<S, V>): void {
    if (activeTransaction) {
      transactionEvents.push((event as unknown) as CRUDEvent<S>);
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
  function get<V extends StoreValue>(
    path: PathFor<S, V>,
    meta: StoreRecord | null = null
  ): V {
    const value = readManager.clone(path, getByPath(state, path));

    announce(createGetEvent(path, value, meta));

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
  function set<V extends StoreValue>(
    path: PathFor<S, V>,
    value: V,
    meta: StoreRecord | null = null
  ): void {
    let prevValue: V | null = null;

    value = clone(value); //as Value<S, P, V>;

    if (path.length === 0) {
      // will never use this `state` again, so it's okay if it gets frozen
      prevValue = (state as unknown) as V;

      readManager.reset();
      state = (value as unknown) as S;
    } else {
      const container = getContainer(state, path);
      const key = path[path.length - 1];

      if (Object.prototype.hasOwnProperty.call(container, key)) {
        prevValue = Reflect.get(container, key);

        readManager.reconcile(computePathLineage(path, prevValue));
      }

      Reflect.set(container, key, value);
    }

    announce(
      createSetEvent(path, prevValue, readManager.clone(path, value), meta)
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
  function update<V extends StoreValue>(
    path: PathFor<S, V>,
    updater: Updater<V>,
    meta: StoreRecord | null = null
  ): void {
    activeUpdate = true;

    let prevValue: V;
    let value: V;
    if (path.length === 0) {
      prevValue = readManager.clone(path, getByPath(state, path));
      readManager.reset();

      // will never use this `state` again, so we can allow it to be mutated directly
      value = (state as unknown) as V;
      const updatedValue = updater(value);
      if (updatedValue !== undefined) {
        value = updatedValue;
      }

      state = (clone(value) as unknown) as S;
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

      value = clone(value);

      Reflect.set(container, key, value);
    }

    activeUpdate = false;

    announce(
      createUpdateEvent(path, prevValue, readManager.clone(path, value), meta)
    );
  }

  /**
   * Removes a value from the store.
   *
   * @typeParam P - the path of the value
   * @typeParam V - the type of value at P
   */
  function remove<V extends StoreValue>(
    path: PathFor<S, V>,
    meta: StoreRecord | null = null
  ): void {
    if (path.length === 0) {
      throw Error("remove must be called with path.length >= 1");
    }

    const container = getContainer(state, path);
    const key = path[path.length - 1];
    const prevValue: V = Reflect.get(container, key);

    if (!Object.prototype.hasOwnProperty.call(container, key)) {
      throw Error(`${path} does not exist`);
    }

    Reflect.deleteProperty(container, key);

    readManager.reconcile(computePathLineage(path, prevValue));

    announce(createRemoveEvent(path, prevValue, meta));
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
    canMutateSubscriptions,
    get: makeInitAware(makePathFactoryAware(get)),
    path,
    remove: enhanceWriter(remove),
    set: enhanceWriter(set),
    subscribe,
    transaction: makeInitAware(transaction),
    update: enhanceWriter(update)
  });
}
