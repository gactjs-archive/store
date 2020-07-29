import {
  StoreValue,
  EventType,
  InitEvent,
  GetEvent,
  SetEvent,
  UpdateEvent,
  RemoveEvent,
  WriteEvent,
  CRUDEvent,
  TransactionEvent,
  StoreEvent
} from "../types";

export function isInitEvent<S extends StoreValue>(
  event: StoreEvent<S>
): event is InitEvent<S> {
  return event.type === EventType.Init;
}

export function isGetEvent<S extends StoreValue>(
  event: StoreEvent<S>
): event is GetEvent<S> {
  return event.type === EventType.Get;
}

export function isSetEvent<S extends StoreValue>(
  event: StoreEvent<S>
): event is SetEvent<S> {
  return event.type === EventType.Set;
}

export function isUpdateEvent<S extends StoreValue>(
  event: StoreEvent<S>
): event is UpdateEvent<S> {
  return event.type === EventType.Update;
}

export function isRemoveEvent<S extends StoreValue>(
  event: StoreEvent<S>
): event is RemoveEvent<S> {
  return event.type === EventType.Remove;
}

export function isWriteEvent<S extends StoreValue>(
  event: StoreEvent<S>
): event is WriteEvent<S> {
  return (
    event.type === EventType.Set ||
    event.type === EventType.Update ||
    event.type === EventType.Remove
  );
}

export function isCRUDEvent<S extends StoreValue>(
  event: StoreEvent<S>
): event is CRUDEvent<S> {
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
