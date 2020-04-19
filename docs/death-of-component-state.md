# Death of Component State

- [Introduction](#introduction)
- [Simple Component](#simple-component)
  - [Component State](#simple-component-component-state)
  - [Gact Store](#simple-component-gact-store)
  - [Analysis](#simple-component-analysis)
- [Extended Requirements](#extended-requirements)
  - [Component State](#extended-requirements-component-state)
  - [Gact Store](#extended-requirements-gact-store)
  - [Analysis](#extended-requirements-analysis)
- [Conclusion](#conclusion)

<a name="introduction"></a>

## Introduction

[Component state](https://github.com/gactjs/gact/blob/master/docs/the-component-state-chimera.md) is the primary state model of every modern UI framework. The **component state model** is predicated on the misconception that UI state only has local implications and a predictable lifecycle. In truth, UI state has broad implications and an unpredictable lifecycle. **State hoisting**, the maneuver employed to conceal this reality, has a bevy of harmful ramifications: subversion of the component model, state obscurity, transition rule disintegration, inefficient reconciliation, and memory overhead. The [Gact store](https://github.com/gactjs/store) lets you avoid these problems by providing the only suitable state model for UIs: an **accountable centralized state tree**.

<a name="simple-component"></a>

## Simple Component

Let's start with a simple form example to compare the **component state model** with the [Gact store](https://github.com/gactjs/store).

<a name="simple-component-component-state"></a>

### Component State

```ts
import React, { useState } from "react";

function Reservation() {
  const [isGoing, setIsGoing] = useState(true);
  const [numberOfGuests, setNumberOfGuests] = useState(2);

  function handleIsGoingChange(event: React.ChangeEvent<HTMLInputElement>) {
    setIsGoing(event.target.checked);
  }

  function handleNumberOfGuestsChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setNumberOfGuests(Number(event.target.value));
  }

  return (
    <form>
      <label>
        Is going:
        <input
          name="isGoing"
          type="checkbox"
          checked={isGoing}
          onChange={handleIsGoingChange}
        />
      </label>
      <br />
      <label>
        Number of guests:
        <input
          name="numberOfGuests"
          type="number"
          value={numberOfGuests}
          onChange={handleNumberOfGuestsChange}
        />
      </label>
    </form>
  );
}
```

<a name="simple-component-gact-store"></a>

### Gact Store

You must first create the Gact store and the React bindings:

```ts
import { createStore } from "@gact/store";
import { createBindings } from "@gact/react-store";

export type State = {
  isGoing: boolean;
  numberOfGuests: number;
};

const store = createStore(initialState);

// destructure and export the access layer
export const { path, get, set, update, remove, transaction } = store;

// destructure and export the React bindings
export const { useValue, withStore } = createBindings(store);
```

```ts
import React from "react";

import { set, useValue } from "store";

type Props = {
  isGoingPath: PathFor<State, boolean>;
  numberOfGuestsPath: PathFor<State, number>;
};

function Reservation({ isGoingPath, numberOfGuestsPath }: Props) {
  const isGoing = useValue(isGoingPath);
  const numberOfGuests = useValue(numberOfGuestsPath);

  function handleIsGoingChange(event: React.ChangeEvent<HTMLInputElement>) {
    set(isGoingPath, event.target.checked);
  }

  function handleNumberOfGuestsChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    set(numberOfGuestsPath, Number(event.target.value));
  }

  return (
    <form>
      <label>
        Is going:
        <input
          name="isGoing"
          type="checkbox"
          checked={isGoing}
          onChange={handleIsGoingChange}
        />
      </label>
      <br />
      <label>
        Number of guests:
        <input
          name="numberOfGuests"
          type="number"
          value={numberOfGuests}
          onChange={handleNumberOfGuestsChange}
        />
      </label>
    </form>
  );
}
```

<a name="simple-component-analysis"></a>

### Analysis

With just a simple `Reservation` form, the **component state model** is obviously superior. We declare state right inside our component and use it directly. In contrast, we have to create a [Gact Store](https://github.com/gactjs/store) and use `path`s to consume our state.

<a name="extended-requirements"></a>

## Extended Requirements

When we consider a simple component in isolation, the **component state model** shines because the assumptions underlying it hold: state only has local implications and a predictable lifecycle. However, real UI state has broad implications and an unpredictable lifecycle.

Let's extend our `Reservation` form into a more complete reservation management system as follows:

- add a `CostEstimator`, which displays the expected cost for attending the event with the specified number of guests.
- add an event details page

<a name="extended-requirements-component-state"></a>

### Component State

These new requirements pose some challenges for the **component state model**.

- The `CostEstimator` needs access to `numberOfGuests`, but that state is imprisoned within the `Reservation` component.
- When the user navigates to the event details page, the `Reservation` form will be unmounted and its state cleared.

The workaround employed whenever we discover state has broader implications or state and instance lifecycles diverge is **state hoisting**. **State hoisting** is the movement of state to an ancestor.

We want both the `CostEstimator` and `Reservation` components to have access to `numberOfGuests`. If we move `numberOfGuests` to a common ancestor, then both the `CostEstimator` and `Reservation` components can be given access to `numberOfGuests`.

```ts
import React, { useState } from "react";

import CostEstimator from "...";
import Reservation from "...";

function ReservationManagement() {
  const [numberOfGuests, setNumberOfGuests] = useState(2);

  return (
    <div>
      <CostEstimator numberOfGuests={numberOfGuests} />
      <Reservation
        numberOfGuests={numberOfGuests}
        setNumberOfGuests={setNumberOfGuests}
      />
    </div>
  );
}
```

```ts
import React, { useState } from "react";

type Props = {
  numberOfGuests: number;
  setNumberOfGuests: React.Dispatch<React.SetStateAction<number>>;
};

function Reservation({ numberOfGuests, setNumberOfGuests }: Props) {
  const [isGoing, setIsGoing] = useState(true);

  function handleIsGoingChange(event: React.ChangeEvent<HTMLInputElement>) {
    setIsGoing(event.target.checked);
  }

  function handleNumberOfGuestsChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setNumberOfGuests(Number(event.target.value));
  }

  return (
    <form>
      <label>
        Is going:
        <input
          name="isGoing"
          type="checkbox"
          checked={isGoing}
          onChange={handleIsGoingChange}
        />
      </label>
      <br />
      <label>
        Number of guests:
        <input
          name="numberOfGuests"
          type="number"
          value={numberOfGuests}
          onChange={handleNumberOfGuestsChange}
        />
      </label>
    </form>
  );
}
```

To persist state while navigating to the event details page, we would have to hoist further. We would need to move the `numberOfGuest` and `isGoing` state to a common ancestor of both the `EventPage` and `ReservationManagement` components.

<a name="extended-requirements-gact-store"></a>

### Gact Store

We do not have to change our `Reservation` component. We simply provide access to the `numberOfGuests` by providing it's `path` to our `CostEstimator`.

```ts
import React, { useState } from "react";

import { path } from "store";
import Reservation from "...";

function ReservationManagement() {
  return (
    <div>
      <CostEstimator numberOfGuestsPath={path("numberOfGuests")} />
      <Reservation
        isGoingPath={path("isGoing")}
        numberOfGuestsPath={path("numberOfGuests")}
      />
    </div>
  );
}
```

Likewise, navigating to the events page requires no additonal work because in the Gact store state lifecycle is independent of component lifecycle.

<a name="extended-requirements-analysis"></a>

### Analysis

The [Gact Store](https://github.com/gactjs/store) approach scales beautifully. We do not even have to touch our `Reservation` component. We simply create our `CostEstimator` and give it access to `numberOfGuests` via a `path`. Further, we can support arbitrary lifecyles for our state.

In order to support the same features, the **component state model** requires several rounds of **state hoisting**. At first glance, **state hoisting** may seem like a fine way to deal with the limitations of component state. At a closer inspection, however, we see that **state hoisting** has a bevy of harmful ramifications:

#### Subverts the Component Model

A component should encapsulate a piece of an interface, and compose well with other such pieces.

Hoisting breaks encapsulation by leaking state management details. After hoisting `numberOfGuest`, we cannot understand the `Reservation` component in isolation. We must always consider it alongside the `ReservationManagement` component.

Hoisting hinders composition by encoding assumptions about component usage. After hoisting `numberOfGuest`, we can only use `Reservation` in a context where an ancestor manages `numberOfGuest`.

#### Obscures State

State hoisting obscures the state that impacts a given instance. We have to consider the state owned by the instance plus the state owned by all of its ancestors. Further, we have to consider how ancestors' state is transformed as it travels from ancestors to the instance in question!

#### Transition Rule Disintegration

State hoisting complicates reasoning about transitions by fostering **transition rule disintegration**: distance between the two elements of a transition rule (i.e update and event).

Let's consider the transition rule for `numberOfGuests`. The event that triggers an update of `numberOfGuests` is a change to the corresponding input located in the `Reservation` component. The write triggered on that event is defined in `ReservationManagement`. This disintegration makes the transition more difficult to understand, we again have to reason about `ReservationManagement` and `Reservation` simultaneously.

#### Inefficient Reconciliation

State hoisting promotes inefficient reconciliation.

The more we hoist state:

- the bigger the subtrees we have to reconcile
- the smaller the ratio: view that needs to be updated / view that was diffed

In summary, a minor update with minor impact forces reconciliation of large subtrees.

#### Memory Overhead

The shackles of component state force state and state updates to travel along paths. These paths incur memory overhead. This is simple to see, we hold the state and props of every instance in memory. The `ReservationManagement` component stores `numberOfGuests` even though it never makes any real use of its value.

#### It Only Gets Worse

All the negative consequences of hoisting state get more dramatic the more we hoist:

- Further subversion of the component model
- Further obscured state
- Further transition rule disintegration
- Even more inefficient reconciliation
- Greater memory overhead

The `Reservation` example is really just a toy example. But consider the principles discussed above for a large form with several sections as is typical in an enterprise application.

<a name="conclusion"></a>

## Conclusion

Component state is dead. Use the [Gact store](https://github.com/gactjs/store).
