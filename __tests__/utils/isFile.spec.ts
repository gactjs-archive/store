import isFile from "../../src/utils/isFile";

describe("isFile", function() {
  test("File is a File", function() {
    const file = new File([new Blob()], "example");
    expect(isFile(file)).toBe(true);
  });

  test("Only File is a File", function() {
    expect(isFile(100)).toBe(false);
    expect(isFile([])).toBe(false);
    expect(isFile({})).toBe(false);
  });
});
