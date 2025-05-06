<template>
  <div class="card-operations">
    <!-- 注册卡片 -->
    <div v-if="currentOperation === 'register'">
      <a-page-header
        title="饭卡注册"
        @back="$emit('back')"
      />
      <a-form :model="registerForm" layout="vertical">
        <a-form-item label="卡号">
          <a-input v-model:value="registerForm.cardId" readonly />
          <a-button type="primary" @click="readCardId('register')" :loading="loading">读卡</a-button>
        </a-form-item>
        <a-form-item label="学号">
          <a-input v-model:value="registerForm.studentId" placeholder="请输入学号" />
        </a-form-item>
        <a-form-item label="金额">
          <a-input-number v-model:value="registerForm.balance" :min="0" :max="9999" style="width: 100%" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="doRegister" :disabled="!registerForm.cardId" :loading="loading">注册</a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 充值卡片 -->
    <div v-if="currentOperation === 'recharge'">
      <a-page-header
        title="饭卡充值"
        @back="$emit('back')"
      />
      <a-form :model="rechargeForm" layout="vertical">
        <a-form-item label="卡号">
          <a-input v-model:value="rechargeForm.cardId" readonly />
        </a-form-item>
        <a-form-item label="学号">
          <a-input v-model:value="rechargeForm.studentId" readonly />
        </a-form-item>
        <a-form-item label="当前余额">
          <a-input v-model:value="rechargeForm.currentBalance" readonly />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="queryBalance('recharge')" :loading="loading">查询余额</a-button>
        </a-form-item>
        <a-form-item label="充值金额">
          <a-input-number v-model:value="rechargeForm.amount" :min="1" :max="9999" style="width: 100%" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="doRecharge" :disabled="!rechargeForm.cardId" :loading="loading">充值</a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 消费卡片 -->
    <div v-if="currentOperation === 'consume'">
      <a-page-header
        title="饭卡消费"
        @back="$emit('back')"
      />
      <a-form :model="consumeForm" layout="vertical">
        <a-form-item label="卡号">
          <a-input v-model:value="consumeForm.cardId" readonly />
        </a-form-item>
        <a-form-item label="学号">
          <a-input v-model:value="consumeForm.studentId" readonly />
        </a-form-item>
        <a-form-item label="当前余额">
          <a-input v-model:value="consumeForm.currentBalance" readonly />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="queryBalance('consume')" :loading="loading">查询余额</a-button>
        </a-form-item>
        <a-form-item label="消费金额">
          <a-input-number v-model:value="consumeForm.amount" :min="1" :max="9999" style="width: 100%" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="doConsume" :disabled="!consumeForm.cardId" :loading="loading">消费</a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 挂失卡片 -->
    <div v-if="currentOperation === 'lost'">
      <a-page-header
        title="饭卡挂失"
        @back="$emit('back')"
      />
      <a-form :model="lostForm" layout="vertical">
        <a-form-item label="卡号">
          <a-input v-model:value="lostForm.cardId" readonly />
        </a-form-item>
        <a-form-item label="学号">
          <a-input v-model:value="lostForm.studentId" readonly />
        </a-form-item>
        <a-form-item label="当前余额">
          <a-input v-model:value="lostForm.currentBalance" readonly />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="queryCardInfo('lost')" :loading="loading">查询卡信息</a-button>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" danger @click="doLost" :disabled="!lostForm.cardId" :loading="loading">挂失</a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 注销卡片 -->
    <div v-if="currentOperation === 'cancel'">
      <a-page-header
        title="饭卡注销"
        @back="$emit('back')"
      />
      <a-form :model="cancelForm" layout="vertical">
        <a-form-item label="卡号">
          <a-input v-model:value="cancelForm.cardId" readonly />
        </a-form-item>
        <a-form-item label="学号">
          <a-input v-model:value="cancelForm.studentId" readonly />
        </a-form-item>
        <a-form-item label="当前余额">
          <a-input v-model:value="cancelForm.currentBalance" readonly />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="queryCardInfo('cancel')" :loading="loading">查询卡信息</a-button>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" danger @click="doCancel" :disabled="!cancelForm.cardId" :loading="loading">注销</a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 操作记录 -->
    <div v-if="currentOperation === 'records'">
      <a-page-header
        title="操作记录"
        @back="$emit('back')"
      />
      <a-table
        :columns="recordColumns"
        :data-source="operations"
        :pagination="{ pageSize: 10 }"
        :loading="loading"
      >
        <template #bodyCell="{ column, text }">
          <template v-if="column.dataIndex === 'amount'">
            <span>{{ text.toFixed(2) }}</span>
          </template>
          <template v-if="column.dataIndex === 'operationType'">
            <a-tag :color="getOperationTypeColor(text)">{{ text }}</a-tag>
          </template>
        </template>
      </a-table>
      <div class="table-operations">
        <a-button type="primary" @click="loadOperations">刷新</a-button>
        <a-button danger @click="clearAllOperations">清空记录</a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, defineProps, defineEmits } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { inject } from 'vue';
