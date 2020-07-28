import { getByPath } from "../../src/utils/getByPath";

describe("getByPath", function() {
  test("get root", function() {
    const state = 100;
    expect(getByPath(state, [])).toBe(state);
  });

  test("get a deep value", function() {
    const state = {
      a: {
        b: {
          c: [100]
        }
      }
    };

    expect(getByPath(state, ["a", "b", "c", 0])).toBe(100);
  });

  test("getting a nonexistent value returns throws", function() {
    const state = [100];
    expect(function() {
      getByPath(state, [1]);
    }).toThrowError("does not exist");
  });
});
