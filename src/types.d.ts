interface DBCconfig {
  list: DBCconfig.List[];
}

declare namespace DBCconfig {
  export interface List {
    /** 时间戳 */
    date: number;
    images: List.Image[];
  }

  export namespace List {
    export interface Image {
      name: string;
      path: string;
      size: number;
      compressed: {
        path: string;
        size: number;
      };
    }
  }
}
