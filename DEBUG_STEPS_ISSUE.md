# 单例任务默认步骤点击问题调试

## 问题描述
单例任务下的默认步骤点击没反应，checkbox不生效。

## 调试步骤

### 1. 检查任务创建
- 创建一个新的单例任务，不添加任何步骤
- 检查任务是否正确添加了默认步骤"我已完成任务"

### 2. 检查组件渲染
- 打开浏览器开发者工具的控制台
- 查看TaskSteps组件的调试信息：
  - `TaskSteps: 渲染组件` - 显示任务信息和步骤数量
  - `TaskSteps: 渲染步骤` - 显示每个步骤的详细信息

### 3. 检查点击事件
- 点击步骤或checkbox时，查看控制台输出：
  - `CustomCheckbox点击:` - 显示checkbox点击事件
  - `TaskSteps: handleStepClick called` - 显示步骤点击事件
  - `TaskSteps: handleCheckboxChange called` - 显示checkbox变化事件

### 4. 检查API调用
- 查看是否有API调用错误
- 检查步骤完成状态是否正确更新

## 可能的问题原因

### 1. 任务没有默认步骤
- 如果任务是在修改之前创建的，可能没有默认步骤
- 需要检查`task.steps.length`是否为0

### 2. 用户ID不匹配
- 检查`task.userIds`和`activeUserId`是否匹配
- 单用户任务应该使用`task.userIds[0]`

### 3. 步骤状态问题
- 检查`step.completedByUsers`数组是否正确
- 检查`isCompletedByCurrentUser`的计算是否正确

### 4. 事件处理问题
- 检查`onClick`事件是否被正确触发
- 检查`onChange`回调是否被正确调用

## 调试信息说明

### TaskSteps组件调试信息
```javascript
// 组件渲染时
console.log('TaskSteps: 渲染组件', { 
  taskId: task.id, 
  stepsLength: task.steps.length, 
  steps: task.steps,
  userIds: task.userIds,
  activeUserId 
});

// 步骤渲染时
console.log('TaskSteps: 渲染步骤', { 
  stepId: step.id, 
  stepName: step.name, 
  isCompletedByCurrentUser, 
  completedByUsers: step.completedByUsers,
  userIds: task.userIds,
  activeUserId,
  userIdsLength: task.userIds.length
});

// 步骤点击时
console.log('TaskSteps: handleStepClick called', { stepId, taskId: task.id, userIds: task.userIds, activeUserId });

// Checkbox变化时
console.log('TaskSteps: handleCheckboxChange called', { stepId, checked, taskId: task.id, userIds: task.userIds, activeUserId });
```

### CustomCheckbox组件调试信息
```javascript
// Checkbox点击时
console.log('CustomCheckbox点击:', { checked, disabled });
console.log('CustomCheckbox调用onChange:', !checked);
```

## 解决方案

### 如果任务没有默认步骤
1. 删除现有任务
2. 重新创建任务（会自动添加默认步骤）

### 如果用户ID不匹配
1. 检查任务创建时的用户ID
2. 确保activeUserId正确设置

### 如果事件处理有问题
1. 检查CustomCheckbox组件是否正确渲染
2. 检查onClick和onChange事件是否正确绑定

## 测试用例

### 测试用例1：新建单例任务
1. 创建新的单例任务，不添加步骤
2. 保存任务
3. 打开任务详情页面
4. 检查是否显示默认步骤"我已完成任务"
5. 点击步骤或checkbox
6. 检查是否正常工作

### 测试用例2：现有任务
1. 打开现有的单例任务
2. 检查是否有步骤
3. 如果没有步骤，尝试添加一个步骤
4. 测试步骤的点击和checkbox功能

## 预期结果
- 单例任务应该显示默认步骤"我已完成任务"
- 点击步骤或checkbox应该能正常切换完成状态
- 完成状态应该正确保存和显示
- 完成时间应该正确记录
