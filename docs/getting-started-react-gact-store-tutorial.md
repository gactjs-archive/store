# Getting Started React + Gact Store Tutorial

- [Introduction](#introduction)
- [Setup](#setup)
- [Create Store](#create-store)
- [Create Component](#create-component)
- [Render Component](#render-component)
- [Conclusion](#conclusion)

<a name="introduction"></a>

## Introduction

In this tutorial, we are going to build a very simple React app that consists of a `Counter`. The aim of this tutorial is to illustrate how to get started with the [Gact store](https://github.com/gactjs/store).

<a name="setup"></a>

## Setup

1. Create a new React TypeScript project using create react app: <br/>
   `yarn create react-app gact-getting-started --template typescript`

2. Enter the project directory: <br /> `cd gact-getting-started`

3. Add the [Gact store](https://github.com/gactjs/store) and the official [React bindings](https://github.com/gactjs/react-store) to your project: <br />
   `yarn add @gact/store @gact/react-store`

4. Run `yarn start` to ensure that all went well, and you have a React app running locally.

<blockquote>
We are going to use TypeScript in this tutorial. I encourage you to follow along even if you only develop with JavaScript.
</blockquote>

<blockquote>
Feel free you to use your preferred package runner instead of yarn (e.g. `npx`).
</blockquote>

<a name="create-store"></a>

## Create Store

The first thing we need to do is create our store. The store will be the centralized container for all of our application's state.

Enter the `src` directory and create a `store.ts` file with the following code:

```ts
import { createStore } from "@gact/store";
import { createBindings } from "@gact/react-store";

// declare the shape of our application's state tree
export type State = {
  count: number;
};

const initialState: State = {
  count: 0
};

// create our store
const store = createStore(initialState);

// destructure and export the store's **access layer**
// you use the **access layer** for all interaction with the Gact store
export const { path, get, set, update, remove, transaction } = store;

// create the React bindings for the Gact store and export `useValue`
// `useValue` allows you to **reactively** read values from your store
export const { useValue } = createBindings(store);
```

<a name="create-component"></a>

## Create Component

Now that we have a shiny new store. Let's create a component to interact with it. Make sure you are in your `src` directory. Create `Counter.tsx` with the following code:

```tsx
import React from "react";
import { PathFor } from "@gact/store";

import { useValue, update, State } from "./store";

// The `PathFor` is the most important type provided by the Gact store.
// It allows a component to declare the kind of state it needs without
// tying it to a particular element in the state tree.
type Props = {
  countPath: PathFor<State, number>; // we need the path to a number (i.e our count)
};

export default function Counter({ countPath }: Props) {
  // reactively read `count` from the store
  // reactively read = rerender this component when this value changes
  const count = useValue(countPath);

  function increment() {
    // we use the **update** function of the **access layer** to change values in the store
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

<a name="render-component"></a>

## Render Component

We now have a `Counter` component that interacts with our `store`. Let's make sure everything works as expected by rendering our `Counter`.

Open the `App.tsx` and replace the contents with:

```tsx
import React from "react";

import { path } from "./store";
import Counter from "./Counter";

import "./App.css";

export default function App() {
  // we must use the **path** function of the **access layer** to create paths
  // you may notice that you get nice autocomplete and that TypeScript will prevent
  // you from passing in an invalid path
  return (
    <div className="App">
      <Counter countPath={path("count")} />
    </div>
  );
}
```

Now go to your browser, and you will see a working `Counter`!

<a name="conclusion"></a>

## Conclusion

Congratulations! You've successfully built an app with React and the [Gact store](https://github.com/gactjs/store). To learn more about the [Gact store](https://github.com/gactjs/store), please take a look at the [further reading](https://github.com/gactjs/store#further-reading).
