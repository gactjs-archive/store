import isContainer from "../../src/utils/isContainer";

describe("isContainer", function() {
  test("plain objects are containers", function() {
    expect(isContainer({})).toBe(true);
    expect(isContainer(Object.create(null))).toBe(true);
    expect(isContainer({ one: 1, two: 2 })).toBe(true);
  });

  test("arrays are containers", function() {
    expect(isContainer([])).toBe(true);
    expect(isContainer([1, 2])).toBe(true);
  });

  test("only plain objects and arrays are containers", function() {
    expect(isContainer(100)).toBe(false);
    expect(isContainer(new Blob())).toBe(false);
  });
});
