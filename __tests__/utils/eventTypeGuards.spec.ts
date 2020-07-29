import {
  isInitEvent,
  isGetEvent,
  isSetEvent,
  isUpdateEvent,
  isRemoveEvent,
  isWriteEvent,
  isCRUDEvent,
  isTransactionEvent
} from "../../src/utils/eventTypeGuards";
import {
  StoreRecord,
  EventType,
  InitEvent,
  GetEvent,
  SetEvent,
  UpdateEvent,
  RemoveEvent,
  TransactionEvent
} from "../../src/types";

describe("eventTypeGuards", function() {
  type State = {
    a: string;
    b: StoreRecord;
  };

  const initialState: State = { a: "a", b: { c: 100 } };

  const initEvent: InitEvent<State> = {
    type: EventType.Init,
    state: initialState
  };

  const getEvent: GetEvent<State> = {
    type: EventType.Get,
    path: ["a"],
    value: "a",
    meta: null
  };

  const setEvent: SetEvent<State> = {
    type: EventType.Set,
    path: ["a"],
    prevValue: "a",
    value: "b",
    meta: null
  };

  const updateEvent: UpdateEvent<State> = {
    type: EventType.Update,
    path: ["a"],
    prevValue: "a",
    value: "b",
    meta: null
  };

  const removeEvent: RemoveEvent<State> = {
    type: EventType.Remove,
    path: ["b", "c"],
    prevValue: 100,
    meta: null
  };

  const transactionEvent: TransactionEvent<State> = {
    type: EventType.Transaction,
    events: [getEvent, setEvent],
    meta: null
  };

  test("isInitEvent", function() {
    expect(isInitEvent(initEvent)).toBe(true);
    expect(isInitEvent(getEvent)).toBe(false);
    expect(isInitEvent(setEvent)).toBe(false);
    expect(isInitEvent(updateEvent)).toBe(false);
    expect(isInitEvent(removeEvent)).toBe(false);
    expect(isInitEvent(transactionEvent)).toBe(false);
  });

  test("isGetEvent", function() {
    expect(isGetEvent(initEvent)).toBe(false);
    expect(isGetEvent(getEvent)).toBe(true);
    expect(isGetEvent(setEvent)).toBe(false);
    expect(isGetEvent(updateEvent)).toBe(false);
    expect(isGetEvent(removeEvent)).toBe(false);
    expect(isGetEvent(transactionEvent)).toBe(false);
  });

  test("isSetEvent", function() {
    expect(isSetEvent(initEvent)).toBe(false);
    expect(isSetEvent(getEvent)).toBe(false);
    expect(isSetEvent(setEvent)).toBe(true);
    expect(isSetEvent(updateEvent)).toBe(false);
    expect(isSetEvent(removeEvent)).toBe(false);
    expect(isSetEvent(transactionEvent)).toBe(false);
  });

  test("isUpdateEvent", function() {
    expect(isUpdateEvent(initEvent)).toBe(false);
    expect(isUpdateEvent(getEvent)).toBe(false);
    expect(isUpdateEvent(setEvent)).toBe(false);
    expect(isUpdateEvent(updateEvent)).toBe(true);
    expect(isUpdateEvent(removeEvent)).toBe(false);
    expect(isUpdateEvent(transactionEvent)).toBe(false);
  });

  test("isRemoveEvent", function() {
    expect(isRemoveEvent(initEvent)).toBe(false);
    expect(isRemoveEvent(getEvent)).toBe(false);
    expect(isRemoveEvent(setEvent)).toBe(false);
    expect(isRemoveEvent(updateEvent)).toBe(false);
    expect(isRemoveEvent(removeEvent)).toBe(true);
    expect(isRemoveEvent(transactionEvent)).toBe(false);
  });

  test("isWriteEvent", function() {
    expect(isWriteEvent(initEvent)).toBe(false);
    expect(isWriteEvent(getEvent)).toBe(false);
    expect(isWriteEvent(setEvent)).toBe(true);
    expect(isWriteEvent(updateEvent)).toBe(true);
    expect(isWriteEvent(removeEvent)).toBe(true);
    expect(isWriteEvent(transactionEvent)).toBe(false);
  });

  test("isCRUDEvent", function() {
    expect(isCRUDEvent(initEvent)).toBe(false);
    expect(isCRUDEvent(getEvent)).toBe(true);
    expect(isCRUDEvent(setEvent)).toBe(true);
    expect(isCRUDEvent(updateEvent)).toBe(true);
    expect(isCRUDEvent(removeEvent)).toBe(true);
    expect(isCRUDEvent(transactionEvent)).toBe(false);
  });

  test("isTransactionEvent", function() {
    expect(isTransactionEvent(initEvent)).toBe(false);
    expect(isTransactionEvent(getEvent)).toBe(false);
    expect(isTransactionEvent(setEvent)).toBe(false);
    expect(isTransactionEvent(updateEvent)).toBe(false);
    expect(isTransactionEvent(removeEvent)).toBe(false);
    expect(isTransactionEvent(transactionEvent)).toBe(true);
  });
});