const serialComm = inject('serialComm');
import { parseCardData, buildCardData, saveOperation, getOperations, clearOperations } from '../../utils/cardDataUtils';

// 定义属性和事件
const props = defineProps({
  operation: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['back']);

// 当前操作类型
const currentOperation = ref(props.operation);

// 加载状态
const loading = ref(false);

// 表单数据
const registerForm = reactive({
  cardId: '',
  studentId: '',
  balance: 200
});

const rechargeForm = reactive({
  cardId: '',
  studentId: '',
  currentBalance: '',
  amount: 50
});

const consumeForm = reactive({
  cardId: '',
  studentId: '',
  currentBalance: '',
  amount: 10
});

const lostForm = reactive({
  cardId: '',
  studentId: '',
  currentBalance: ''
});

const cancelForm = reactive({
  cardId: '',
  studentId: '',
  currentBalance: ''
});

// 操作记录
const operations = ref([]);
const recordColumns = [
  {
    title: '卡号',
    dataIndex: 'cardId',
    key: 'cardId',
  },
  {
    title: '操作类型',
    dataIndex: 'operationType',
    key: 'operationType',
  },
  {
    title: '金额',
    dataIndex: 'amount',
    key: 'amount',
  },
  {
    title: '操作时间',
    dataIndex: 'operationTime',
    key: 'operationTime',
  },
];

// 获取串口通信实例
// 使用inject获取的serialComm

// 读取卡ID
async function readCardId(formType) {
  if (!serialComm.port) {
    message.error('请先打开串口');
    return;
  }
  
  loading.value = true;
  try {
    let cardId = await serialComm.readCardId();
    if (cardId) {
      // 去除'Id:'前缀
      if (cardId.startsWith('Id:')) {
        cardId = cardId.substring(3);
      }
      
      switch (formType) {
        case 'register':
          registerForm.cardId = cardId;
          break;
      }
      message.success('读卡成功');
    } else {
      message.error('读卡失败');
    }
  } catch (error) {
    message.error(`读卡失败: ${error.message}`);
  } finally {
    loading.value = false;
  }
}

// 查询余额
async function queryBalance(formType) {
  if (!serialComm.port) {
    message.error('请先打开串口');
    return;
  }
  
  loading.value = true;
  try {
    // 读取卡ID
    const cardId = await serialComm.readCardId();
    if (!cardId) {
      message.error('读卡失败');
      return;
    }
    
    // 读取卡数据
    const data = await serialComm.readCardData();
    if (!data) {
      message.error('读取卡数据失败');
      return;
    }
    
    // 解析卡数据
    const cardInfo = parseCardData(data);
    if (!cardInfo) {
      message.error('解析卡数据失败');
      return;
    }
    
    // 检查卡状态
    if (!cardInfo.isRegistered) {
      message.error('卡未注册');
      return;
    }
    
    if (cardInfo.isLost) {
      message.error('卡已挂失');
      return;
    }
    
    // 更新表单数据
    switch (formType) {
      case 'recharge':
        rechargeForm.cardId = cardId;
        rechargeForm.studentId = cardInfo.studentId;
        rechargeForm.currentBalance = cardInfo.balance.toFixed(2);
        break;
      case 'consume':
        consumeForm.cardId = cardId;
        consumeForm.studentId = cardInfo.studentId;
        consumeForm.currentBalance = cardInfo.balance.toFixed(2);
        break;
    }
    
    message.success('查询余额成功');
  } catch (error) {
    message.error(`查询余额失败: ${error.message}`);
  } finally {
    loading.value = false;
  }
}

// 查询卡信息
async function queryCardInfo(formType) {
  if (!serialComm.port) {
    message.error('请先打开串口');
    return;
  }
  
  loading.value = true;
  try {
    // 读取卡ID
    const cardId = await serialComm.readCardId();
    if (!cardId) {
      message.error('读卡失败');
      return;
    }
    
    // 读取卡数据
    const data = await serialComm.readCardData();
    if (!data) {
      message.error('读取卡数据失败');
      return;
    }
    
    // 解析卡数据
    const cardInfo = parseCardData(data);
    if (!cardInfo) {
      message.error('解析卡数据失败');
      return;
    }
    
    // 检查卡状态
    if (!cardInfo.isRegistered) {
      message.error('卡未注册');
      return;
    }
    
    if (formType === 'lost' && cardInfo.isLost) {
      message.error('卡已挂失');
      return;
    }
    
    // 更新表单数据
    switch (formType) {
      case 'lost':
        lostForm.cardId = cardId;
        lostForm.studentId = cardInfo.studentId;
        lostForm.currentBalance = cardInfo.balance.toFixed(2);
        break;
      case 'cancel':
        cancelForm.cardId = cardId;
        cancelForm.studentId = cardInfo.studentId;
        cancelForm.currentBalance = cardInfo.balance.toFixed(2);
        break;
    }
    
    message.success('查询卡信息成功');
  } catch (error) {
    message.error(`查询卡信息失败: ${error.message}`);
  } finally {
    loading.value = false;
  }
}

// 注册卡片
async function doRegister() {
  if (!serialComm.port) {
    message.error('请先打开串口');
    return;
  }
  
  if (!registerForm.cardId) {
    message.error('请先读卡');
    return;
  }
  
  if (!registerForm.studentId) {
    message.error('请输入学号');
    return;
  }
  
  if (registerForm.balance <= 0 || registerForm.balance > 9999) {
    message.error('金额必须在1-9999之间');
    return;
  }
  
  loading.value = true;
  try {
    // 构造卡数据
    const cardData = buildCardData({
      isRegistered: true,
      isLost: false,
      balance: registerForm.balance,
      studentId: registerForm.studentId
    });
    
    if (!cardData) {
      message.error('构造卡数据失败');
      return;
    }
    
    // 写入卡数据
    const success = await serialComm.writeCardData(cardData);
    if (!success) {
      message.error('写入卡数据失败');
      return;
    }
    
    // 保存操作记录
    saveOperation({
      cardId: registerForm.cardId,
      operationType: '注册',
      amount: registerForm.balance,
      operationTime: new Date().toLocaleString()
    });
    
    message.success('注册成功');
    
    // 重置表单
    registerForm.cardId = '';
    registerForm.studentId = '';
    registerForm.balance = 200;
  } catch (error) {
    message.error(`注册失败: ${error.message}`);
  } finally {
    loading.value = false;
  }
}

// 充值卡片
async function doRecharge() {
  if (!serialComm.port) {
    message.error('请先打开串口');
    return;
  }
  
  if (!rechargeForm.cardId) {
    message.error('请先查询卡信息');
    return;
  }
  
  if (rechargeForm.amount <= 0) {
    message.error('充值金额必须大于0');
    return;
  }
  
  loading.value = true;
  try {
    // 读取卡数据
    const data = await serialComm.readCardData();
    if (!data) {
      message.error('读取卡数据失败');
      return;
    }
    
    // 解析卡数据
    const cardInfo = parseCardData(data);
    if (!cardInfo) {
      message.error('解析卡数据失败');
      return;
    }
    
    // 检查余额上限
    const newBalance = cardInfo.balance + rechargeForm.amount;
    if (newBalance > 9999) {
      message.error('充值后余额超出上限(9999)');
      return;
    }
    
    // 构造新卡数据
    const newCardData = buildCardData({
      ...cardInfo,
      balance: newBalance
    });
    
    if (!newCardData) {
      message.error('构造卡数据失败');
      return;
    }
    
    // 写入卡数据
    const success = await serialComm.writeCardData(newCardData);
    if (!success) {
      message.error('写入卡数据失败');
      return;
    }
    
    // 保存操作记录
    saveOperation({
      cardId: rechargeForm.cardId,
      operationType: '充值',
      amount: rechargeForm.amount,
      operationTime: new Date().toLocaleString()
    });
    
    // 更新显示
    rechargeForm.currentBalance = newBalance.toFixed(2);
    
    message.success(`充值成功，当前余额: ${newBalance.toFixed(2)}元`);
  } catch (error) {
    message.error(`充值失败: ${error.message}`);
  } finally {
    loading.value = false;
  }
}

// 消费卡片
async function doConsume() {
  if (!serialComm.port) {
    message.error('请先打开串口');
    return;
  }
  
  if (!consumeForm.cardId) {
    message.error('请先查询卡信息');
    return;
  }
  
  if (consumeForm.amount <= 0) {
    message.error('消费金额必须大于0');
    return;
  }
  
  loading.value = true;
  try {
    // 读取卡数据
    const data = await serialComm.readCardData();
    if (!data) {
      message.error('读取卡数据失败');
      return;
    }
    
    // 解析卡数据
    const cardInfo = parseCardData(data);
    if (!cardInfo) {
      message.error('解析卡数据失败');
      return;
    }
    
    // 检查余额是否充足
    if (cardInfo.balance < consumeForm.amount) {
      message.error('余额不足');
      return;
    }
    
    // 构造新卡数据
    const newBalance = cardInfo.balance - consumeForm.amount;
    const newCardData = buildCardData({
      ...cardInfo,
      balance: newBalance
    });
    
    if (!newCardData) {
      message.error('构造卡数据失败');
      return;
    }
    
    // 写入卡数据
    const success = await serialComm.writeCardData(newCardData);
    if (!success) {
      message.error('写入卡数据失败');
      return;
    }
    
    // 保存操作记录
    saveOperation({
      cardId: consumeForm.cardId,
      operationType: '消费',
      amount: consumeForm.amount,
      operationTime: new Date().toLocaleString()
    });
    
    // 更新显示
    consumeForm.currentBalance = newBalance.toFixed(2);
    
    message.success(`消费成功，当前余额: ${newBalance.toFixed(2)}元`);
  } catch (error) {
    message.error(`消费失败: ${error.message}`);
  } finally {
    loading.value = false;
  }
}

// 挂失卡片
async function doLost() {
  if (!serialComm.port) {
    message.error('请先打开串口');
    return;
  }
  
  if (!lostForm.cardId) {
    message.error('请先查询卡信息');
    return;
  }
  
  loading.value = true;
  try {
    // 读取卡数据
    const data = await serialComm.readCardData();
    if (!data) {
      message.error('读取卡数据失败');
      return;
    }
    
    // 解析卡数据
    const cardInfo = parseCardData(data);
    if (!cardInfo) {
      message.error('解析卡数据失败');
      return;
    }
    
    // 构造新卡数据（修改挂失状态为true）
    const newCardData = buildCardData({
      ...cardInfo,
      isLost: true
    });
    
    if (!newCardData) {
      message.error('构造卡数据失败');
      return;
    }
    
    // 写入卡数据
    const success = await serialComm.writeCardData(newCardData);
    if (!success) {
      message.error('写入卡数据失败');
      return;
    }
    
    // 保存操作记录
    saveOperation({
      cardId: lostForm.cardId,
      operationType: '挂失',
      amount: 0,
      operationTime: new Date().toLocaleString()
    });
    
    message.success('挂失成功');
    
    // 重置表单
    lostForm.cardId = '';
    lostForm.studentId = '';
    lostForm.currentBalance = '';
  } catch (error) {
    message.error(`挂失失败: ${error.message}`);
  } finally {
    loading.value = false;
  }
}

// 注销卡片
async function doCancel() {
  if (!serialComm.port) {
    message.error('请先打开串口');
    return;
  }
  
  if (!cancelForm.cardId) {
    message.error('请先查询卡信息');
    return;
  }
  
  // 确认注销
  Modal.confirm({
    title: '确认注销',
    content: `确定要注销卡号为 ${cancelForm.cardId} 的饭卡吗？注销后卡内余额将无法恢复！`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      loading.value = true;
      try {
        // 读取卡数据
        const data = await serialComm.readCardData();
        if (!data) {
          message.error('读取卡数据失败');
          return;
        }
        
        // 解析卡数据
        const cardInfo = parseCardData(data);
        if (!cardInfo) {
          message.error('解析卡数据失败');
          return;
        }
        
        // 构造新卡数据（修改注册状态为false）
        const newCardData = buildCardData({
          ...cardInfo,
          isRegistered: false,
          balance: 0
        });
        
        if (!newCardData) {
          message.error('构造卡数据失败');
          return;
        }
        
        // 写入卡数据
        const success = await serialComm.writeCardData(newCardData);
        if (!success) {
          message.error('写入卡数据失败');
          return;
        }
        
        // 保存操作记录
        saveOperation({
          cardId: cancelForm.cardId,
          operationType: '注销',
          amount: 0,
          operationTime: new Date().toLocaleString()
        });
        
        message.success('注销成功');
        
        // 重置表单
        cancelForm.cardId = '';
        cancelForm.studentId = '';
        cancelForm.currentBalance = '';
      } catch (error) {
        message.error(`注销失败: ${error.message}`);
      } finally {
        loading.value = false;
      }
    }
  });
}

