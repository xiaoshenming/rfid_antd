<template>
  <a-config-provider :locale="locale">
    <login-view v-if="!isLoggedIn" @login-success="handleLoginSuccess" />
    <main-view v-else @logout="handleLogout" />
  </a-config-provider>
</template>

<script setup>
import { ref } from 'vue';
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import LoginView from './components/LoginView.vue';
import MainView from './components/MainView.vue';

// 国际化配置
const locale = zhCN;

// 登录状态
const isLoggedIn = ref(false);

// 处理登录成功
const handleLoginSuccess = () => {
  isLoggedIn.value = true;
};

// 处理登出
const handleLogout = () => {
  isLoggedIn.value = false;
};
</script>

<style>
/* 全局样式 */
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
    'Noto Color Emoji';
}

#app {
  height: 100vh;
}
</style>
