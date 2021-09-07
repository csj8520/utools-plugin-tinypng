import { ElButton } from 'element-plus';
import { createApp } from 'vue';
import 'element-plus/packages/theme-chalk/src/base.scss';

import '@/view/style/index.stylus';
import '@/view/style/iconfont.stylus';

import App from './app.vue';
console.log('App: ', App);

const app = createApp(App);

app.use(ElButton);

app.mount('body');
