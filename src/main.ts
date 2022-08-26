import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn.js';
import relativeTime from 'dayjs/plugin/relativeTime';

import { createApp } from 'vue';
import './style.css';
import App from './App.vue';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

createApp(App).mount('#app');
