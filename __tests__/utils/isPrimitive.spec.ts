import { isPrimitive } from "../../src/utils/isPrimitive";

describe("isPrimitive", function() {
  test("string is a Primitive", function() {
    expect(isPrimitive("example")).toBe(true);
  });

  test("number is a Primitive", function() {
    expect(isPrimitive(100)).toBe(true);
  });

  test("bigint is a Primitive", function() {
    expect(isPrimitive(BigInt(100))).toBe(true);
  });

  test("boolean is a primitive", function() {
    expect(isPrimitive(true)).toBe(true);
  });

  test("boolean is a primitive", function() {
    expect(isPrimitive(null)).toBe(true);
  });

  test("Only string, number, bigint, boolean, and null are primitives", function() {
    expect(isPrimitive(Symbol())).toBe(false);
    expect(isPrimitive([])).toBe(false);
    expect(isPrimitive({})).toBe(false);
  });
});
