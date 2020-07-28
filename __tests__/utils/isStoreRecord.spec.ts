import { isStoreRecord } from "../../src/utils/isStoreRecord";

describe("isStoreRecord", function() {
  test("Plain objects are records ", function() {
    expect(isStoreRecord({})).toBe(true);
    expect(isStoreRecord(Object.create(null))).toBe(true);
    expect(isStoreRecord({ one: 1, two: 2 })).toBe(true);
  });

  test("only plain objects are records", function() {
    expect(isStoreRecord(100)).toBe(false);
    expect(isStoreRecord([])).toBe(false);
  });
});