// 加载操作记录
function loadOperations() {
  loading.value = true;
  try {
    operations.value = getOperations();
    message.success('加载操作记录成功');
  } catch (error) {
    message.error(`加载操作记录失败: ${error.message}`);
  } finally {
    loading.value = false;
  }
}

// 清空所有操作记录
function clearAllOperations() {
  Modal.confirm({
    title: '确认清空',
    content: '确定要清空所有操作记录吗？此操作不可恢复！',
    okText: '确认',
    cancelText: '取消',
    onOk: () => {
      loading.value = true;
      try {
        clearOperations();
        operations.value = [];
        message.success('清空操作记录成功');
      } catch (error) {
        message.error(`清空操作记录失败: ${error.message}`);
      } finally {
        loading.value = false;
      }
    }
  });
}

// 获取操作类型颜色
function getOperationTypeColor(type) {
  switch (type) {
    case '注册':
      return 'blue';
    case '充值':
      return 'green';
    case '消费':
      return 'orange';
    case '挂失':
      return 'red';
    case '注销':
      return 'purple';
    default:
      return 'default';
  }
}

// 组件挂载时根据操作类型初始化
onMounted(() => {
  if (currentOperation.value === 'records') {
    loadOperations();
  }
});
</script>

<style scoped>
.card-operations {
  max-width: 800px;
  margin: 0 auto;
}

.table-operations {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>