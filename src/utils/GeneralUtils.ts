export class GeneralUtils {
  static equalSizedArraysAreEqual<T>(arr1: T[], arr2: T[]) {
    return arr1.every((value, idx) => value === arr2[idx]);
  }
}