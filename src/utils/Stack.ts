export class Stack<TData> {
  private arr: TData[] = [];

  constructor (
    private readonly maxSize: number
  ) { }

  push(item: TData) {
    this.arr.push(item);
    if (this.arr.length > this.maxSize) {
      this.arr.shift();
    }
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