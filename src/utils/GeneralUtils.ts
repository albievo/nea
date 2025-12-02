export class GeneralUtils {
  static equalSizedArraysAreEqual<T>(arr1: T[], arr2: T[]) {
    return arr1.every((value, idx) => value === arr2[idx]);
  }

  static arraysAreEqual<T>(arr1: T[], arr2: T[]) {
    if (arr1.length !== arr2.length) {
      return false;
    }
    return arr1.every((value, idx) => value === arr2[idx]);
  }

  static createMatrixOfVals<T>(factory: () => T, n: number, m: number): T[][] {
    return Array.from({ length: n }, () =>
      Array.from({ length: m }, () => factory())
    );
  }
}