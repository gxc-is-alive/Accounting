<template>
  <div class="ai-assistant-page" :class="{ 'is-mobile': isMobile }">
    <!-- 移动端全屏聊天界面 -->
    <template v-if="isMobile">
      <div class="mobile-chat-container">
        <!-- 聊天消息区域 -->
        <div class="chat-messages-mobile" ref="messagesRef">
          <div
            v-for="(msg, index) in messages"
            :key="index"
            class="chat-message"
            :class="msg.role"
          >
            <div class="message-avatar">
              <el-avatar :size="32" :icon="msg.role === 'user' ? 'User' : 'ChatDotRound'" />
            </div>
            <div class="message-content">
              {{ msg.content }}
            </div>
          </div>
          
          <div v-if="chatLoading" class="chat-message assistant">
            <div class="message-avatar">
              <el-avatar :size="32" icon="ChatDotRound" />
            </div>
            <div class="message-content">
              <span class="typing-indicator">正在思考...</span>
            </div>
          </div>
        </div>

        <!-- 快捷问题 -->
        <div class="quick-questions-mobile">
          <div class="quick-scroll">
            <el-tag
              v-for="q in quickQuestions"
              :key="q"
              class="quick-tag"
              @click="askQuestion(q)"
            >
              {{ q }}
            </el-tag>
          </div>
        </div>
        
        <!-- 底部输入区域 -->
        <div class="chat-input-mobile">
          <el-input
            v-model="question"
            placeholder="问我任何关于财务的问题..."
            @keyup.enter="handleChat"
          />
          <el-button 
            type="primary" 
            :loading="chatLoading" 
            :disabled="!question.trim()"
            @click="handleChat"
          >
            发送
          </el-button>
        </div>
      </div>
    </template>

    <!-- 桌面端双栏布局 -->
    <el-row v-else :gutter="20">
      <!-- 消费分析 -->
      <el-col :span="12">
        <div class="page-card">
          <h3 class="page-title">消费分析</h3>
          <div class="analysis-section">
            <el-button type="primary" :loading="analyzing" @click="handleAnalyze">
              生成分析报告
            </el-button>
            
            <div v-if="analysis" class="analysis-result">
              <div class="analysis-summary">
                <h4>总结</h4>
                <p>{{ analysis.summary }}</p>
              </div>
              
              <div class="analysis-insights">
                <h4>消费洞察</h4>
                <ul>
                  <li v-for="(insight, index) in analysis.insights" :key="index">
                    {{ insight }}
                  </li>
                </ul>
              </div>
              
              <div class="analysis-suggestions">
                <h4>理财建议</h4>
                <ul>
                  <li v-for="(suggestion, index) in analysis.suggestions" :key="index">
                    {{ suggestion }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <!-- AI 问答 -->
      <el-col :span="12">
        <div class="page-card chat-card">
          <h3 class="page-title">AI 问答</h3>
          
          <div class="chat-messages" ref="messagesRef">
            <div
              v-for="(msg, index) in messages"
              :key="index"
              class="chat-message"
              :class="msg.role"
            >
              <div class="message-avatar">
                <el-avatar :size="32" :icon="msg.role === 'user' ? 'User' : 'ChatDotRound'" />
              </div>
              <div class="message-content">
                {{ msg.content }}
              </div>
            </div>
            
            <div v-if="chatLoading" class="chat-message assistant">
              <div class="message-avatar">
                <el-avatar :size="32" icon="ChatDotRound" />
              </div>
              <div class="message-content">
                <span class="typing-indicator">正在思考...</span>
              </div>
            </div>
          </div>
          
          <div class="chat-input">
            <el-input
              v-model="question"
              placeholder="问我任何关于财务的问题..."
              @keyup.enter="handleChat"
            >
              <template #append>
                <el-button :loading="chatLoading" @click="handleChat">
                  发送
                </el-button>
              </template>
            </el-input>
          </div>
          
          <div class="quick-questions">
            <span class="quick-label">快捷问题：</span>
            <el-tag
              v-for="q in quickQuestions"
              :key="q"
              class="quick-tag"
              @click="askQuestion(q)"
            >
              {{ q }}
            </el-tag>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { aiApi } from '@/api';
import { useDevice } from '@/composables/useDevice';
import type { AIChatMessage, AIAnalyzeResponse } from '@/types';

const { isMobile } = useDevice();

const analyzing = ref(false);
const analysis = ref<AIAnalyzeResponse | null>(null);

const messages = ref<AIChatMessage[]>([
  { role: 'assistant', content: '你好！我是你的 AI 财务助手，有什么可以帮你的吗？' },
]);
const question = ref('');
const chatLoading = ref(false);
const messagesRef = ref<HTMLElement>();

const quickQuestions = [
  '本月花了多少钱？',
  '如何节省开支？',
  '我的消费习惯如何？',
];

// 生成分析报告
const handleAnalyze = async () => {
  analyzing.value = true;
  try {
    const res = await aiApi.analyze({ period: 'month' }) as { data: AIAnalyzeResponse };
    analysis.value = res.data;
  } catch (error: unknown) {
    const err = error as { message?: string };
    ElMessage.error(err.message || '分析失败');
  } finally {
    analyzing.value = false;
  }
};

// 发送问题
const handleChat = async () => {
  if (!question.value.trim() || chatLoading.value) return;
  
  const userQuestion = question.value.trim();
  messages.value.push({ role: 'user', content: userQuestion });
  question.value = '';
  
  await nextTick();
  scrollToBottom();
  
  chatLoading.value = true;
  try {
    const res = await aiApi.chat(userQuestion) as { data: { answer: string } };
    messages.value.push({ role: 'assistant', content: res.data.answer });
  } catch (error: unknown) {
    const err = error as { message?: string };
    messages.value.push({
      role: 'assistant',
      content: err.message || '抱歉，我暂时无法回答这个问题。',
    });
  } finally {
    chatLoading.value = false;
    await nextTick();
    scrollToBottom();
  }
};

// 快捷问题
const askQuestion = (q: string) => {
  question.value = q;
  handleChat();
};

// 滚动到底部
const scrollToBottom = () => {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
  }
};
</script>

