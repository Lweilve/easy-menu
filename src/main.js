import "./assets/main.css";

import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(router).use(ElementPlus).use(ElementPlus, {
  locale: zhCn,
});

app.mount("#app");
