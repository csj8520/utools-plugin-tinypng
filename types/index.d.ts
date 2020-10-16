namespace Tinypng {
  export interface FIleItem {
    name: string;
    path: string;
    size: number;
  }
  export interface Progress {
    progress: number;
    type: 'upload' | 'compress' | 'download';
  }
  export interface Response {
    input: Response.Input;
    output: Response.Output;
  }
  export interface Fail {
    type: 'upload' | 'download';
    url?: string;
    error: Error;
  }
  export interface List extends FIleItem {
    temp?: string;
    progress?: number;
    surplus?: number;
    error?: Tinypng.Fail;
  }
}

namespace Response {
  export interface Input {
    size: number;
    type: string;
  }
  export interface Output {
    height: number;
    ratio: number;
    size: number;
    type: string;
    url: string;
    width: number;
  }
}

interface Window {
  tempPath: string;
  utils: typeof import('@/preload/utils');
  tinypng: typeof import('@/preload/tinypng');
  fs: typeof import('fs');
  path: typeof import('path');
  APP: import('vue').default;
}
