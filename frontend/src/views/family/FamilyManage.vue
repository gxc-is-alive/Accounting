<template>
  <div class="family-manage-page" :class="{ 'is-mobile': isMobile }">
    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="family-tabs">
      <el-tab-pane label="家庭管理" name="manage">
        <div class="page-card">
          <div class="page-header">
            <h3 class="page-title">家庭管理</h3>
            <div class="header-actions">
              <el-button type="primary" @click="showCreateDialog">
                <el-icon><Plus /></el-icon>
                {{ isMobile ? '' : '创建家庭' }}
              </el-button>
              <el-button @click="showJoinDialog">
                <el-icon><Connection /></el-icon>
                {{ isMobile ? '' : '加入家庭' }}
              </el-button>
            </div>
          </div>

          <el-empty v-if="!families.length" description="您还没有加入任何家庭" />
          
          <!-- 移动端卡片列表 -->
          <div v-else-if="isMobile" class="family-list-mobile">
            <div v-for="family in families" :key="family.id" class="family-card-mobile">
              <div class="family-info-mobile">
                <div class="family-avatar">{{ family.name.charAt(0) }}</div>
                <div class="family-detail">
                  <h4>{{ family.name }}</h4>
                  <span class="member-count">{{ family.memberCount || 0 }} 位成员</span>
                </div>
              </div>
              <div class="family-actions-mobile">
                <el-button size="small" @click="viewMembers(family)">成员</el-button>
                <el-button size="small" type="primary" @click="generateInvite(family.id)">邀请</el-button>
                <el-button size="small" type="danger" plain @click="leaveFamily(family.id)">退出</el-button>
              </div>
            </div>
          </div>

          <!-- 桌面端网格布局 -->
          <div v-else class="family-list">
            <div v-for="family in families" :key="family.id" class="family-card">
              <div class="family-info">
                <h4>{{ family.name }}</h4>
                <span class="member-count">{{ family.memberCount || 0 }} 位成员</span>
              </div>
              <div class="family-actions">
                <el-button size="small" @click="viewMembers(family)">查看成员</el-button>
                <el-button size="small" type="primary" @click="generateInvite(family.id)">邀请</el-button>
                <el-button size="small" type="danger" @click="leaveFamily(family.id)">退出</el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="家庭资产" name="assets">
        <div class="page-card">
          <div class="page-header">
            <h3 class="page-title">家庭资产总览</h3>
            <el-select
              v-if="families.length > 1"
              v-model="selectedFamilyId"
              size="default"
              placeholder="选择家庭"
              @change="onFamilyChange"
            >
              <el-option
                v-for="family in families"
                :key="family.id"
                :label="family.name"
                :value="family.id"
              />
            </el-select>
          </div>

          <el-empty v-if="!families.length" description="您还没有加入任何家庭" />
          <FamilyAssetsCard
            v-else-if="selectedFamilyId"
            ref="assetsCardRef"
            :family-id="selectedFamilyId"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 创建家庭对话框 - 桌面端 -->
    <el-dialog v-if="!isMobile" v-model="createDialogVisible" title="创建家庭" width="400px">
      <el-form :model="createForm">
        <el-form-item label="家庭名称">
          <el-input v-model="createForm.name" placeholder="如：我的家庭" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createFamily">确定</el-button>
      </template>
    </el-dialog>

    <!-- 创建家庭 - 移动端 -->
    <BottomSheet
      v-if="isMobile"
      v-model:visible="createDialogVisible"
      title="创建家庭"
    >
      <div class="mobile-form">
        <div class="form-item">
          <label>家庭名称</label>
          <el-input v-model="createForm.name" placeholder="如：我的家庭" />
        </div>
      </div>
      <template #footer>
        <div class="mobile-form-footer">
          <el-button @click="createDialogVisible = false" style="flex: 1">取消</el-button>
          <el-button type="primary" @click="createFamily" style="flex: 1">确定</el-button>
        </div>
      </template>
    </BottomSheet>

    <!-- 加入家庭对话框 - 桌面端 -->
    <el-dialog v-if="!isMobile" v-model="joinDialogVisible" title="加入家庭" width="400px">
      <el-form :model="joinForm">
        <el-form-item label="邀请码">
          <el-input v-model="joinForm.code" placeholder="请输入邀请码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="joinDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="joinFamily">确定</el-button>
      </template>
    </el-dialog>

    <!-- 加入家庭 - 移动端 -->
    <BottomSheet
      v-if="isMobile"
      v-model:visible="joinDialogVisible"
      title="加入家庭"
    >
      <div class="mobile-form">
        <div class="form-item">
          <label>邀请码</label>
          <el-input v-model="joinForm.code" placeholder="请输入邀请码" />
        </div>
      </div>
      <template #footer>
        <div class="mobile-form-footer">
          <el-button @click="joinDialogVisible = false" style="flex: 1">取消</el-button>
          <el-button type="primary" @click="joinFamily" style="flex: 1">确定</el-button>
        </div>
      </template>
    </BottomSheet>

    <!-- 成员列表对话框 - 桌面端 -->
    <el-dialog v-if="!isMobile" v-model="membersDialogVisible" title="家庭成员" width="500px">
      <el-table :data="members" style="width: 100%">
        <el-table-column prop="user.nickname" label="昵称" />
        <el-table-column prop="user.email" label="邮箱" />
        <el-table-column prop="role" label="角色">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'primary' : 'info'">
              {{ row.role === 'admin' ? '管理员' : '成员' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 成员列表 - 移动端 -->
    <BottomSheet
      v-if="isMobile"
      v-model:visible="membersDialogVisible"
      title="家庭成员"
      max-height="60vh"
    >
      <div class="member-list-mobile">
        <div v-for="member in members" :key="member.id" class="member-item">
          <div class="member-avatar">{{ (member.user?.nickname || '用户').charAt(0) }}</div>
          <div class="member-info">
            <div class="member-name">{{ member.user?.nickname || '用户' }}</div>
            <div class="member-email">{{ member.user?.email || '' }}</div>
          </div>
          <el-tag size="small" :type="member.role === 'admin' ? 'primary' : 'info'">
            {{ member.role === 'admin' ? '管理员' : '成员' }}
          </el-tag>
        </div>
      </div>
    </BottomSheet>

    <!-- 邀请码对话框 - 桌面端 -->
    <el-dialog v-if="!isMobile" v-model="inviteDialogVisible" title="邀请码" width="400px">
      <div class="invite-code">
        <p>分享以下邀请码给家人：</p>
        <div class="code-display">{{ inviteCode }}</div>
        <el-button type="primary" @click="copyInviteCode">复制邀请码</el-button>
      </div>
    </el-dialog>

    <!-- 邀请码 - 移动端（含二维码） -->
    <BottomSheet
      v-if="isMobile"
      v-model:visible="inviteDialogVisible"
      title="邀请码"
    >
      <div class="invite-code-mobile">
        <p>分享以下邀请码给家人</p>
        <div class="code-display">{{ inviteCode }}</div>
        <div class="qrcode-placeholder">
          <div class="qrcode-box">
            <span>{{ inviteCode }}</span>
          </div>
          <p class="qrcode-tip">扫描二维码加入家庭</p>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="copyInviteCode" style="width: 100%">复制邀请码</el-button>
      </template>
    </BottomSheet>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Plus, Connection } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { familyApi } from '@/api';
import { useDevice } from '@/composables/useDevice';
import BottomSheet from '@/components/mobile/BottomSheet.vue';
import FamilyAssetsCard from '@/components/family/FamilyAssetsCard.vue';
import type { Family, FamilyMember } from '@/types';

const route = useRoute();
const { isMobile } = useDevice();

const activeTab = ref('manage');
const families = ref<Family[]>([]);
const members = ref<FamilyMember[]>([]);
const inviteCode = ref('');
const currentFamilyId = ref<number | null>(null);
const selectedFamilyId = ref<number | null>(null);
const assetsCardRef = ref<InstanceType<typeof FamilyAssetsCard>>();

const createDialogVisible = ref(false);
const joinDialogVisible = ref(false);
const membersDialogVisible = ref(false);
const inviteDialogVisible = ref(false);

const createForm = ref({ name: '' });
const joinForm = ref({ code: '' });

async function loadFamilies() {
  try {
    const res = await familyApi.list() as unknown as { success: boolean; data: Family[] };
    if (res.success) {
      families.value = res.data || [];
      // 设置默认选中的家庭
      if (families.value.length > 0 && !selectedFamilyId.value) {
        selectedFamilyId.value = families.value[0].id;
      }
    }
  } catch (error) {
    console.error('加载家庭列表失败:', error);
  }
}

function onFamilyChange() {
  assetsCardRef.value?.refresh();
}

function showCreateDialog() {
  createForm.value = { name: '' };
  createDialogVisible.value = true;
}

function showJoinDialog() {
  joinForm.value = { code: '' };
  joinDialogVisible.value = true;
}

async function createFamily() {
  if (!createForm.value.name.trim()) {
    ElMessage.warning('请输入家庭名称');
    return;
  }
  try {
    await familyApi.create({ name: createForm.value.name });
    ElMessage.success('创建成功');
    createDialogVisible.value = false;
    await loadFamilies();
  } catch (error) {
    ElMessage.error('创建失败');
  }
}

async function joinFamily() {
  if (!joinForm.value.code.trim()) {
    ElMessage.warning('请输入邀请码');
    return;
  }
  try {
    await familyApi.join(joinForm.value.code);
    ElMessage.success('加入成功');
    joinDialogVisible.value = false;
    await loadFamilies();
  } catch (error) {
    ElMessage.error('加入失败，请检查邀请码');
  }
}

async function viewMembers(family: Family) {
  currentFamilyId.value = family.id;
  try {
    const res = await familyApi.getMembers(family.id) as unknown as { success: boolean; data: FamilyMember[] };
    if (res.success) {
      members.value = res.data || [];
      membersDialogVisible.value = true;
    }
  } catch (error) {
    ElMessage.error('获取成员列表失败');
  }
}

async function generateInvite(familyId: number) {
  try {
    const res = await familyApi.invite(familyId) as unknown as { success: boolean; data: { code: string } };
    if (res.success && res.data) {
      inviteCode.value = res.data.code;
      inviteDialogVisible.value = true;
    }
  } catch (error) {
    ElMessage.error('生成邀请码失败');
  }
}

function copyInviteCode() {
  navigator.clipboard.writeText(inviteCode.value);
  ElMessage.success('已复制到剪贴板');
}

async function leaveFamily(familyId: number) {
  try {
    await ElMessageBox.confirm('确定要退出该家庭吗？', '提示', { type: 'warning' });
    await familyApi.leave(familyId);
    ElMessage.success('已退出家庭');
    await loadFamilies();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('退出失败');
    }
  }
}

