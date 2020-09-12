import { Message, Alert } from 'element-ui';
declare module 'vue/types/vue' {
  interface Vue {
    // readonly $message: typeof Message;
  }
}
