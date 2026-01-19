# 设计文档：交易记录列表删除功能优化

## 概述

本设计文档描述了如何在移动端交易记录列表中添加直接删除功能，使用户无需进入详情面板即可快速删除交易记录。设计遵循 Vue 3 Composition API 最佳实践，保持代码简洁和可维护性。

## 架构

### 组件层次结构

```
TransactionList.vue (页面)
├── TransactionCard.vue (移动端卡片组件)
│   ├── 交易信息展示
│   ├── 编辑按钮
│   └── 删除按钮 (新增)
└── BottomSheet (详情面板)
    └── 删除按钮 (保留)
```

### 数据流

```
用户点击删除按钮
    ↓
TransactionCard 触发 @delete 事件
    ↓
TransactionList 接收事件
    ↓
显示确认对话框
    ↓
用户确认
    ↓
调用 transactionStore.deleteTransaction()
    ↓
后端 API 删除交易
    ↓
更新账户余额
    ↓
删除关联附件
    ↓
刷新列表
```

## 组件和接口

### TransactionCard 组件修改

**新增 Props:**

- `showActions`: boolean (可选) - 是否显示操作按钮，默认 true

**新增 Emits:**

- `delete`: (transaction: Transaction) => void - 删除事件

**UI 布局:**

```
┌─────────────────────────────────────┐
│ [图标] 分类名称          金额      │
│        账户 · 日期      [编辑][删除]│
└─────────────────────────────────────┘
```

**按钮设计:**

- 删除按钮使用 `el-icon` + `Delete` 图标
- 颜色：`var(--color-danger)` (#f56c6c)
- 大小：20px
- 点击区域：44x44px (符合触摸标准)
- 阻止事件冒泡，不触发卡片点击

### TransactionList 页面修改

**删除处理函数:**

```typescript
const handleDelete = async (transaction: Transaction) => {
  // 关闭详情面板（如果打开）
  showDetailSheet.value = false;

  try {
    // 显示确认对话框
    await ElMessageBox.confirm("确定要删除这条记录吗？", "提示", {
      type: "warning",
    });

    // 调用 store 删除
    await transactionStore.deleteTransaction(transaction.id);

    // 显示成功消息
    ElMessage.success("删除成功");
  } catch {
    // 用户取消，不做处理
  }
};
```

## 数据模型

无需修改现有数据模型，使用现有的 Transaction 类型。

## 正确性属性

_属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。_

### 属性 1：删除按钮可见性

*对于任何*移动端交易卡片，当 showActions 为 true 时，删除按钮应该可见且可点击

**验证：需求 1.1**

### 属性 2：事件冒泡阻止

*对于任何*删除按钮点击事件，该事件不应该触发父元素（卡片）的点击事件

**验证：需求 2.3**

### 属性 3：确认对话框显示

*对于任何*删除按钮点击，系统应该在执行删除前显示确认对话框

**验证：需求 1.2**

### 属性 4：删除操作原子性

*对于任何*交易删除操作，要么完全成功（交易、附件、账户余额都更新），要么完全失败（所有数据保持不变）

**验证：需求 5.3**

### 属性 5：桌面端功能不变

*对于任何*桌面端视图，删除功能应该与修改前保持完全一致

**验证：需求 3.1, 3.2**

### 属性 6：触摸区域大小

*对于任何*移动端删除按钮，其可点击区域应该至少为 44x44 像素

**验证：需求 6.3**

## 错误处理

### 删除失败场景

1. **网络错误**
   - 显示错误提示："网络错误，请稍后重试"
   - 保持列表状态不变

2. **权限错误**
   - 显示错误提示："无权限删除此记录"
   - 保持列表状态不变

3. **数据不存在**
   - 显示错误提示："记录不存在或已被删除"
   - 刷新列表

4. **用户取消**
   - 静默处理，不显示任何提示
   - 保持列表状态不变

### 错误处理代码模式

```typescript
try {
  await ElMessageBox.confirm("确定要删除这条记录吗？", "提示", {
    type: "warning",
  });
  await transactionStore.deleteTransaction(transaction.id);
  ElMessage.success("删除成功");
} catch (error: unknown) {
  // 用户取消时 error 为 'cancel'，不显示错误
  if (error !== "cancel") {
    const err = error as { message?: string };
    ElMessage.error(err.message || "删除失败");
  }
}
```

## 测试策略

### 单元测试

1. **TransactionCard 组件测试**
   - 测试删除按钮渲染
   - 测试删除事件触发
   - 测试事件冒泡阻止
   - 测试按钮可见性控制

2. **TransactionList 页面测试**
   - 测试删除确认对话框显示
   - 测试删除成功流程
   - 测试删除失败处理
   - 测试用户取消操作

### 集成测试

1. **端到端删除流程**
   - 创建交易 → 在列表中删除 → 验证列表更新
   - 创建带附件的交易 → 删除 → 验证附件被删除
   - 删除交易 → 验证账户余额更新

2. **响应式布局测试**
   - 测试不同屏幕尺寸下按钮显示
   - 测试触摸区域大小
   - 测试按钮不重叠

### 属性测试

使用 Vitest 进行属性测试，每个测试运行至少 100 次迭代。

**测试标签格式：** `Feature: transaction-list-delete, Property {number}: {property_text}`

## 实现注意事项

### Vue 3 最佳实践

1. **使用 Composition API**
   - 使用 `ref` 和 `computed` 管理状态
   - 使用 `emit` 触发事件

2. **事件处理**
   - 使用 `@click.stop` 阻止事件冒泡
   - 使用 async/await 处理异步操作

3. **样式设计**
   - 使用 CSS 变量保持主题一致性
   - 使用 flexbox 实现响应式布局
   - 确保触摸区域足够大

### 性能优化

1. **避免不必要的重渲染**
   - 使用 `v-if` 而不是 `v-show` 控制按钮显示
   - 合理使用 `computed` 缓存计算结果

2. **优化删除操作**
   - 使用乐观更新：先更新 UI，再调用 API
   - 失败时回滚 UI 状态

## 可访问性

1. **键盘导航**
   - 删除按钮可通过 Tab 键聚焦
   - 支持 Enter/Space 键触发删除

2. **屏幕阅读器**
   - 删除按钮添加 `aria-label="删除"`
   - 确认对话框有清晰的文本描述

3. **视觉反馈**
   - 按钮有 hover 和 active 状态
   - 删除操作有 loading 状态提示