onMounted(loadFamilies);

// 监听路由参数，切换到资产 Tab
watch(() => route.query.tab, (tab) => {
  if (tab === 'assets') {
    activeTab.value = 'assets';
  }
}, { immediate: true });
</script>

<style scoped>
.family-tabs {
  margin-bottom: 16px;
}

.family-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.family-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.family-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
}

.family-info h4 {
  margin: 0 0 8px;
  font-size: 16px;
  color: #303133;
}

.member-count {
  color: #909399;
  font-size: 13px;
}

.family-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.invite-code {
  text-align: center;
}

.code-display {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  margin: 16px 0;
  letter-spacing: 2px;
}

/* 移动端样式 */
.is-mobile .page-header {
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.is-mobile .header-actions {
  width: 100%;
  display: flex;
  gap: 8px;
}

.is-mobile .header-actions .el-button {
  flex: 1;
}

.family-list-mobile {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.family-card-mobile {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 16px;
}

.family-info-mobile {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.family-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #67c23a);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  flex-shrink: 0;
}

.family-detail h4 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.family-detail .member-count {
  font-size: 13px;
  color: #909399;
}

.family-actions-mobile {
  display: flex;
  gap: 8px;
}

.family-actions-mobile .el-button {
  flex: 1;
}

.mobile-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mobile-form .form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-form .form-item label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.mobile-form-footer {
  display: flex;
  gap: 12px;
}

.member-list-mobile {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 500;
  flex-shrink: 0;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.member-email {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.invite-code-mobile {
  text-align: center;
}

.invite-code-mobile p {
  color: #606266;
  margin-bottom: 12px;
}

.qrcode-placeholder {
  margin-top: 20px;
}

.qrcode-box {
  width: 160px;
  height: 160px;
  margin: 0 auto;
  background: #f5f7fa;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #909399;
}

.qrcode-tip {
  font-size: 13px;
  color: #909399;
  margin-top: 12px;
}

@media (max-width: 768px) {
  .family-manage-page .page-card {
    padding: 16px;
  }
}
</style>
