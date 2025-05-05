<template>
  <div class="dashboard">
    <a-row :gutter="[16, 16]">
      <a-col :span="24">
        <a-card title="系统概述">
          <p>欢迎使用饭卡充值消费系统！本系统提供以下功能：</p>
          <a-row :gutter="[16, 16]">
            <a-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
              <a-card class="feature-card">
                <template #cover>
                  <div class="card-icon">
                    <user-add-outlined />
                  </div>
                </template>
                <a-card-meta title="饭卡注册">
                  <template #description>为新用户注册饭卡，设置初始余额</template>
                </a-card-meta>
              </a-card>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
              <a-card class="feature-card">
                <template #cover>
                  <div class="card-icon">
                    <wallet-outlined />
                  </div>
                </template>
                <a-card-meta title="饭卡充值">
                  <template #description>为已注册的饭卡充值</template>
                </a-card-meta>
              </a-card>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
              <a-card class="feature-card">
                <template #cover>
                  <div class="card-icon">
                    <shopping-outlined />
                  </div>
                </template>
                <a-card-meta title="饭卡消费">
                  <template #description>使用饭卡进行消费</template>
                </a-card-meta>
              </a-card>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
              <a-card class="feature-card">
                <template #cover>
                  <div class="card-icon">
                    <lock-outlined />
                  </div>
                </template>
                <a-card-meta title="饭卡挂失">
                  <template #description>挂失丢失的饭卡</template>
                </a-card-meta>
              </a-card>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
              <a-card class="feature-card">
                <template #cover>
                  <div class="card-icon">
                    <delete-outlined />
                  </div>
                </template>
                <a-card-meta title="饭卡注销">
                  <template #description>注销不再使用的饭卡</template>
                </a-card-meta>
              </a-card>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
              <a-card class="feature-card">
                <template #cover>
                  <div class="card-icon">
                    <history-outlined />
                  </div>
                </template>
                <a-card-meta title="操作记录">
                  <template #description>查看所有操作记录</template>
                </a-card-meta>
              </a-card>
            </a-col>
          </a-row>
        </a-card>
      </a-col>
      
      <a-col :span="24">
        <a-card title="使用说明">
          <a-steps direction="vertical" :current="-1">
            <a-step title="第一步：连接设备" description="在左侧菜单选择串口并点击"打开串口"按钮连接RFID读卡器" />
            <a-step title="第二步：选择功能" description="在左侧菜单选择需要使用的功能" />
            <a-step title="第三步：操作卡片" description="根据界面提示进行卡片操作" />
          </a-steps>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import {
  UserAddOutlined,
  WalletOutlined,
  ShoppingOutlined,
  LockOutlined,
  DeleteOutlined,
  HistoryOutlined
} from '@ant-design/icons-vue';
</script>

<style scoped>
.dashboard {
  padding: 16px;
}

.feature-card {
  margin-bottom: 16px;
  transition: all 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.card-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  font-size: 48px;
  color: #1890ff;
  background-color: #e6f7ff;
}
</style>