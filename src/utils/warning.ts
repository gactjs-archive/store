export default function warning(message: string): void {
  if (typeof console !== "undefined" && typeof console.error === "function") {
    // tslint:disable-next-line no-console
    console.error(message);
  }

  try {
    // This error was thrown as a convenience so that if you enable
    // "break on all exceptions" in your console,
    // it would pause the execution at this line.
    throw new Error(message);
    // eslint-disable-next-line no-empty
  } catch (e) {}
}
