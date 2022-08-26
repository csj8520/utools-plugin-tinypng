interface TinypngConfig {
  list: TinypngConfig.List[];
}

declare namespace TinypngConfig {
  export interface List {
    /** 时间戳 */
    date: number;
    basedir: string;
    images: List.Image[];
  }

  export namespace List {
    export interface Image {
      name: string;
      path: string;
      size: number;
      compress?: {
        path: string;
        size?: number;
        /** 压缩进度 0 - 1 */
        progress: number;
        /** 已取消 */
        canceled?: boolean;
        error?: boolean;
        msg?: string;
      };
    }
  }
}
