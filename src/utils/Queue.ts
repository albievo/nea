export class Queue<TData> {
  private arr: TData[] = [];

  enqueue(item: TData) {
    this.arr.push(item);
  }

  dequeue(): TData | undefined {
    return this.arr.shift();
  }

  peek(): TData | undefined {
    return this.arr[0];
  }

  isEmpty(): boolean {
    return this.arr.length === 0;
  }
}