import { isBlob } from "../../src/utils/isBlob";

describe("isBlob", function() {
  test("Blob is a Blob", function() {
    expect(isBlob(new Blob())).toBe(true);
  });

  test("Only Blob is a Blob", function() {
    expect(isBlob(100)).toBe(false);
    expect(isBlob([])).toBe(false);
    expect(isBlob({})).toBe(false);
  });
});
