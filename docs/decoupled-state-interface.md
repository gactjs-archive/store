# Decoupled State Interface

- [Introduction](#introduction)
- [Redux](#redux)
  - [Single Counter Example](#redux-simple-counter-example)
  - [Many Counters Example](#redux-many-counters-example)
  - [External Component](#redux-external-component)
- [Gact Store](#gact-store)
  - [Single Counter Example](#gact-store-simple-counter-example)
  - [Many Counters Example](#gact-store-many-counters-example)
  - [External Component](#gact-store-external-component)
- [Comparison](#comparison)
- [Conclusion](#conclusion)

<a name="introduction"></a>

# Introduction

Reusable code that relies on a global store must not encode assumptions about the state tree. A **decoupled state interface** allows you to interact with a global state tree in a general, resuable manner. In this article, we will explore the ways [Redux](https://github.com/reduxjs/redux) and the [Gact store](https://github.com/gactjs/store/) facilitate **decoupled state interface**s.

<a name="redux"></a>

## Redux

You read from [Redux](https://github.com/reduxjs/redux) with selectors. You write to [Redux](https://github.com/reduxjs/redux) by dispatching actions. Thus, a reusable component that relies on [Redux](https://github.com/reduxjs/redux) takes selectors and action creators as props.

<a name="redux-simple-counter-example"></a>

### Single Counter Example

Let's explore a `Counter` example:

#### Store

```ts
import { createSlice, configureStore } from "@reduxjs/toolkit";

export const counterSlice = createSlice({
  name: "counter",
  initialState: 0,
  reducers: {
    increment(draft) {
      return draft + 1;
    },
    decrement(draft) {
      return draft + 1;
    }
  }
});

export const { actions } = counterSlice;

export const store = configureStore({
  reducer: counterSlice.reducer
});

export type State = ReturnType<typeof store["getState"]>;

export const selectCount = (state: State) => state;
```

#### Component

```ts
import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { State } from "store";

type Props = {
  countSelector: (state: State) => number;
  actions: {
    increment: () => void;
    decrement: () => void;
  };
};

export default function Counter({ countSelector, actions }: Props) {
  const dispatch = useDispatch();
  const count = useSelector(countSelector);

  function increment() {
    dispatch(actions.increment());
  }

  function decrement() {
    dispatch(actions.decrement());
  }

  return (
    <div>
      <button onClick={decrement}>-</button> {count}
      <button onClick={increment}>+</button>
    </div>
  );
}
```

#### Usage

```ts
import * as React from "react";
import { Provider } from "react-redux";

import { store, actions, selectCount } from "store";
import Counter from "Counter";

export default function App() {
  return (
    <Provider store={store}>
      <Counter selectCount={selectCount} actions={actions} />
    </Provider>
  );
}
```

<a name="redux-many-counters-example"></a>

### Many Counters Example

Let's say our app needs many `Counter`s. Below we establish a pattern that we can use to support arbitrarily many `Counter`s.

#### Store

Notably, we create a `counterSliceFactory` to reuse our `counterSlice` creation code.

```ts
function counterSliceFactory(name: string) {
  return createSlice({
    name,
    initialState: 0,
    reducers: {
      increment(draft) {
        return count + 1;
      },
      decrement(draft) {
        return count + 1;
      }
    }
  });
}

const counterOneSlice = counterSliceFactory("counter-one");
const counterTwoSlice = counterSliceFactory("counter-two");

export const store = configureStore({
  reducer: {
    countOne: counterOneSlice.reducer,
    countTwo: counterTwoSlice.reducer
  }
});

export type State = ReturnType<typeof store["getState"]>;

export const { actions: countOneActions } = counterOneSlice;

export const { actions: countTwoActions } = counterTwoSlice;

export const selectCountOne = (state: State) => state.countOne;

export const selectCountTwo = (state: State) => state.countTwo;
```

#### Usage

```ts
import * as React from "react";
import { Provider } from "react-redux";

import {
  store,
  countOneActions,
  countTwoActions,
  selectCountOne,
  selectCountTwo
} from "store";
import Counter from "Counter";

export default function App() {
  return (
    <Provider store={store}>
      <Counter selectCount={selectCountOne} actions={countOneActions} />
      <Counter selectCount={selectCountTwo} actions={countTwoActions} />
    </Provider>
  );
}
```

<a name="redux-external-component"></a>

### External Component

Let's package our `Counter` into an external package. The above examples were decoupled from particular elements in the state tree, but were still bound to a specific state tree (i.e our state tree). When we develop external components, we must not be tied to a particular state tree.

#### Library

We add a type parameter `S` so that our component can work with arbitrary state trees.

```ts
import React from "react";
import { useDispatch, useSelector } from "react-redux";

type Props<S> = {
  countSelector<S>: (state: S) => number;
  actions: {
      increment: () => void;
      decrement: () => void;
  }
}

export function Counter<S>({ countSelector, actions }: Props<S>) {
  const dispatch = useDispatch();
  const count = useSelector(countSelector);

  function increment() {
    dispatch(actions.increment());
  }

  function decrement() {
    dispatch(actions.decrement());
  }

  return (
    <div>
      <button onClick={decrement}>-</button> {count}
      <button onClick={increment}>+</button>
    </div>
  );
}

export function counterSliceFactory(name: string) {
  return createSlice({
    name,
    initialState: 0,
    reducers: {
      increment(draft) {
        return count + 1;
      },
      decrement(draft) {
        return count - 1;
      },
    },
  });
}
```

#### Create Store

This is almost the same as our many counters example expect that we use the `counterSliceFactory` provided by our library.

```ts
import { configureStore } from "@reduxjs/toolkit";
import { counterSliceFactory } from "...";

const counterOneSlice = counterSliceFactory("counter-one");
const counterTwoSlice = counterSliceFactory("counter-two");

export const store = configureStore({
  reducer: {
    countOne: counterOneSlice.reducer,
    countTwo: counterTwoSlice.reducer
  }
});

export type State = ReturnType<typeof store["getState"]>;

export const { actions: countOneActions } = counterOneSlice;

export const { actions: countTwoActions } = counterTwoSlice;

export const selectCountOne = (state: State) => state.countOne;

export const selectCountTwo = (state: State) => state.countTwo;
```

#### Usage

The key difference here is that we have to specify the type of our state, `State`, as the concrete type for our library `Counter`'s `S` type parameter.

```ts
import * as React from "react";
import { Provider } from "react-redux";

import {
  store,
  State,
  countOneActions,
  countTwoActions,
  selectCountOne,
  selectCountTwo
} from "store";
import Counter from "Counter";

export default function App() {
  return (
    <Provider store={store}>
      <Counter<State> selectCount={selectCountOne} actions={countOneActions} />
      <Counter<State> selectCount={selectCountTwo} actions={countTwoActions} />
    </Provider>
  );
}
```

<a name="gact-store"></a>

## Gact Store

The [Gact store](https://github.com/gactjs/store/) was specifcally designed to provide a **decoupled state interface**. The core insight underlying the [Gact store's](https://github.com/gactjs/store/) **decoupled state interface** is: code that interacts with the store requires specific types of state, but is agnostic to the location of this state. Therfore, the [Gact store](https://github.com/gactjs/store/) provides:

- a type to declare state requirements in a location-agnostic manner.
- an **access layer** to operate on state in a location-agnostic manner.

<a name="gact-store-simple-counter-example"></a>

### Single Counter Example

#### Store

```ts
import { createStore } from "@gact/store";
import { createBindings } from "@gact/react-store";

export type State = {
  count: number;
};

const initialState: State = {
  count: 0
};

const store = createStore(initialState);

// destructure and export the access layer
export const { path, get, set, update, remove, transaction } = store;

// destructure and export the React bindings
export const { useValue, withStore } = createBindings(store);
```

#### Component

```ts
import React from "react";
import { PathFor } from "@gact/store";

import { useValue, path, update, State } from "store";

type Props = {
  countPath: PathFor<State, number>;
};

export default function Counter({ countPath }: Props) {
  const count = useValue(countPath);

  function increment() {
    update(countPath, c => c + 1);
  }

  function decrement() {
    update(countPath, c => c - 1);
  }

  return (
    <div>
      <button onClick={decrement}>-</button> {count}
      <button onClick={increment}>+</button>
    </div>
  );
}
```

#### Usage

```ts
import React from "react";

import { path } from "store";
import Counter from "Counter";

export default function App() {
  return <Counter countPath={path("count")} />;
}
```

<a name="gact-store-many-counters-example"></a>

### Many Counters Example

Let's say our app needs many `Counter`s. The only thing we need to do to support many `Counter`s is define additional `count` elements in our state tree.

#### Store

```ts
import { createStore } from "@gact/store";
import { createBindings } from "@gact/react-store";

export type State = {
  countOne: number;
  countTwo: number;
};

const initialState: State = {
  count: 0
};

const store = createStore(initialState);

// destructure and export the access layer
export const { path, get, set, update, remove, transaction } = store;

// destructure and export the React bindings
export const { useValue, withStore } = createBindings(store);
```

#### Usage

```ts
import React from "react";

import { path } from "store";
import Counter from "Counter";

export default function App() {
  return (
    <>
      <Counter countPath={path("countOne")} />
      <Counter countPath={path("countTwo")} />
    </>
  );
}
```

<a name="gact-store-external-component"></a>

### External Component Example

As discussed in [Redux External Component](#redux-external-component), external components must not be tied to a particular state tree. The [Gact store](https://github.com/gactjs/store) supports this capabaility as well:

#### Component

We make use of the **create component pattern** to define a `Counter` that can be used by any app.

```ts
import React from "react";
import { Store, StoreValue, PathFor } from "@gact/store";
import { ReactStore } from "@gact/react-store";

type Props<S extends StoreValue> = {
    countPath: PathFor<S, number>;
}

export default function createCounter<S extends StoreValue>({ update, useValue}: ReactStore<S>)) {
  return function Counter({ countPath }: Props<S>) {
    const count = useValue(countPath);

    function increment() {
        update(countPath, c => c + 1);
    }

    function decrement() {
        update(countPath, c => c - 1);
    }

    return (
      <div>
        <button onClick={decrement}>-</button> {count}
        <button onClick={increment}>+</button>
     </div>
    );
  };
}
```

#### Usage

We create a `Counter` for our app by using `withStore`.

```ts
import React from "react";
import createCounter from "...";

import { path, withStore } from "store";

const Counter = withStore(createCounter);

function App() {
  return (
    <>
      <Counter countPath={path("countOne")} />
      <Counter countPath={path("countTwo")} />
    </>
  );
}
```

<a name="comparison"></a>

## Comparison

[Redux](https://github.com/reduxjs/redux) and the [Gact store](https://github.com/gactjs/store/) both facilitate **decoupled state interface**s. However, the [Gact store](https://github.com/gactjs/store/) was specifically designed to provide a **decoupled state interface**. As a result, the [Gact store](https://github.com/gactjs/store/) more scalably and elagantly supports decoupled state interaction:

- The [Redux](https://github.com/reduxjs/redux) solution requires you to pass action creators to your components. The more complex your write logic, the more action creators you are going to need to pass. In contrast, with the [Gact store](https://github.com/gactjs/store/) approach your interface is essentially constant.
- Passing action creators is a brittle interface. You can easily pass the wrong action creators, and TypeScript generally will be unable to help you.
- The `selector` approach requires boilerplate that is absent from the Gact store:

  ```ts
  const selectCountOne = (state: State) => state.countOne;

  // vs
  path("countOne");
  ```

- With the **create component pattern** you do not have to explicitly provide a `<State>` type parameter when consuming external components

<a name="conclusion"></a>

## Conclusion

A **decoupled state interface** is the key to building reusable components that rely on a global store. The ability to create reusable components that rely on a global store lets you avoid [component state](https://github.com/gactjs/store/blob/master/docs/death-of-component-state.md) and promotes **state centralization**.
