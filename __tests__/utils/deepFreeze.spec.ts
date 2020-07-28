import { deepFreeze } from "../../src/utils/deepFreeze";

describe("deepFreeze", function() {
  test("array", function() {
    const arr = [0];
    deepFreeze(arr);
    expect(function() {
      arr[0] = 1;
    }).toThrow();
  });

  test("deep array", function() {
    const deepArr = [[[0]], [[0]], [[0]]];
    deepFreeze(deepArr);

    expect(function() {
      deepArr[0] = [[1]];
    }).toThrow();

    expect(function() {
      deepArr[0][0] = [1];
    }).toThrow();

    expect(function() {
      deepArr[0][0][0] = 1;
    }).toThrow();
  });

  test("record", function() {
    const record = { a: 0 };
    deepFreeze(record);

    expect(function() {
      record.a = 1;
    }).toThrow();
  });

  test("deep record", function() {
    const record = { a: { b: { c: 0 } } };
    deepFreeze(record);

    expect(function() {
      record.a = { b: { c: 1 } };
    }).toThrow();

    expect(function() {
      record.a.b = { c: 1 };
    }).toThrow();

    expect(function() {
      record.a.b.c = 1;
    }).toThrow();
  });
});
