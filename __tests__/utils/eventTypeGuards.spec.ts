import {
  EventType,
  GetEvent,
  InitEvent,
  RemoveEvent,
  SetEvent,
  StoreRecord,
  TransactionEvent,
  UpdateEvent
} from "../../src/types";
import {
  isCRUDEvent,
  isGetEvent,
  isInitEvent,
  isRemoveEvent,
  isSetEvent,
  isTransactionEvent,
  isUpdateEvent,
  isWriteEvent
} from "../../src/utils/eventTypeGuards";

describe("eventTypeGuards", function() {
  type State = {
    a: string;
    b: StoreRecord;
  };

  const initialState: State = { a: "a", b: { c: 100 } };

  const initEvent: InitEvent<State> = {
    state: initialState,
    type: EventType.Init
  };

  const getEvent: GetEvent<State, string> = {
    meta: null,
    path: ["a"],
    type: EventType.Get,
    value: "a"
  };

  const setEvent: SetEvent<State, string> = {
    meta: null,
    path: ["a"],
    prevValue: "a",
    type: EventType.Set,
    value: "b"
  };

  const updateEvent: UpdateEvent<State, string> = {
    meta: null,
    path: ["a"],
    prevValue: "a",
    type: EventType.Update,
    value: "b"
  };

  const removeEvent: RemoveEvent<State, number> = {
    meta: null,
    path: ["b", "c"],
    prevValue: 100,
    type: EventType.Remove
  };

  const transactionEvent: TransactionEvent<State> = {
    events: [getEvent, setEvent],
    meta: null,
    type: EventType.Transaction
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
