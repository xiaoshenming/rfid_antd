<template>
  <div class="main-container">
    <a-layout>
      <a-layout-header class="header">
        <div class="logo">饭卡充值消费系统</div>
        <div class="header-right">
          <a-button type="primary" danger @click="handleLogout">退出登录</a-button>
        </div>
      </a-layout-header>
      <a-layout>
        <a-layout-sider width="250" class="sider">
          <div class="serial-control">
            <a-select
              v-model:value="selectedPort"
              style="width: 100%"
              placeholder="选择串口"
              :disabled="isPortOpen"
            >
              <a-select-option value="COM1">COM1</a-select-option>
              <a-select-option value="COM2">COM2</a-select-option>
              <a-select-option value="COM3">COM3</a-select-option>
              <a-select-option value="COM4">COM4</a-select-option>
            </a-select>
            <a-select v-model:value="baudRate" style="width: 100%;margin-top:8px;" placeholder="波特率" :disabled="isPortOpen">
              <a-select-option value="9600">9600</a-select-option>
              <a-select-option value="19200">19200</a-select-option>
              <a-select-option value="38400">38400</a-select-option>
              <a-select-option value="57600">57600</a-select-option>
              <a-select-option value="115200">115200</a-select-option>
            </a-select>
            <a-select v-model:value="parity" style="width: 100%;margin-top:8px;" placeholder="校验位" :disabled="isPortOpen">
              <a-select-option value="none">无</a-select-option>
              <a-select-option value="even">偶</a-select-option>
              <a-select-option value="odd">奇</a-select-option>
            </a-select>
            <a-select v-model:value="dataBits" style="width: 100%;margin-top:8px;" placeholder="数据位" :disabled="isPortOpen">
              <a-select-option value="7">7</a-select-option>
              <a-select-option value="8">8</a-select-option>
            </a-select>
            <a-select v-model:value="stopBits" style="width: 100%;margin-top:8px;" placeholder="停止位" :disabled="isPortOpen">
              <a-select-option value="1">1</a-select-option>
              <a-select-option value="2">2</a-select-option>
            </a-select>
            <a-button 
              type="primary" 
              :disabled="!selectedPort || isPortOpen" 
              @click="openPort"
              class="port-button"
            >
              打开串口
            </a-button>
            <a-button 
              type="primary" 
              danger 
              :disabled="!isPortOpen" 
              @click="closePort"
              class="port-button"
            >
              关闭串口
            </a-button>
          </div>
          <a-menu
            v-model:selectedKeys="selectedKeys"
            mode="inline"
            :items="menuItems"
            @click="handleMenuClick"
          />
        </a-layout-sider>
        <a-layout-content class="content">
          <component :is="currentComponent" @back="backToMain" />
        </a-layout-content>
      </a-layout>
    </a-layout>
  </div>
</template>

<script setup>
import { ref, reactive, shallowRef, onMounted, defineAsyncComponent, provide } from 'vue';
import { message } from 'ant-design-vue';
import SerialCommunication from '../utils/serialCommunication';

// 定义事件
const emit = defineEmits(['logout']);

// 异步加载组件
const RegisterCard = defineAsyncComponent(() => import('./card/RegisterCard.vue'));
const RechargeCard = defineAsyncComponent(() => import('./card/RechargeCard.vue'));
const ConsumeCard = defineAsyncComponent(() => import('./card/ConsumeCard.vue'));
const LostCard = defineAsyncComponent(() => import('./card/LostCard.vue'));
const CancelCard = defineAsyncComponent(() => import('./card/CancelCard.vue'));
const OperationRecords = defineAsyncComponent(() => import('./card/OperationRecords.vue'));
const Dashboard = defineAsyncComponent(() => import('./Dashboard.vue'));
const SerialMonitor = defineAsyncComponent(() => import('./SerialMonitor.vue'));

// 串口通信实例
const serialComm = new SerialCommunication();

// 提供串口通信实例给子组件
provide('serialComm', serialComm);

// 状态变量
const selectedPort = ref('');
const isPortOpen = ref(false);
const baudRate = ref(115200);
const parity = ref('none');
const dataBits = ref(8);
const stopBits = ref(1);
provide('isPortOpen', isPortOpen);
const selectedKeys = ref(['dashboard']);
const currentComponent = shallowRef(Dashboard);

// 菜单项
const menuItems = [
  {
    key: 'dashboard',
    label: '主页',
    title: '主页',
  },
  {
    key: 'register',
    label: '注册',
    title: '饭卡注册',
  },
  {
    key: 'recharge',
    label: '充值',
    title: '饭卡充值',
  },
  {
    key: 'consume',
    label: '消费',
    title: '饭卡消费',
  },
  {
    key: 'lost',
    label: '挂失',
    title: '饭卡挂失',
  },
  {
    key: 'cancel',
    label: '注销',
    title: '饭卡注销',
  },
  {
    key: 'records',
    label: '操作记录',
    title: '操作记录',
  },
  {
    key: 'serial-monitor',
    label: '串口监控',
    title: '串口监控',
  },
];

// 处理菜单点击
const handleMenuClick = (e) => {
  switch (e.key) {
    case 'dashboard':
      currentComponent.value = Dashboard;
      break;
    case 'register':
      currentComponent.value = RegisterCard;
      break;
    case 'recharge':
      currentComponent.value = RechargeCard;
      break;
    case 'consume':
      currentComponent.value = ConsumeCard;
      break;
    case 'lost':
      currentComponent.value = LostCard;
      break;
    case 'cancel':
      currentComponent.value = CancelCard;
      break;
    case 'records':
      currentComponent.value = OperationRecords;
      break;
    case 'serial-monitor':
      currentComponent.value = SerialMonitor;
      break;
  }
};

// 返回主页
const backToMain = () => {
  selectedKeys.value = ['dashboard'];
  currentComponent.value = Dashboard;
};

// 打开串口
const openPort = async () => {
  if (!selectedPort.value) {
    message.error('请选择串口');
    return;
  }
  const options = {
    baudRate: Number(baudRate.value),
    parity: parity.value,
    dataBits: Number(dataBits.value),
    stopBits: Number(stopBits.value)
  };
  const success = await serialComm.openPort(options);
  if (success) {
    isPortOpen.value = true;
    message.success('串口已打开');
  } else {
    message.error('打开串口失败');
  }
};

// 关闭串口
const closePort = async () => {
  try {
    await serialComm.closePort();
    isPortOpen.value = false;
    message.success('已关闭串口');
  } catch (error) {
    message.error(`关闭串口失败: ${error.message}`);
  }
};

// 退出登录
const handleLogout = () => {
  // 关闭串口连接
  if (isPortOpen.value) {
    serialComm.closePort();
  }
  emit('logout');
};

// 导出串口通信实例，供其他组件使用
const getSerialComm = () => serialComm;

// 使用defineExpose暴露方法给父组件
defineExpose({
  getSerialComm
});
</script>

<style scoped>
.main-container {
  height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.logo {
  font-size: 18px;
  font-weight: bold;
  color: #1890ff;
}

.sider {
  background: #fff;
  box-shadow: 2px 0 8px 0 rgba(29, 35, 41, 0.05);
}

.serial-control {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.port-button {
  margin-top: 8px;
  width: 100%;
}

.content {
  padding: 24px;
  background: #fff;
  min-height: 280px;
}
</style>