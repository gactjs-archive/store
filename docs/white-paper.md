# Gact Store

- [Introduction](#introduction)
- [Other State Management Solutions](#other-state-management-solutions)
  - [Component State](#other-state-management-solutions-component-state)
  - [Context](#other-state-management-solutions-context)
  - [Redux](#other-state-management-solutions-redux)
  - [MobX](#other-state-management-solutions-mobx)
- [Store Value](#store-value)
- [Decoupled State Interface](#decoupled-state-interface)
  - [PathFor](#decoupled-state-interface-pathfor)
  - [Access Layer](#decoupled-state-interface-access-layer)
- [Immutability](#immutability)
- [Serializability](#serializability)
- [Exact Change Tracking](#exact-change-tracking)
- [State Centralization](#state-centralization)
  - [Components](#state-centralization-components)
- [Event Sourcing](#event-sourcing)
- [Conclusion](#conclusion)

<a name="introduction"></a>

## Introduction

A UI consists of a state machine and a function that maps state to view (i.e. state => view). A UI is completely described by a set of states, the transitions between these states, and the corresponding set of views. The mathematical model of a UI illuminates UI state's global nature. UI state has broad implications and an unpredictable lifecycle, but our state management solutions are ill-fitted for such state. The Gact store combines a carefully engineered `StoreValue` and **access layer** to achieve: a **decoupled state interface**, **serializability**, **immutability**, **exact change tracking**, and **event sourcing** with practically zero boilerplate and overhead. The fusion of the aforementioned features forms the only suitable state model for UIs: an **accountable centralized state tree**.

<a name="other-state-management-solutions"></a>

## Other State Management Solutions

<a name="other-state-management-solutions-component-state"></a>

### Component State

All modern UI frameworks have a notion of [**component state**](https://github.com/gactjs/gact/blob/master/docs/the-component-state-chimera.md).

**Component state** is predicated on the misconception that UI state only has local implications and a predictable lifecycle. In truth, UI state has broad implications and an unpredictable lifecycle. **State hoisting**, the maneuver employed to conceal this reality, has a bevy of harmful ramifications:

- Subversion of the component model
- State obscurity
- Transition rule disintegration
- Inefficient reconciliation
- Memory overhead

<a name="other-state-management-solutions-context"></a>

### Context

In acknowledgement of component state's limitations, UI frameworks also have a **context** mechanism. **Context** accommodates UI state's broad implications and unpredictable lifecycle by allowing the creation of a **context tree** that provides all descendants with direct access to the **context state**.

Although **context** is tailored to the nature of UI state, it is an extremely inefficient and intractable mechanism.

Updating any part of **context state** triggers reconciliation of the entire **context tree**. This is a more severe case of the reconciliation inefficiency caused by **state hoisting**: a minor update with minor impact forces reconciliation of large subtrees.

An instance can be a descendant of arbitrary many **context tree**s. This means that an instance can be impacted by countless containers of state all writable by potentially large subtrees of the UI. If an instance misbehaves, we have a debugging nightmare:

- We have to figure out which **context**s influence the instance (an intrinsically global property)
- We have to figure out if some **context state** is corrupted
- If some **context state** is corrupted, we have to look through potentially huge subtrees to identify the faulty write

<a name="other-state-management-solutions-redux"></a>

### Redux

[Redux](https://redux.js.org/) is a **global store** architected around **event sourcing**. A **global store** perfectly accommodates UI state's broad implications and unpredictable lifecycle. **Event sourcing** is the foremost architecture for comprehendible state evolution. A **global store** supported by **event sourcing** gives rise to an **accountable centralized state tree**.

Redux arises from the correct soup of concepts, but fails to implement them. **Event sourcing** requires **immutability**, **serializability**, and **state centralization**. Redux fails to provide any of these requirements:

- Redux does not enforce **immutability**, and even notes that ["it is technically possible to write impure reducers that mutate the data for performance corner cases."](https://redux.js.org/introduction/prior-art/) It is possible to mutate state anywhere it is exposed such as a selector or a middleware, and any mutation compromises Redux's entire architecture.

- Redux does not enforce **serializability**, It is possible to have non-serializable actions and state, and any **serializability** violation comprises Redux's entire architecture.

- **State centralization** is only practical if you can create reusable components that rely on a global store. Redux lacks a **decoupled state interface**, which drastically stymies the creation of reusable code.

Furthermore, Redux directly exposes the mechanics of **event sourcing**: you have to create an action, dispatch it, then process it. Consequently, Redux is criminally cumbersome. Redux defends against this criticism as follows: ["It's important that actions being objects you have to dispatch is not boilerplate, but one of the fundamental design choices of Redux...If there are no serializable plain object actions, it is impossible to record and replay user sessions, or to implement hot reloading with time travel."](https://redux.js.org/recipes/reducing-boilerplate/) Indeed, you need a serialized stream of events describing all writes to achieve **session recording** and **time-travel debugging**. However, this stream of events can be automatically created by the store.

<a name="other-state-management-solutions-mobx"></a>

### MobX

[MobX](https://mobx.js.org/) is a state management solution that augments a mutable state model with a tracking layer. A JavaScript value is made `observable`, and can then be reactively used by an `observer`. MobX enables state tractability through [actions](https://mobx.js.org/refguide/api.html#actions), which limit mutation to specially annotated functions.

The creator of MobX realized that [event sourcing can be automatically driven by the store](https://twitter.com/mweststrate/status/755820349451886592). However, **Event sourcing** requires **complete write accounting**, **serializability**, and **state centralization**. MobX fails to meet any of these requirements:

- Mutable state cannot be the foundation of an **accountable state mobel**. (i.e **complete write accounting** _IMPLIES_ **immutability**). As of v5, MobX's tracking is impressively comprehensive, but still can only track property access. Consequently, mutative methods can modify state unnoticed. Additionally, MobX's tracking is provided by `Proxy`s, the underlying target can still be invisibly mutated.

- MobX severely hinders **serializability** by promoting reliance on references. A serialized value cannot maintain **referential integrity** with the outside world. Even maintaining **internal referential integrity** during serialization is difficult and expensive.

- Like Redux, MobX lacks a **decoupled state interface**. Consequently, MobX cannot practically facilitate **state centralization**.

<a name="store-value"></a>

## Store Value

To achieve **serializability** the values in the store must be **cloneable** and **reference-agnostic**. The values must be **cloneable** because we need to recreate them during deserialization. The values need to be **reference-agnostic** because the clones will be references to different values. And while it is possible to maintain **internal referential integrity**, it is impossible to maintain **referential integrity** with the outside world.

It is possible to achieve **immutability** with only the constraints imposed by **serializability**. However, **immutability** is made drastically more efficient if we can freeze values. If we can freeze values, we can share the same copy of a value with all readers as opposed to having to make a copy for each reader. Further, frozen values enable the Gact store to leverage **structural sharing**. **Structural sharing** is a technique to optimize copying by only making copies of the parts of a value affected by a write.

**Cloneability** restricts us to the [cloneable built-in types](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm).

**Reference-agnosticism** further reduces the type of value:

- `TypedArray`s are disallowed because they are necessarily referential types
- `Map` and `Set` are disallowed because they only provide substantial value when references are allowed

**Freezability** adds a few more restrictions:

- `Date` is disallowed because it has mutative methods
- `ArrayBuffer`s are disallowed because they can be indirectly changed via `TypedArray`s

Finally, there are a couple strategic restrictions:

- `undefined` is disallowed to simplify state usage
- `RegExp` is disallowed because there appears to be any practical use cases

`StoreValue` is defined as follows:

```ts
type Primitive = string | number | bigint | boolean | null;

type StoreRecord = { [key: string]: StoreValue };

type StoreArray = Array<StoreValue>;

type Container = StoreArray | StoreRecord;

type Complex = Container | Blob | File;

type StoreValue = Primitive | Complex;
```

<a name="decoupled-state-interface"></a>

## Decoupled State Interface

Reusable code that relies on a global store must not encode assumptions about the state tree. To achieve this decoupling we leverage the following insight: code that interacts with the store requires specific types of state, but is agnostic to the location of this state.

Gact provides a **decoupled state interface** by supplying:

- a type to declare state requirements in a location-agnostic manner
- an **access layer** to operate on state in a location-agnostic manner

<a name="decoupled-state-interface-pathfor"></a>

### PathFor

The `PathFor` type is at the heart of the **decoupled state interface**:

```ts
 // a path in S with the value V
PathFor<S extends StoreValue, V extends StoreValue>
```

Let's look at an example:

```ts
type State = {
  a: {
    b: {
      c: number;
    };
    d: number;
  };
  e: bigint;
};

const p1: PathFor<State, bigint>; // ["e"]
const p2: PathFor<State, number>; // ["a", "d] | ["a", "b", "c"]`
```

<a name="decoupled-state-interface-access-layer"></a>

### Access Layer

The Gact store **access layer** is comprised of the following functions:

- `path`: constructs a path, which declares the value you want to operate on
- `get`: reads a value from the store
- `set`: sets a value in the store
- `update`: updates a value in the store
- `remove`: removes a value from the store
- `transaction`: allows you to compose the four CRUD operations into an atomic operation

Importantly, the **access layer** allows us to operate on values in a location-agnostic manner. For example, if you have the location of a `number`, you can operate on that number regardless of where it is in the state tree:

```ts
function increment<S extend StoreValue>(store: S, countPath: PathFor<S, number>) {
  store.update(countPath, c => c + 1);
}
```

<a name="immutability"></a>

## Immutability

JavaScript objects are naturally mutable. Therefore, to provide **immutability** a store must never directly expose the objects it holds.

The Gact store ensures values can only ever be written through the **access layer**:

- values are cloned as they enter the store via `set` or `update` to prevent the outside world from maintaining a mutable reference to a value in the store
- `get` returns frozen clones of the values held by the store

By cloning values on reads and writes, we ensure that a value held by the store is never directly exposed to the outside world. Crucially, the value held by the store and the clones are **fungible** because the store enforces **reference-agnosticism**.

Let's see this in action:

```ts
type Person = {
  name: string;
};

type State = {
  people: Array<Person>;
};

let bob = {
  name: "bob"
};

// we add bob to the store
set(path("people", 0), bob);

// we mutate the bob that exists in the outside world
bob.name = "not bob haha";

let bobName = get(path("people", 0, "name"));

console.log(`My name is ${bobName}`); // My name is bob
```

The overhead of cloning is minimal because:

- the preponderance of reads and writes for a user interface involve `PrimitiveValue`s, which are intrinsically **immutable** and do not require any copying
- by freezing values and leveraging **structural sharing** we ensure that we make at most one copy of any state element of a given state tree for _all readers_

<a name="serializability"></a>

## Serializability

`StoreValue` was defined to ensure and standardize **serializability**.

<a name="exact-change-tracking"></a>

## Exact Change Tracking

[Accounting](https://github.com/gactjs/gact/blob/master/docs/the-reactive-framework-accounting-problem.md) is a fundamental problem for all reactive systems. The Gact store provides **exact change tracking** with practically zero overhead.

The **access layer** is designed around paths:

```ts
const count = get(path("count"));

update(path("count"), c => c + 1);
```

The path you provide to the **access layer** precisely identifies the value being operated on! This is the only information we need for **exact change tracking**:

```ts
type State = {
  countOne: number;
  countTwo: number;
};

// we know that FirstCount depends on ["countOne"]
function FirstCount() {
  const count = useValue(path("countOne"));

  return <div>{count}</div>;
}

// we know that SecondCount depends on ["countTwo"]
function SecondCount() {
  const count = useValue(path("countTwo"));

  return <div>{count}</div>;
}

// we write ["countOne"], and immediately know to update FirstCount
update(path("countOne"), c => c + 1);
```

<a name="#state-centralization"></a>

## State Centralization

UI state has broad implications and an unpredictable lifecycle.

A **centralized state tree** accommodates:

- state's broad implications by giving the entire UI direct access to all state
- all possible lifecycles by allowing state to be created and destroyed at anytime

<a name="state-centralization-components"></a>

### Components

The Gact store's **decoupled state interface** enables complete **state centralization**.

This **component creation pattern** builds atop the **decoupled state interface** to define encapsulated components that rely on a global state tree.

Let's create an example `Counter` component that we could release as an npm package:

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
        {count}
        <button onClick={decrement}>Decrement</button>
        <button onClick={increment}>Increment</button>
      </div>
    );
  };
}
```

<a name="event-sourcing"></a>

## Event Sourcing

[**Event sourcing**](https://martinfowler.com/eaaDev/EventSourcing.html) enables world-class **debuggability** and **auditability**.

The Gact store supports **event sourcing** with zero boilerplate! The **access layer** let's you directly express write logic. However, behind the scenes, the **access layer** also generates and distributes events that capture all access.

Let's consider a simple write:

```ts
set(path("balance"), 5000);
```

The **access layer** will process the write, and generate the following event:

```ts
{
  type: "SET",
  path: ["balance"],
  prevValue: 1000,
  value: 5000,
  meta: null
}
```

Furthermore, functions in the **access layer** accept a `meta` argument which allows you to associate metadata with your access. This is a boon for **debuggability**:

```ts
store.set(["balance"], 5000, "injection of funds");
```

When processing the above `set`, the store will generate the following event:

```ts
{
  type: "SET",
  path: ["balance"],
  prevValue: 1000,
  value: 5000,
  meta: "injection of funds"
}
```

<a name="conclusion"></a>

## Conclusion

Only a **centralized state tree** can accommodate UI state's broad implications and unpredictable lifecycle. The Gact store enables complete centralization through a **decoupled state interface**. However, a **naive centralized state tree** is terribly inefficient (i.e we have to rereneder the entire UI on each state update) and intractable (i.e. the entire UI is a suspect in every bug). We need an **accountable centralized state tree**: a centralized state tree supported by **exact change tracking** and **event sourcing**. Any part of the UI could read and write any part of the state tree, but in reality only reads and writes a small portion of the state tree. **Exact change tracking** illuminates actual state usage, which fosters maximally efficient reconciliation and **debuggability**. **Event sourcing** complements **change tracking** by capturing state provenance. In combination, **exact change tracking** and **event sourcing** capture the impact and evolution of state.
