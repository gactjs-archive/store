import { computePathLineage } from "../../src/utils/computePathLineage";

describe("computePathLineage", function() {
  test("handles a scalar state", function() {
    const expectedPathFamily = new Set([[]]);
    expect(computePathLineage<number, [], number>([], 100)).toEqual(
      expectedPathFamily
    );
  });

  test("compute the ancestor paths of a deep scalar", function() {
    type State = {
      a: {
        b: {
          c: number;
        };
      };
    };

    const expectedPathFamily = new Set([
      [],
      ["a"],
      ["a", "b"],
      ["a", "b", "c"]
    ]);

    expect(
      computePathLineage<State, ["a", "b", "c"], number>(["a", "b", "c"], 100)
    ).toEqual(expectedPathFamily);
  });

  test("compute descendant paths of a complex tree", function() {
    type State = {
      a: Array<string>;
      b: {
        c: number;
      };
      d: bigint;
    };

    const state: State = {
      a: ["one", "two"],
      b: {
        c: 100
      },
      d: BigInt(100)
    };

    const expectedPathFamily = new Set([
      [],
      ["a"],
      ["a", "0"],
      ["a", "1"],
      ["b"],
      ["b", "c"],
      ["d"]
    ]);

    expect(computePathLineage<State, [], State>([], state)).toEqual(
      expectedPathFamily
    );
  });

  test("complex tree in the middle of the state tree", function() {
    type C = {
      e: Array<string>;
      g: number;
    };

    type State = {
      a: {
        b: {
          c: C;
        };
      };
    };

    const value: C = {
      e: ["one", "two"],
      g: 100
    };

    const expectedPathFamily = new Set([
      [],
      ["a"],
      ["a", "b"],
      ["a", "b", "c"],
      ["a", "b", "c", "e"],
      ["a", "b", "c", "e", "0"],
      ["a", "b", "c", "e", "1"],
      ["a", "b", "c", "g"]
    ]);

    expect(
      computePathLineage<State, ["a", "b", "c"], C>(["a", "b", "c"], value)
    ).toEqual(expectedPathFamily);
  });
});
