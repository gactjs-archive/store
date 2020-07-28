import { getContainer } from "../../src/utils/getContainer";

describe("getContainer", function() {
  test("gets container", function() {
    const state = {
      a: [10, 20, 30]
    };
    expect(getContainer(state, ["a", 0])).toStrictEqual([10, 20, 30]);
  });

  test("throws if you try to get container of the root", function() {
    expect(function() {
      const state = 100;
      getContainer(state, []);
    }).toThrowError("does not have a container");
  });
});