<style scoped>
.chat-card {
  display: flex;
  flex-direction: column;
  height: 600px;
}

.analysis-section {
  padding: 20px 0;
}

.analysis-result {
  margin-top: 20px;
}

.analysis-result h4 {
  color: #303133;
  margin: 16px 0 8px;
}

.analysis-result p {
  color: #606266;
  line-height: 1.6;
}

.analysis-result ul {
  padding-left: 20px;
  color: #606266;
}

.analysis-result li {
  margin: 8px 0;
  line-height: 1.5;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.chat-message {
  display: flex;
  margin-bottom: 16px;
}

.chat-message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 0 12px;
  line-height: 1.5;
}

.chat-message.assistant .message-content {
  background: #f5f7fa;
  color: #303133;
}

.chat-message.user .message-content {
  background: #409eff;
  color: #fff;
}

.typing-indicator {
  color: #909399;
}

.chat-input {
  padding: 16px 0;
  border-top: 1px solid #ebeef5;
}

.quick-questions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-label {
  font-size: 13px;
  color: #909399;
}

.quick-tag {
  cursor: pointer;
}

.quick-tag:hover {
  background: #409eff;
  color: #fff;
}

/* 移动端样式 */
.is-mobile {
  height: 100%;
}

.mobile-chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fa;
}

.chat-messages-mobile {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
}

.quick-questions-mobile {
  padding: 8px 16px;
  background: #fff;
  border-top: 1px solid #ebeef5;
}

.quick-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 4px;
}

.quick-scroll::-webkit-scrollbar {
  display: none;
}

.quick-scroll .quick-tag {
  flex-shrink: 0;
  cursor: pointer;
}

.chat-input-mobile {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #ebeef5;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0));
}

.chat-input-mobile .el-input {
  flex: 1;
}

.chat-input-mobile .el-button {
  flex-shrink: 0;
}

/* 移动端消息样式优化 */
.is-mobile .chat-message {
  margin-bottom: 12px;
}

.is-mobile .message-content {
  max-width: 80%;
  padding: 10px 14px;
  font-size: 15px;
}

.is-mobile .chat-message.user .message-content {
  background: #409eff;
  color: #fff;
  border-radius: 16px 16px 4px 16px;
}

.is-mobile .chat-message.assistant .message-content {
  background: #fff;
  color: #303133;
  border-radius: 16px 16px 16px 4px;
}

@media (max-width: 768px) {
  .ai-assistant-page {
    padding: 0;
  }
}
</style>
