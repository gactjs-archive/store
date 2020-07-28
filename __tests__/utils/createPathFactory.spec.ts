import { createPathFactory } from "../../src/utils/createPathFactory";

describe("createPathFactory", function() {
  type State = {
    a: number;
    b: Array<number>;
    c: {
      d: {
        e: boolean;
      };
    };
  };

  test("creates paths from keys", function() {
    const { path } = createPathFactory<State>();
    expect(path("a")).toStrictEqual(["a"]);
    expect(path("b", 0)).toStrictEqual(["b", 0]);
    expect(path("c", "d", "e")).toStrictEqual(["c", "d", "e"]);
  });

  test("path composition", function() {
    const { path } = createPathFactory<State>();
    const b = path("b");
    expect(path(b, 0)).toStrictEqual(["b", 0]);

    const c = path("c");
    const cd = path(c, "d");
    expect(cd).toStrictEqual(["c", "d"]);
    expect(path(cd, "e")).toStrictEqual(["c", "d", "e"]);
  });

  test("path canonicalization", function() {
    const { path } = createPathFactory<State>();
    const cde1 = path("c", "d", "e");
    const cde2 = path(path("c"), "d", "e");
    const cde3 = path(path("c", "d"), "e");
    expect(cde1).toBe(cde2);
    expect(cde2).toBe(cde3);
  });

  test("path immutability", function() {
    const { path } = createPathFactory<State>();
    const b = path("b");
    expect(function() {
      b[0] = "b";
    }).toThrowError();
  });

  test("fromFactory", function() {
    const { path, fromFactory } = createPathFactory<State>();
    const c = path("c");
    expect(fromFactory(c)).toBe(true);
    expect(fromFactory(["c"])).toBe(false);
  });
});
