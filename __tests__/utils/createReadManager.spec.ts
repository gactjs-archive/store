import createReadManager from "../../src/utils/createReadManager";

describe("createReadManager", function() {
  type State = {
    a: number;
    b: Array<number>;
    c: {
      d: boolean;
    };
  };

  describe("Primitive", function() {
    test("cloning a Primitive returns the Primitive", function() {
      const readManager = createReadManager<State>();

      expect(readManager.clone(["a"], 100)).toBe(100);
    });
  });

  describe("Complex", function() {
    test("produces a perfect clone", function() {
      const readManager = createReadManager<State>();
      const arr = [0, 1, 2];
      const arrClone = readManager.clone(["b"], arr);

      expect(arr).not.toBe(arrClone);
      expect(arr).toStrictEqual(arrClone);
    });

    test("readManager reuses previous clones", function() {
      const readManager = createReadManager<State>();
      const arr = [0, 1, 2];
      const arrClone = readManager.clone(["b"], arr);

      expect(readManager.clone(["b"], arr)).toBe(arrClone);
    });

    test("clones are frozen", function() {
      const readManager = createReadManager<State>();
      const arr = [0, 1, 2];
      const arrClone = readManager.clone(["b"], arr);

      expect(function() {
        arrClone[0] = 1;
      }).toThrow();
    });

    test("reconciliation", function() {
      const readManager = createReadManager<State>();
      const arr = [0, 1, 2];
      const arrClone = readManager.clone(["b"], arr);

      readManager.reconcile([["b"]]);
      expect(readManager.clone(["b"], arr)).not.toBe(arrClone);
    });
  });

  describe("deep tree", function() {
    const a = 100;
    const b = [0, 1, 2];
    const c = { d: true };
    const state: State = { a, b, c };

    test("produces a perfect clone", function() {
      const readManager = createReadManager<State>();
      const stateClone = readManager.clone([], state);

      expect(state).not.toBe(stateClone);

      expect(state.a).toBe(stateClone.a);

      expect(state.b).not.toBe(stateClone.b);
      expect(state.b).toStrictEqual(stateClone.b);

      expect(state.c).not.toBe(stateClone.c);
      expect(state.c).toStrictEqual(stateClone.c);
    });

    test("reuses previous clones", function() {
      const readManager = createReadManager<State>();
      const stateClone = readManager.clone([], state);
      const bClone = readManager.clone(["b"], b);
      const cClone = readManager.clone(["c"], c);

      expect(bClone).toBe(stateClone.b);
      expect(cClone).toBe(stateClone.c);
    });

    test("clones are frozen", function() {
      const readManager = createReadManager<State>();
      const stateClone = readManager.clone([], state);

      // assert that they are frozen
      expect(function() {
        stateClone.c.d = false;
      }).toThrow();
    });

    test("reset", function() {
      const readManager = createReadManager<State>();
      const bClone = readManager.clone(["b"], b);
      const cClone = readManager.clone(["c"], c);
      readManager.reset();
      const stateClone = readManager.clone([], state);

      // creates new clones of a and b after
      expect(bClone).not.toBe(stateClone.b);
      expect(cClone).not.toBe(stateClone.c);
    });
  });
});
