<template>
  <div class="login-container">
    <a-card title="饭卡管理系统" class="login-card">
      <a-form
        :model="formState"
        name="login"
        @finish="handleSubmit"
        autocomplete="off"
      >
        <a-form-item
          label="账号"
          name="username"
          :rules="[{ required: true, message: '请输入账号!' }]"
        >
          <a-input v-model:value="formState.username" placeholder="请输入账号" />
        </a-form-item>

        <a-form-item
          label="密码"
          name="password"
          :rules="[{ required: true, message: '请输入密码!' }]"
        >
          <a-input-password v-model:value="formState.password" placeholder="请输入密码" />
        </a-form-item>

        <a-form-item>
          <a-button type="primary" html-type="submit" block>登录</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { message } from 'ant-design-vue';

// 定义事件
const emit = defineEmits(['login-success']);

// 表单数据
const formState = reactive({
  username: 'farsight',
  password: '123',
});

// 处理表单提交
const handleSubmit = () => {
  if (formState.username === 'farsight' && formState.password === '123') {
    message.success('登录成功');
    emit('login-success');
  } else {
    message.error('账号或密码错误');
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

.login-card {
  width: 100%;
  max-width: 400px;
}
</style>