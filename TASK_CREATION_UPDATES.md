# 任务创建逻辑更新

## 更新内容

### 1. 复合任务必须有子任务
- **修改位置**: `src/ui/tasks/components/TaskForm.tsx`
- **功能**: 为复合任务添加了必填验证，确保至少有一个子任务
- **实现方式**: 
  - 在子任务模板字段添加了红色星号标识必填
  - 添加了表单验证规则，如果复合任务没有子任务会显示错误信息
  - 验证器会检查子任务模板数组是否为空

### 2. 无步骤任务自动添加默认步骤
- **修改位置**: `src/api/Request.ts` 的 `createTask` 方法
- **功能**: 为无步骤的单例任务和子任务自动添加默认步骤
- **实现方式**:
  - 单例任务无步骤时自动添加"我已完成任务"默认步骤
  - 子任务无步骤时自动添加"标记为完成"默认步骤
  - 保持原有步骤不变，只在无步骤时添加默认步骤

### 3. 完成时间记录功能
- **修改位置**: `src/api/Request.ts` 的 `updateSubtask` 方法
- **功能**: 记录子任务完成和取消完成的时间
- **实现方式**:
  - 子任务被标记为完成时自动记录 `completedAt` 时间戳
  - 子任务被标记为未完成时清除 `completedAt` 时间戳
  - 步骤完成时间已在现有API中实现

### 4. 用户界面优化
- **修改位置**: `src/ui/tasks/components/TaskForm.tsx`
- **功能**: 为用户提供更清晰的说明
- **实现方式**:
  - 在步骤字段添加说明文字，告知用户无步骤时会自动添加默认步骤
  - 为子任务模板字段添加必填标识

## 技术细节

### 表单验证
```tsx
<Form.List 
  name="subtaskTemplates"
  rules={[
    {
      validator: (_, value) => {
        if (!value || value.length === 0) {
          return Promise.reject(new Error('复合任务必须至少有一个子任务'));
        }
        return Promise.resolve();
      }
    }
  ]}
>
```

### 默认步骤添加
```typescript
// 为无步骤的任务添加默认步骤
let taskSteps = data.steps;
if (!taskSteps || taskSteps.length === 0) {
  taskSteps = [{ name: "我已完成任务" }];
}
```

### 完成时间记录
```typescript
// 如果子任务被标记为完成，记录完成时间
if (updates.completed === true && !subtask.completed) {
  updatedSubtask.completedAt = new Date().toISOString();
}
// 如果子任务被标记为未完成，清除完成时间
else if (updates.completed === false && subtask.completed) {
  updatedSubtask.completedAt = undefined;
}
```

## 用户体验改进

1. **复合任务创建**: 用户现在必须为复合任务添加至少一个子任务，避免创建空的复合任务
2. **默认步骤**: 用户无需手动添加步骤，系统会自动为无步骤的任务添加合适的默认步骤
3. **时间记录**: 所有完成操作都会自动记录时间，便于追踪任务进度
4. **界面提示**: 用户界面提供了清晰的说明，帮助用户理解系统行为

## 兼容性

- 所有修改都向后兼容，不会影响现有数据
- 现有任务和子任务的功能保持不变
- 新功能只在创建新任务时生效

## 测试建议

1. 创建复合任务时不添加子任务，验证是否显示错误信息
2. 创建单例任务时不添加步骤，验证是否自动添加默认步骤
3. 完成和取消完成子任务，验证时间记录是否正确
4. 检查现有任务的功能是否正常工作
