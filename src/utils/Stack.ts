export class Stack<TData> {
  private arr: TData[] = [];

  push(item: TData) {
    this.arr.push(item);
  }

  pop(): TData | undefined {
    return this.arr.pop();
  }

  peek(): TData | undefined {
    return this.arr[this.arr.length - 1];
  }

  isEmpty(): boolean {
    return this.arr.length === 0;
  }
}