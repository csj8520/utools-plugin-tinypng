class Queue {
  max = 2;
  _list = [];
  constructor(max = 2) {
    this.max = max;
  }

  async push(promise) {
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
// const a = new Queue(3);

// const delay = t => new Promise(r => setTimeout(r, t));

// (async function () {
//   for (let i = 0; i < 10; i++) {
//     console.log(a._list);
//     await a.push(delay(Math.random() * 5000));
//     console.log(a._list);
//   }
//   await a.finish();
// })();

function bytesToSize(bytes) {
  if (bytes === 0) return '0B';
  let k = 1024;
  let sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let i = Math.floor(Math.log(bytes) / Math.log(k)); //return (bytes / Math.pow(k, i)) + ' ' + sizes[i];
  return (bytes / Math.pow(k, i)).toFixed(2) + sizes[i]; //toPrecision(3) 后面保留两位小数，如1.00GBc
}

function random(x, y, repeat = true) {
  if (typeof x === 'number') {
    return Math.floor(Math.random() * (y - x + 1)) + x;
  } else if (typeof x === 'string') {
    return random(x.split(''), y, repeat).join('');
  } else if (x instanceof Array) {
    if (!repeat && y > x.length) window.console.warn('"length" cannot be greater than "arr.length"'), (repeat = true);
    const o = [...x];
    const arr = [];
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

module.exports = { Queue, bytesToSize, random };
