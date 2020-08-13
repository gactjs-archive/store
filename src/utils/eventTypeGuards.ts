import {
  CRUDEvent,
  EventType,
  GetEvent,
  InitEvent,
  RemoveEvent,
  SetEvent,
  StoreEvent,
  StoreValue,
  TransactionEvent,
  UpdateEvent,
  WriteEvent
} from "../types";

export function isInitEvent<S extends StoreValue>(
  event: StoreEvent<S>
): event is InitEvent<S> {
  return event.type === EventType.Init;
}

export function isGetEvent<S extends StoreValue, V extends StoreValue>(
  event: StoreEvent<S, V>
): event is GetEvent<S, V> {
  return event.type === EventType.Get;
}

export function isSetEvent<S extends StoreValue, V extends StoreValue>(
  event: StoreEvent<S, V>
): event is SetEvent<S, V> {
  return event.type === EventType.Set;
}

export function isUpdateEvent<S extends StoreValue, V extends StoreValue>(
  event: StoreEvent<S, V>
): event is UpdateEvent<S, V> {
  return event.type === EventType.Update;
}

export function isRemoveEvent<S extends StoreValue, V extends StoreValue>(
  event: StoreEvent<S, V>
): event is RemoveEvent<S, V> {
  return event.type === EventType.Remove;
}

export function isWriteEvent<S extends StoreValue, V extends StoreValue>(
  event: StoreEvent<S, V>
): event is WriteEvent<S, V> {
  return (
    event.type === EventType.Set ||
    event.type === EventType.Update ||
    event.type === EventType.Remove
  );
}

export function isCRUDEvent<S extends StoreValue, V extends StoreValue>(
  event: StoreEvent<S, V>
): event is CRUDEvent<S, V> {
  return (
    event.type === EventType.Get ||
    event.type === EventType.Set ||
    event.type === EventType.Update ||
    event.type === EventType.Remove
  );
}

export function isTransactionEvent<S extends StoreValue>(
  event: StoreEvent<S>
): event is TransactionEvent<S> {
  return event.type === EventType.Transaction;
}
