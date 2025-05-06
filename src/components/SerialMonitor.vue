<template>
  <div class="serial-monitor">
    <a-card title="串口通信监控" :bordered="false">
      <template #extra>
        <a-button type="primary" size="small" @click="clearLogs">清空日志</a-button>
      </template>
      
      <div class="monitor-content">
        <div class="log-container">
          <div class="log-header">接收数据</div>
          <div class="log-content" ref="receiveLogRef">
            <div v-for="(log, index) in receiveLogs" :key="'r'+index" class="log-item">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-data">{{ log.data }}</span>
            </div>
          </div>
        </div>
        
        <div class="log-container">
          <div class="log-header">发送数据</div>
          <div class="log-content" ref="sendLogRef">
            <div v-for="(log, index) in sendLogs" :key="'s'+index" class="log-item">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-data">{{ log.data }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="send-container">
        <a-input-group compact>
          <a-input v-model:value="sendData" placeholder="输入要发送的数据" style="width: calc(100% - 100px)" @keyup.enter="sendSerialData" />
          <a-button type="primary" :disabled="!isPortOpen" @click="sendSerialData">发送</a-button>
        </a-input-group>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, inject, watch } from 'vue';
import { message } from 'ant-design-vue';

// 从父组件获取串口通信实例
const serialComm = inject('serialComm');
const isPortOpen = inject('isPortOpen', ref(false));

// 日志数据
const receiveLogs = ref([]);
const sendLogs = ref([]);
const sendData = ref('');

// DOM引用，用于自动滚动
const receiveLogRef = ref(null);
const sendLogRef = ref(null);

// 格式化时间
const formatTime = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
};

// 添加接收日志
const addReceiveLog = (data) => {
  receiveLogs.value.push({
    time: formatTime(),
    data: data
  });
  // 限制日志数量，防止内存占用过多
  if (receiveLogs.value.length > 100) {
    receiveLogs.value.shift();
  }
  // 自动滚动到底部
  setTimeout(() => {
    if (receiveLogRef.value) {
      receiveLogRef.value.scrollTop = receiveLogRef.value.scrollHeight;
    }
  }, 0);
};

// 添加发送日志
const addSendLog = (data) => {
  sendLogs.value.push({
    time: formatTime(),
    data: data
  });
  // 限制日志数量，防止内存占用过多
  if (sendLogs.value.length > 100) {
    sendLogs.value.shift();
  }
  // 自动滚动到底部
  setTimeout(() => {
    if (sendLogRef.value) {
      sendLogRef.value.scrollTop = sendLogRef.value.scrollHeight;
    }
  }, 0);
};

// 发送数据
const sendSerialData = async () => {
  if (!sendData.value.trim()) {
    message.warning('请输入要发送的数据');
    return;
  }
  
  if (!isPortOpen.value) {
    message.warning('请先打开串口');
    return;
  }
  
  try {
    const success = await serialComm.sendData(sendData.value);
    if (success) {
      addSendLog(sendData.value);
      sendData.value = '';
    } else {
      message.error('发送数据失败');
    }
  } catch (error) {
    message.error(`发送数据失败: ${error.message}`);
  }
};

// 清空日志
const clearLogs = () => {
  receiveLogs.value = [];
  sendLogs.value = [];
};

// 监听串口数据接收事件
const handleDataReceived = (data) => {
  addReceiveLog(data);
};

// 组件挂载时注册事件监听
onMounted(() => {
  if (serialComm) {
    serialComm.addEventListener('data-received', handleDataReceived);
  }
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  if (serialComm) {
    serialComm.removeEventListener('data-received', handleDataReceived);
  }
});
</script>

<style scoped>
.serial-monitor {
  height: 100%;
}

.monitor-content {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  height: 300px;
}

.log-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
}

.log-header {
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #d9d9d9;
  font-weight: bold;
}

.log-content {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
  background-color: #fafafa;
  font-family: monospace;
  font-size: 12px;
}

.log-item {
  margin-bottom: 4px;
  line-height: 1.5;
  word-break: break-all;
}

.log-time {
  color: #888;
  margin-right: 8px;
}

.log-data {
  color: #333;
}

.send-container {
  margin-top: 16px;
}
</style>