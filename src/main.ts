import Vue from 'vue';
import { Message, MessageBox, Button } from 'element-ui';

import '@/style/index.stylus';
import '@/style/iconfont.stylus';

import App from './view/app.vue';

const { bytesToSize } = window.utils;

window.addEventListener('load', () => {
  Vue.use(Button);

  Vue.filter('bytes', bytesToSize);
  Vue.filter('fixed', (n: number, f: number) => Number.prototype.toFixed.call(n, f));
  Vue.prototype.$message = Message;
  Vue.prototype.$confirm = MessageBox.confirm;
  window.APP = new App().$mount('#app');
});
