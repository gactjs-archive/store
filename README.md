# store

![CircleCI](https://img.shields.io/circleci/build/github/gactjs/store?style=for-the-badge)
![Coveralls github](https://img.shields.io/coveralls/github/gactjs/store?style=for-the-badge)
![GitHub](https://img.shields.io/github/license/gactjs/store?style=for-the-badge)
![npm](https://img.shields.io/npm/v/@gact/store?store=for-the-badge)
![npm bundle size](https://img.shields.io/bundlephobia/min/@gact/store?style=for-the-badge)

The Gact store combines a carefully engineered `StoreValue` and **access layer** to achieve: a **decoupled state interface**, **serializability**, **immutability**, **exact change tracking**, and **event sourcing** with practically zero boilerplate and overhead. The fusion of the aforementioned features forms the only suitable state model for UIs: an **accountable centralized state tree**.

## API

### `createStore(initialState)`

Creates a Gact store.

#### Arguments

1. initialState (`StoreValue`)

#### Returns

(`Store`): A Gact store, which holds the complete state tree of your app.

You interact with your state through the store's **access layer**, which is comprised of the following functions:

- `path`: constructs a path, which declares the value you want to operate on
- `get`: reads a value from the store
- `set`: sets a value in the store
- `update`: updates a value in the store
- `remove`: removes a value from the store
- `transaction`: allows you to compose the four CRUD operations into an atomic operation

#### Example

```ts
import { createStore } from "@gact/store";

type State = {
  count: number;
  balances: Record<string, number>;
};

const initialState: State = {
  count: 0,
  balances: {
    john: 1000,
    jane: 500,
    bad: 1000000000
  }
};

// create a store
const store = createStore(initialState);

// destructure the core interface
const { path, get, set, update, remove, transaction } = store;

// read a value
const count = get(path("count"));

// set a value
set(path("count"), 100);

// update a value
update(path("count"), c => c + 50);

// remove a value
remove(path("balances", "bad"));

// create a complex atomic operation with transaction
transaction(function() {
  const count = get(path("count"));
  const johnBalance = get(path("balances", "john"));
  if (johnBalance > count) {
    update(path("balances", "john"), b => b - count);
    update(path("balances", "jane"), b => b + count);
  }
});
```

### `computePathLineage(path, value)`

Computes the set of paths containing the path itself, ancestors, and descendants.

`computePathLineage` will generally be used by libraries that implement reactivity with **exact change tracking**.

#### Arguments

1. path (`Path`): the path of the value
2. value (`StoreValue`): the value at the given path

#### Returns

(`Set<Path>`): the set of paths containing the path itself, ancestors, and descendants.

#### Example

```ts
import { computePathLineage } from "@gact/store"

const value = {
  c: {
    d: true
  }
  e: [0],
  f: "d"
}

const state = {
    a: {
        b: value,
        ...
    },
    ...
}

// Set {[], ["a"], ["a", "b"], ["a", "b", "c"], ["a", "b", "c", "d"], ["a", "b", "e"], ["a", "b", "e", 0], ["a", "b", "f"] }
const pathLineage = computePathLineage(["a", "b"], value);
```
