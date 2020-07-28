import { StoreArray } from "../types";

export function cloneArray(array: StoreArray): StoreArray {
  return new Array(array.length);
}
