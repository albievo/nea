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

  static createMatrixOfVals<T>(factory: () => T, height: number, width: number): T[][] {
    return Array.from({ length: height }, () =>
      Array.from({ length: width }, () => factory())
    );
  }

  static objectIsEmpty(object: Object) {
    return (Object.keys(object).length === 0);
  }

  static removeValue<T>(arr: T[], value: T): T[] {
    return arr.filter(item => item !== value);
  }
}