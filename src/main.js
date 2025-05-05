import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// 导入Ant Design Vue
import Ant from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

// 创建应用实例
const app = createApp(App)

// 使用Ant Design Vue
app.use(Ant)

// 挂载应用
app.mount('#app')
