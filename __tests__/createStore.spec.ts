import { createStore, EventType } from "../src";

describe("createStore", function() {
  type State = {
    a: string;
    b: {
      c: bigint;
    };
    d: Array<number>;
    e: Record<string, string>;
  };

  const initialState: State = {
    a: "a",
    b: {
      c: BigInt(0)
    },
    d: [],
    e: {}
  };

  const fullInitialState: State = {
    a: "a",
    b: {
      c: BigInt(1000)
    },
    d: [0, 1, 2],
    e: { bob: "cool", jane: "cool" }
  };

  test("createStore", function() {
    expect(function() {
      createStore(initialState);
    }).not.toThrow();
  });

  test("store is frozen", function() {
    const store = createStore(initialState);

    expect(function() {
      store.get = jest.fn();
    }).toThrow();
  });

  describe("get", function() {
    const { get, path } = createStore(fullInitialState);

    test("root", function() {
      expect(get(path())).toStrictEqual(fullInitialState);
    });

    test("scalar", function() {
      expect(get(path("a"))).toBe("a");
    });

    test("deep scalar", function() {
      expect(get(path("b", "c"))).toBe(BigInt(1000));

      expect(get(path("d", 0))).toBe(0);

      expect(get(path("e", "bob"))).toBe("cool");
      expect(get(path("e", "jane"))).toBe("cool");
    });

    test("value immutability", function() {
      const d = get(path("d"));
      expect(function() {
        d[0] = 1;
      }).toThrow();

      const e = get<Record<string, string>>(path("e"));
      expect(function() {
        e.bob = "not cool";
      }).toThrow();
    });

    test("trying to get with a path not from store.path throws", function() {
      expect(function() {
        get(["a"]);
      }).toThrow();
    });

    test("trying to get a nonexistent value throws", function() {
      expect(function() {
        get(path("e", "rob"));
      }).toThrowError("does not exist");
    });
  });

  describe("set", function() {
    test("root", function() {
      const { path, get, set } = createStore(initialState);

      set(path(), fullInitialState);
      expect(get(path())).toStrictEqual(fullInitialState);
    });

    test("scalar", function() {
      const { path, get, set } = createStore(initialState);

      set<string>(path("a"), "b");
      expect(get(path("a"))).toBe("b");
    });

    test("deep scalar", function() {
      const { path, get, set } = createStore(initialState);

      set<number>(path("d", 0), 1);
      expect(get(path("d", 0))).toBe(1);

      set<bigint>(path("b", "c"), BigInt(1000));
      expect(get(path("b", "c"))).toBe(BigInt(1000));
    });

    test("set value immutability", function() {
      const { path, set, get } = createStore(initialState);

      const newB = {
        c: BigInt(1000)
      };

      set(path("b"), newB);

      newB.c = BigInt(5000);

      expect(get(path("b", "c"))).toBe(BigInt(1000));
    });

    test("trying to set with a path not from store.path throws", function() {
      const { set } = createStore(initialState);
      expect(function() {
        set<string>(["a"], "b");
      }).toThrow();
    });
  });

  describe("update", function() {
    test("replace root", function() {
      const { path, get, update } = createStore(initialState);

      update(path(), () => fullInitialState);

      expect(get(path())).toStrictEqual(fullInitialState);
    });

    test("mutate root", function() {
      const { path, get, update } = createStore(initialState);

      const newA = "aa";
      const newB = {
        c: BigInt(1000)
      };
      const newD = [0, 1, 2];
      const newE = { bob: "cool", jane: "cool" };

      update<State>(path(), function(newState) {
        newState.a = newA;
        newState.b = newB;
        newState.d = newD;
        newState.e = newE;
      });

      expect(get(path("a"))).toBe(newA);
      expect(get(path("b"))).toStrictEqual(newB);
      expect(get(path("d"))).toStrictEqual(newD);
      expect(get(path("e"))).toStrictEqual(newE);
    });

    test("scalar", function() {
      const { path, get, update } = createStore(initialState);

      update(path("a"), a => a + "a");
      expect(get(path("a"))).toBe("aa");
    });

    test("deep", function() {
      const { path, get, update } = createStore(initialState);

      update<bigint>(path("b", "c"), d => d + BigInt(1000));
      expect(get(path("b", "c"))).toBe(BigInt(1000));
    });

    test("updates through mutation work", function() {
      const { path, get, update } = createStore(initialState);
      update<Array<number>>(path("d"), function(d) {
        d.push(0);
      });

      expect(get(path("d", 0))).toBe(0);
    });

    test("prevents mutation through the input to updater", function() {
      const { path, get, update } = createStore(initialState);
      const oldD = get(path("d"));
      let newD: Array<number> = [];
      update<Array<number>>(path("d"), function(d) {
        newD = d;
      });

      newD.push(0);

      expect(get(path("d"))).toStrictEqual(oldD);
    });

    test("updated value immutability", function() {
      const { path, get, update } = createStore(initialState);
      const newD = [0, 1, 2];

      update(path("d"), () => newD);

      // mutate external value
      newD.push(3);

      const expectedD = [0, 1, 2];
      expect(get(path("d"))).toStrictEqual(expectedD);
    });

    test("attempting another write during an update throws", function() {
      const { path, set, update } = createStore(initialState);

      expect(function() {
        update(path("a"), function(a) {
          set(path("b", "c"), BigInt(1000));
          return a + "a";
        });
      }).toThrow("cannot include other writes");
    });

    test("updating a nonexistent value throws", function() {
      const { path, update } = createStore(initialState);

      expect(function() {
        update<number>(path("d", 0), n => n + 1000);
      }).toThrowError("does not exist");
    });

    test("trying to update with a path not from store.path throws", function() {
      const { update } = createStore(initialState);
      expect(function() {
        update(["a"], a => a + "a");
      }).toThrow();
    });
  });

  describe("remove", function() {
    test("cannot remove the root", function() {
      const { path, remove } = createStore(fullInitialState);

      expect(function() {
        remove(path());
      }).toThrowError("must be called with path.length >= 1");
    });

    test("deletes items are removed", function() {
      const { path, get, remove } = createStore(fullInitialState);
      remove(path("d", 2));

      expect(function() {
        get(path("d", 2));
      }).toThrow();
    });

    test("deleting a nonexistent value throws", function() {
      const { path, remove } = createStore(initialState);

      expect(function() {
        remove(path("d", 3));
      }).toThrowError("does not exist");
    });
  });

  describe("transaction", function() {
    test("processes multiple writes", function() {
      const { path, get, set, update, remove, transaction } = createStore(
        fullInitialState
      );

      transaction(function() {
        set<string>(path("a"), "aa");

        update<Array<number>>(path("d"), function(d) {
          d.push(3);
        });

        remove(path("e", "bob"));
      });

      expect(get(path("a"))).toBe("aa");
      expect(get(path("d"))).toStrictEqual([0, 1, 2, 3]);
      expect(function() {
        get(path("e", "bob"));
      }).toThrow();
    });

    test("write atomicity", function() {
      const { path, get, set, update, transaction } = createStore(initialState);

      transaction(function() {
        set(path("b", "c"), BigInt(1));
        // this will only be true if the previous set is not handled atomically
        if (get(path("b", "c"))) {
          update<bigint>(path("b", "c"), c => c + BigInt(1));
        }
      });

      expect(get(path("b", "c"))).toBe(BigInt(1));
    });

    test("attempting to run a transaction during an update throws", function() {
      const { path, update, transaction } = createStore(initialState);

      expect(function() {
        update(path("a"), function(a) {
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          transaction(function() {});
          return a + "a";
        });
      }).toThrow();
    });

    test("trying to run two transaction simultaneously throws", function() {
      const { transaction } = createStore(initialState);

      expect(function() {
        transaction(function() {
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          transaction(function() {});
        });
      }).toThrowError("one transaction can run at a time");
    });
  });

  describe("subscribe", function() {
    test("subscriber receives event stream", function() {
      const {
        path,
        get,
        set,
        update,
        remove,
        transaction,
        subscribe
      } = createStore(fullInitialState);
      const subscriber = jest.fn();
      subscribe(subscriber);

      get(path());
      set(path(), fullInitialState);
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      update(path(), function() {});
      remove(path("e", "bob"));
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      transaction(function() {});

      // init, get, set, update, remove, transaction
      expect(subscriber).toHaveBeenCalledTimes(6);
    });

    test("subscriber stops receiving requests after unsubscribing", function() {
      const {
        path,
        get,
        set,
        update,
        remove,
        transaction,
        subscribe
      } = createStore(fullInitialState);
      const subscriber = jest.fn();
      const unsubscribe = subscribe(subscriber);
      unsubscribe();

      get(path());
      set(path(), fullInitialState);
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      update(path(), function() {});
      remove(path("e", "bob"));
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      transaction(function() {});

      expect(subscriber.mock.calls.length).toBe(0);
    });

    test("trying to subscribe during an update throws", function() {
      const { path, update, subscribe } = createStore(initialState);

      expect(function() {
        update(path(), function() {
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          subscribe(function() {});
        });
      }).toThrowError("Cannot subscribe during an update or transaction");
    });

    test("trying to subscribe during a transaction throws", function() {
      const { transaction, subscribe } = createStore(initialState);

      expect(function() {
        transaction(function() {
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          subscribe(function() {});
        });
      }).toThrowError("Cannot subscribe during an update or transaction");
    });

    test("trying to unsubscribe during an update throws", function() {
      const { path, update, subscribe } = createStore(initialState);

      expect(function() {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const unsubscribe = subscribe(function() {});
        update(path(), function() {
          unsubscribe();
        });
      }).toThrowError("Cannot unsubscribe during an update or transaction");
    });

    test("trying to unsubscribe during a transaction throws", function() {
      const { transaction, subscribe } = createStore(initialState);

      expect(function() {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const unsubscribe = subscribe(function() {});
        transaction(function() {
          unsubscribe();
        });
      }).toThrowError("Cannot unsubscribe during an update or transaction");
    });
  });

  describe("canMutateSubscriptions", function() {
    const { canMutateSubscriptions } = createStore(initialState);

    test("returns true if in the middle of an update or transaction", function() {
      expect(canMutateSubscriptions()).toBe(true);
    });

    test("returns false if in the middle of an update", function() {
      const { path, update, canMutateSubscriptions } = createStore(
        initialState
      );
      update(path(), function() {
        expect(canMutateSubscriptions()).toBe(false);
      });
    });

    test("returns false if in the middle of a transaction", function() {
      const { transaction, canMutateSubscriptions } = createStore(initialState);
      transaction(function() {
        expect(canMutateSubscriptions()).toBe(false);
      });
    });
  });

  describe("event stream", function() {
    const testMeta = {
      test: true
    };

    test("event are immutable", function() {
      const {
        path,
        get,
        set,
        update,
        remove,
        transaction,
        subscribe
      } = createStore(initialState);
      const subscriber = jest.fn();
      subscribe(subscriber);

      get(path());
      set(path(), fullInitialState);
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      update(path(), function() {});
      remove(path("e", "bob"));
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      transaction(function() {});

      const initEvent = subscriber.mock.calls[0][0];
      const getEvent = subscriber.mock.calls[0][0];
      const setEvent = subscriber.mock.calls[0][0];
      const updateEvent = subscriber.mock.calls[0][0];
      const RemoveEvent = subscriber.mock.calls[0][0];
      const transactionEvent = subscriber.mock.calls[0][0];

      expect(function() {
        initEvent.extra = true;
      }).toThrow;

      expect(function() {
        getEvent.extra = true;
      }).toThrow;

      expect(function() {
        setEvent.extra = true;
      }).toThrow;

      expect(function() {
        updateEvent.extra = true;
      }).toThrow;

      expect(function() {
        RemoveEvent.extra = true;
      }).toThrow;

      expect(function() {
        transactionEvent.extra = true;
      }).toThrow;
    });

    test("emits expected init event", function() {
      const { path, get, subscribe } = createStore(initialState);
      const subscriber = jest.fn();
      subscribe(subscriber);
      get(path());
      const receivedInitEvent = subscriber.mock.calls[0][0];
      const expectedInitEvent = {
        state: initialState,
        type: EventType.Init
      };

      expect(receivedInitEvent).toStrictEqual(expectedInitEvent);
    });

    test("emits expected get event", function() {
      const { path, get, subscribe } = createStore(initialState);
      const subscriber = jest.fn();
      subscribe(subscriber);
      get(path());
      const receivedGetEvent = subscriber.mock.calls[1][0];
      const expectedInitEvent = {
        meta: null,
        path: [],
        type: EventType.Get,
        value: initialState
      };

      expect(receivedGetEvent).toStrictEqual(expectedInitEvent);
    });

    test("emits expected get event with provided meta", function() {
      const { path, get, subscribe } = createStore(initialState);
      const subscriber = jest.fn();
      subscribe(subscriber);
      get(path(), testMeta);
      const receivedGetEvent = subscriber.mock.calls[1][0];
      const expectedInitEvent = {
        meta: testMeta,
        path: [],
        type: EventType.Get,
        value: initialState
      };

      expect(receivedGetEvent).toStrictEqual(expectedInitEvent);
    });

    test("emits expected set event", function() {
      const { path, set, subscribe } = createStore(initialState);
      const subscriber = jest.fn();
      subscribe(subscriber);
      set(path(), fullInitialState);
      const receivedSetEvent = subscriber.mock.calls[1][0];
      const expectedSetEvent = {
        meta: null,
        path: [],
        prevValue: initialState,
        type: EventType.Set,
        value: fullInitialState
      };

      expect(receivedSetEvent).toStrictEqual(expectedSetEvent);
    });

    test("emits expected set event with provided meta", function() {
      const { path, set, subscribe } = createStore(initialState);
      const subscriber = jest.fn();
      subscribe(subscriber);
      set(path(), fullInitialState, testMeta);
      const receivedSetEvent = subscriber.mock.calls[1][0];
      const expectedSetEvent = {
        meta: testMeta,
        path: [],
        prevValue: initialState,
        type: EventType.Set,
        value: fullInitialState
      };

      expect(receivedSetEvent).toStrictEqual(expectedSetEvent);
    });

    test("emits expected update event", function() {
      const { path, update, subscribe } = createStore(initialState);
      const subscriber = jest.fn();
      subscribe(subscriber);
      update(path(), () => fullInitialState);
      const receivedUpdateEvent = subscriber.mock.calls[1][0];
      const expectedUpdateEvent = {
        meta: null,
        path: [],
        prevValue: initialState,
        type: EventType.Update,
        value: fullInitialState
      };

      expect(receivedUpdateEvent).toStrictEqual(expectedUpdateEvent);
    });

    test("emits expected update event with provided meta", function() {
      const { path, update, subscribe } = createStore(initialState);
      const subscriber = jest.fn();
      subscribe(subscriber);
      update(path(), () => fullInitialState, testMeta);
      const receivedUpdateEvent = subscriber.mock.calls[1][0];
      const expectedUpdateEvent = {
        meta: testMeta,
        path: [],
        prevValue: initialState,
        type: EventType.Update,
        value: fullInitialState
      };

      expect(receivedUpdateEvent).toStrictEqual(expectedUpdateEvent);
    });

    test("emits expected remove event", function() {
      const { path, remove, subscribe } = createStore(fullInitialState);
      const subscriber = jest.fn();
      subscribe(subscriber);
      remove(path("e", "bob"));
      const receivedRemoveEvent = subscriber.mock.calls[1][0];
      const expectedRemoveEvent = {
        meta: null,
        path: ["e", "bob"],
        prevValue: "cool",
        type: EventType.Remove
      };

      expect(receivedRemoveEvent).toStrictEqual(expectedRemoveEvent);
    });

    test("emits expected remove event with provided meta", function() {
      const { path, remove, subscribe } = createStore(fullInitialState);
      const subscriber = jest.fn();
      subscribe(subscriber);
      remove(path("e", "bob"), testMeta);
      const receivedRemoveEvent = subscriber.mock.calls[1][0];
      const expectedRemoveEvent = {
        meta: testMeta,
        path: ["e", "bob"],
        prevValue: "cool",
        type: EventType.Remove
      };

      expect(receivedRemoveEvent).toStrictEqual(expectedRemoveEvent);
    });

    test("emits expected transaction event", function() {
      const {
        path,
        get,
        set,
        update,
        remove,
        transaction,
        subscribe
      } = createStore(fullInitialState);
      const subscriber = jest.fn();
      subscribe(subscriber);
      transaction(function() {
        set<string>(path("a"), "aa");

        update<Array<number>>(path("d"), function(b) {
          b.push(3);
        });

        if (get<Array<number>>(path("d")).length > 1) {
          remove(path("e", "bob"));
        }
      });
      const receivedTransactionEvent = subscriber.mock.calls[1][0];
      const expectedTransactionEvent = {
        events: [
          { meta: null, path: ["d"], type: EventType.Get, value: [0, 1, 2] },
          {
            meta: null,
            path: ["a"],
            prevValue: "a",
            type: EventType.Set,
            value: "aa"
          },
          {
            meta: null,
            path: ["d"],
            prevValue: [0, 1, 2],
            type: EventType.Update,
            value: [0, 1, 2, 3]
          },
          {
            meta: null,
            path: ["e", "bob"],
            prevValue: "cool",
            type: EventType.Remove
          }
        ],
        meta: null,
        type: "TRANSACTION"
      };

      expect(receivedTransactionEvent).toStrictEqual(expectedTransactionEvent);
    });

    test("emits expected transaction event with provided meta", function() {
      const {
        path,
        get,
        set,
        update,
        remove,
        transaction,
        subscribe
      } = createStore(fullInitialState);
      const subscriber = jest.fn();
      subscribe(subscriber);
      transaction(function() {
        set<string>(path("a"), "aa");

        update<Array<number>>(path("d"), function(b) {
          b.push(3);
        });

        if (get<Array<number>>(path("d")).length > 1) {
          remove(path("e", "bob"));
        }
      }, testMeta);
      const receivedTransactionEvent = subscriber.mock.calls[1][0];
      const expectedTransactionEvent = {
        events: [
          { meta: null, path: ["d"], type: EventType.Get, value: [0, 1, 2] },
          {
            meta: null,
            path: ["a"],
            prevValue: "a",
            type: EventType.Set,
            value: "aa"
          },
          {
            meta: null,
            path: ["d"],
            prevValue: [0, 1, 2],
            type: EventType.Update,
            value: [0, 1, 2, 3]
          },
          {
            meta: null,
            path: ["e", "bob"],
            prevValue: "cool",
            type: EventType.Remove
          }
        ],
        meta: testMeta,
        type: "TRANSACTION"
      };

      expect(receivedTransactionEvent).toStrictEqual(expectedTransactionEvent);
    });
  });
});
