export class Queue {
  private max = 2;
  private _list: Promise<any>[] = [];
  constructor(max = 2) {
    this.max = max;
  }

  async push(promise: Promise<any>) {
    promise.finally(() => {
      const index = this._list.indexOf(promise);
      this._list.splice(index, 1);
    });

    this._list.push(promise);
    if (this._list.length >= this.max) await Promise.race([...this._list]);
    return Promise.resolve();
  }
  async finish() {
    return await Promise.all(this._list), Promise.resolve();
  }
}

export const delay = (t: number) => new Promise(r => setTimeout(r, t));

// const a = new Queue(3);

// (async function () {
//   for (let i = 0; i < 10; i++) {
//     console.log(a._list);
//     await a.push(delay(Math.random() * 5000));
//     console.log(a._list);
//   }
//   await a.finish();
// })();

export function bytesToSize(bytes: number) {
  if (bytes === 0) return '0B';
  let k = 1024;
  let sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + sizes[i];
}

export function random(x: number, y: number): number;
export function random(str: string, length: number, repeat?: boolean): string;
export function random<T>(arr: T[], length: number, repeat?: boolean): T[];
export function random(x: any, y: any, repeat = true) {
  if (typeof x === 'number') {
    return Math.floor(Math.random() * (y - x + 1)) + x;
  } else if (typeof x === 'string') {
    return random(x.split(''), y, repeat).join('');
  } else if (x instanceof Array) {
    if (!repeat && y > x.length) window.console.warn('"length" cannot be greater than "arr.length"'), (repeat = true);
    const o = [...x];
    const arr: any[] = [];
    for (let i = 0; i < y; i++) {
      const index = random(0, o.length - 1);
      if (repeat) {
        arr.push(o[index]);
      } else {
        arr.push(o[index]);
        o.splice(index, 1);
      }
    }
    return arr;
  } else {
    window.console.error('type error');
  }
}
