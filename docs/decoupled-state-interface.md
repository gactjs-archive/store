# Decoupled State Interface

- [Introduction](#introduction)
- [Store without a Decoupled State Interface](#without-decoupled-state-interface)
  - [Single Counter Example](#without-decoupled-state-interface-simple-counter-example)
  - [Many Counters Example](#without-decoupled-state-interface-many-counters-example)
- [Store with a Decoupled State Interface](#with-decoupled-state-interface)
  - [Single Counter Example](#with-decoupled-state-interface-simple-counter-example)
  - [Many Counters Example](#with-decoupled-state-interface-many-counters-example)
- [Conclusion](#conclusion)

<a name="introduction"></a>

# Introduction

Reusable code that relies on a global store must not encode assumptions about the state tree. The mainstream stores such as [Redux](https://github.com/reduxjs/redux) require you to hardcode the state elements you interact with. As a result, these stores stymie the creation of reusable code that relies on them. The [Gact store](https://github.com/gactjs/store/) introduces a **decoupled state interface** that allows you to interact with a global state tree in a general, resuable manner.

<a name="without-decoupled-state-interface"></a>

## Store without a Decoupled State Interface

[Redux](https://github.com/reduxjs/redux) does not provide a **decoupled state interface**. You must hardcode the parts of your Redux state that you interact with. Consequently, it is impossible to create reusable components that rely on Redux.

<a name="without-decoupled-state-interface-simple-counter-example"></a>

### Single Counter Example

Let's explore a `Counter` example:

```ts
import { createStore, Action } from "redux";

export type State = {
  count: number;
};

const initialState: State = {
  count: 0
};

type IncrementAction = Action<"INCREMENT">;

type DecrementAction = Action<"DECREMENT">;

type CounterAction = IncrementAction | DecrementAction;

function reducer(state: State = initialState, action: CounterAction) {
  switch (action.type) {
    case "INCREMENT":
      return { ...state, count: state.count + 1 };
    case "DECREMENT":
      return { ...state, count: state.count - 1 };
    default:
      return state;
  }
}

export default createStore(reducer);
```

```ts
import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { State } from "store";

function Counter() {
  const dispatch = useDispatch();

  const count = useSelector<State, number>(function(state) {
    return state.count;
  });

  function increment() {
    dispatch({ type: "INCREMENT" });
  }

  function decrement() {
    dispatch({ type: "DECREMENT" });
  }

  return (
    <div>
      <button onClick={decrement}>-</button> {count}
      <button onClick={increment}>+</button>
    </div>
  );
}
```

This `Counter` works. But notice that our actions, reducer, and `Counter` component are explicitly tied to that specific `count`.

<a name="without-decoupled-state-interface-many-counters-example"></a>

### Many Counters Example

Let's say our App now needs two `Counter`s. We have a `Counter` component. Unfortunately, we canont reuse it because our code is tied to one specific `count`. In order to create a second `Counter`, we have to redo all the work we did for our original counter.

```ts
import { createStore, Action } from "redux";

export type State = {
  countOne: number;
  countTwo: number;
};

const initialState: State = {
  countOne: 0,
  countTwo: 0
};

type IncrementOneAction = Action<"INCREMENT_ONE">;

type IncrementTwoAction = Action<"INCREMENT_TWO">;

type DecrementOneAction = Action<"DECREMENT_ONE">;

type DecrementTwoAction = Action<"DECREMENT_TWO">;

type CounterAction =
  | IncrementOneAction
  | IncrementTwoAction
  | DecrementOneAction
  | DecrementTwoAction;

function reducer(state: State = initialState, action: CounterAction) {
  switch (action.type) {
    case "INCREMENT_ONE":
      return { ...state, countOne: state.countOne + 1 };
    case "INCREMENT_TWO":
      return { ...state, countTwo: state.countTwo + 1 };
    case "DECREMENT_ONE":
      return { ...state, countOne: state.countOne - 1 };
    case "DECREMENT_TWO":
      return { ...state, countTwo: state.countTwo - 1 };
    default:
      return state;
  }
}

export default createStore(reducer);
```

```ts
import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { State } from "store";

function CounterOne() {
  const dispatch = useDispatch();

  const count = useSelector<State, number>(function(state) {
    return state.countOne;
  });

  function increment() {
    dispatch({ type: "INCREMENT_ONE" });
  }

  function decrement() {
    dispatch({ type: "DECREMENT_ONE" });
  }

  return (
    <div>
      <button onClick={decrement}>-</button> {count}
      <button onClick={increment}>+</button>
    </div>
  );
}

function CounterTwo() {
  const dispatch = useDispatch();

  const count = useSelector<State, number>(function(state) {
    return state.countTwo;
  });

  function increment() {
    dispatch({ type: "INCREMENT_TWO" });
  }

  function decrement() {
    dispatch({ type: "DECREMENT_TWO" });
  }

  return (
    <div>
      <button onClick={decrement}>-</button> {count}
      <button onClick={increment}>+</button>
    </div>
  );
}
```

What if we now need another `Counter`? We'd have to go repeat all of this code once again!

<a name="with-decoupled-state-interface"></a>

## Store with a Decoupled State Interface

The core insight underlying the [Gact store's](https://github.com/gactjs/store/) **decoupled state interface** is: code that interacts with the store requires specific types of state, but is agnostic to the location of this state. Therfore, the [Gact store](https://github.com/gactjs/store/) provides:

- a type to declare state requirements in a location-agnostic manner.
- an **access layer** to operate on state in a location-agnostic manner.

<a name="with-decoupled-state-interface-simple-counter-example"></a>

### Single Counter Example

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

```ts
import React from "react";
import { PathFor } from "@gact/store";

import { useValue, path, update, State } from "store";

type Props = {
  countPath: PathFor<State, number>;
};

function Counter({ countPath }: Props) {
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

This `Counter` works exactly like the `Counter` built with Redux. Unlike the Redux `Counter`, however, it does not hardcode interaction with a specific state element.

<a name="with-decoupled-state-interface-many-counters-example"></a>

### Many Counters Example

Let's say that our app now needs two `Counter`s. We can completely reuse our previous `Counter`.

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

```ts
import React from "react";

import { path } from "store";
import Counter from "...";

function App() {
  return (
    <>
      <Counter countPath={path("countOne")} />
      <Counter countPath={path("countTwo")} />
    </>
  );
}
```

This solution scales arbitrarily. If you need 3 or more `Counter`s, you can continue to simply reuse this component as long as you define additonal count elements in your state tree.

<a name="with-decoupled-state-interface-external-component-example"></a>

### External Component Example

The above examples were decoupled from particular elements in the state tree, but were still bound to a specific state tree (i.e our state tree). When we develop external components, we must not be tied to a particular state tree. The [Gact store](https://github.com/gactjs/store) supports this capabaility as well:

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

We now have a resuable `Counter` component that can be reused within this app and any other apps that we build!

<a name="conclusion"></a>

## Conclusion

A **decoupled state interface** is the key to building reusable components that rely on a global store.
