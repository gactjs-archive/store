import isStoreRecord from "./isStoreRecord";
import isBlob from "./isBlob";
import isFile from "./isFile";
import cloneArray from "./cloneArray";
import cloneBlob from "./cloneBlob";
import cloneFile from "./cloneFile";

import { Complex } from "../types";

export default function cloneComplex<T extends Complex>(value: T): T {
  let result;
  if (isStoreRecord(value)) {
    result = {};
  } else if (Array.isArray(value)) {
    result = cloneArray(value);
  } else if (isBlob(value)) {
    result = cloneBlob(value);
  } else if (isFile(value)) {
    result = cloneFile(value);
  } else {
    throw new Error(`${value} is not cloneable.`);
  }

  return result as T;
}
