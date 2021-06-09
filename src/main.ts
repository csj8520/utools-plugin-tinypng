import Vue from 'vue';
import { Message, MessageBox, Button } from 'element-ui';

import '@/style/index.stylus';
import '@/style/iconfont.stylus';

import App from './view/app.vue';

if (process.env.DEBUG == 'true') {
  const eruda = require('eruda');
  eruda.init();
}

const { bytesToSize } = window.utils;

window.addEventListener('load', () => {
  Vue.use(Button);

  Vue.filter('bytes', bytesToSize);
  Vue.filter('fixed', (n: number, f: number) => Number.prototype.toFixed.call(n, f));
  Vue.prototype.$message = Message;
  Vue.prototype.$confirm = MessageBox.confirm;
  Vue.prototype.$prompt = MessageBox.prompt;
  window.APP = new App().$mount('#app');
});
