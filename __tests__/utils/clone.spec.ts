import { clone } from "../../src/utils/clone";

describe("clone", function() {
  test("clone string", function() {
    const value = "value";
    expect(clone(value)).toBe(value);
  });

  test("clone number", function() {
    const value = 100;
    expect(clone(value)).toBe(value);
  });

  test("clone bigint", function() {
    const value = BigInt(100);
    expect(clone(value)).toBe(value);
  });

  test("clone boolean", function() {
    const value = true;
    expect(clone(value)).toBe(value);
  });

  test("clone null", function() {
    const value = null;
    expect(clone(value)).toBe(value);
  });

  test("trying to clone an uncloneable value throws", function() {
    const value = new WeakMap();
    expect(function() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      clone(value as any);
    }).toThrowError("not cloneable");
  });

  test("clone Blob", function() {
    // silence false warning
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    const value = new Blob(["<h1>Love</h1>"], { type: "text/html" });
    const valueClone = clone(value);
    expect(value).not.toBe(valueClone);
    expect(value).toStrictEqual(valueClone);

    consoleError.mockRestore();
  });

  test("clone File", function() {
    // silence false warning
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    const value = new File(["foo"], "foo.txt", {
      type: "text/plain"
    });
    const valueClone = clone(value);
    expect(value).not.toBe(valueClone);
    expect(value).toStrictEqual(valueClone);

    consoleError.mockRestore();
  });

  test("clone Array", function() {
    const value = [1, 2, 3];

    const valueClone = clone(value);
    expect(value).not.toBe(valueClone);
    expect(value).toStrictEqual(valueClone);
  });

  test("clone deep Array", function() {
    const value = [
      [1, 2, 3],
      [1, 2, 3]
    ];
    const valueClone = clone(value);
    expect(value).not.toBe(valueClone);
    expect(value[0]).not.toBe(valueClone[0]);
    expect(value[1]).not.toBe(valueClone[1]);
    expect(value).toStrictEqual(valueClone);
    expect(value[0]).toStrictEqual(valueClone[0]);
    expect(value[1]).toStrictEqual(valueClone[1]);
  });

  test("clone record", function() {
    const value = {
      love: 100,
      hate: false
    };
    const valueClone = clone(value);
    expect(value).not.toBe(valueClone);
    expect(value).toStrictEqual(valueClone);
  });

  test("clone deep record", function() {
    const value = {
      name: "Bob",
      school: {
        name: "Do U",
        graduation: 1899
      }
    };
    const valueClone = clone(value);
    expect(value).not.toBe(valueClone);
    expect(value).toStrictEqual(valueClone);
    expect(value.school).not.toBe(valueClone.school);
    expect(value.school).toStrictEqual(valueClone.school);
  });

  test("ensures properties have the default descriptor", function() {
    const value = {};
    Object.defineProperty(value, "truth", {
      value: 100,
      configurable: false,
      enumerable: false,
      writable: false
    });
    expect(function() {
      clone(value);
    }).toThrowError("must have the default descriptor");
  });

  test("trying to clone a property with a getter and/or setter throws", function() {
    const value = {};
    Object.defineProperty(value, "truth", {
      get() {
        return 100;
      }
    });
    expect(function() {
      clone(value);
    }).toThrowError("Cannot clone a property with getter and/or setter");
  });

  test("trying to clone an object with symbol properties warns", function() {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    const value = {
      [Symbol("symbol")]: true
    };
    clone(value);

    expect(consoleError.mock.calls.length).toBe(1);
    expect(consoleError.mock.calls[0][0]).toBe(
      "Cannot clone a value with symbol properties"
    );
    consoleError.mockRestore();
  });

  test("trying to clone a value with internal references throws", function() {
    const value: Array<number | Array<number>> = [1, 2, 3];
    value[0] = value as Array<number>;
    expect(function() {
      clone(value);
    }).toThrow("must be reference agnostic");
  });
});
