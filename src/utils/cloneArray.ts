import { StoreArray } from "../types";

export default function cloneArray(array: StoreArray): StoreArray {
  return new Array(array.length);
}
