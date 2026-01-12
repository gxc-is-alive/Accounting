<template>
  <div class="family-transactions-page">
    <div class="page-card">
      <div class="page-header">
        <h3 class="page-title">家庭账目</h3>
        <el-select v-model="selectedFamilyId" placeholder="选择家庭" @change="loadTransactions">
          <el-option
            v-for="family in families"
            :key="family.id"
            :label="family.name"
            :value="family.id"
          />
        </el-select>
      </div>

      <el-empty v-if="!selectedFamilyId" description="请先选择一个家庭" />
      <el-empty v-else-if="!transactions.length" description="暂无家庭账目记录" />
      
      <el-table v-else :data="transactions" style="width: 100%">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 'income' ? 'success' : 'danger'" size="small">
              {{ row.type === 'income' ? '收入' : '支出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="100">
          <template #default="{ row }">{{ row.category?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="记录人" width="100">
          <template #default="{ row }">{{ row.user?.nickname || '-' }}</template>
        </el-table-column>
        <el-table-column prop="note" label="备注" />
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }">
            <span :class="row.type === 'income' ? 'amount-income' : 'amount-expense'">
              {{ row.type === 'income' ? '+' : '-' }}¥{{ row.amount.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="selectedFamilyId && transactions.length" class="pagination">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="loadTransactions"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { familyApi, transactionApi } from '@/api';
import type { Family, Transaction } from '@/types';

const families = ref<Family[]>([]);
const transactions = ref<Transaction[]>([]);
const selectedFamilyId = ref<number | null>(null);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

async function loadFamilies() {
  try {
    const res = await familyApi.list() as unknown as { success: boolean; data: Family[] };
    if (res.success) {
      families.value = res.data || [];
      if (families.value.length > 0) {
        selectedFamilyId.value = families.value[0].id;
        await loadTransactions();
      }
    }
  } catch (error) {
    console.error('加载家庭列表失败:', error);
  }
}

async function loadTransactions() {
  if (!selectedFamilyId.value) return;
  try {
    const res = await transactionApi.list({
      familyId: selectedFamilyId.value,
      page: page.value,
      pageSize: pageSize.value,
    }) as unknown as { success: boolean; data: { items: Transaction[]; total: number } };
    if (res.success && res.data) {
      transactions.value = res.data.items || [];
      total.value = res.data.total || 0;
    }
  } catch (error) {
    console.error('加载家庭账目失败:', error);
  }
}

onMounted(loadFamilies);
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.amount-income {
  color: #67c23a;
  font-weight: 600;
}

.amount-expense {
  color: #f56c6c;
  font-weight: 600;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
