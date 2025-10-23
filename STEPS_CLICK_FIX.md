# 单例任务默认步骤点击问题修复

## 问题分析

### 发现的问题
1. **条件判断错误**: TaskSteps组件中有`task.steps.length === 0`的条件判断，但根据我们的修改，现在所有任务都有步骤
2. **activeUserId设置**: 单用户任务的activeUserId可能没有正确设置
3. **调试信息缺失**: 缺少足够的调试信息来定位问题

## 修复方案

### 1. 添加调试信息
在TaskSteps组件中添加了详细的调试信息：
- 组件渲染时的任务信息
- 步骤渲染时的详细信息
- 点击事件的处理过程
- Checkbox变化的处理过程

### 2. 修复activeUserId设置
在TaskDetailPage中添加了useEffect来确保单用户任务的activeUserId正确设置：
```typescript
useEffect(() => {
  if (task && task.userIds.length === 1 && !activeUserId) {
    setActiveUserId(task.userIds[0]);
  }
}, [task, activeUserId]);
```

### 3. 移除无用的条件判断
移除了`task.steps.length === 0`的条件判断，因为现在所有任务都有步骤。

### 4. 添加CustomCheckbox调试信息
在CustomCheckbox组件中添加了点击事件的调试信息。

## 调试步骤

### 1. 检查任务创建
- 创建新的单例任务，不添加步骤
- 检查任务是否正确添加了默认步骤"我已完成任务"

### 2. 检查组件渲染
打开浏览器开发者工具，查看控制台输出：
```
TaskSteps: 渲染组件 { taskId: "...", stepsLength: 1, steps: [...], userIds: [...], activeUserId: "..." }
TaskSteps: 渲染步骤 { stepId: "...", stepName: "我已完成任务", isCompletedByCurrentUser: false, ... }
```

### 3. 检查点击事件
点击步骤或checkbox时，查看控制台输出：
```
CustomCheckbox点击: { checked: false, disabled: false }
CustomCheckbox调用onChange: true
TaskSteps: handleCheckboxChange called { stepId: "...", checked: true, ... }
```

### 4. 检查API调用
查看是否有API调用错误，检查步骤完成状态是否正确更新。

## 可能的问题原因

### 1. 任务没有默认步骤
如果任务是在修改之前创建的，可能没有默认步骤。解决方案：
- 删除现有任务，重新创建
- 或者手动为现有任务添加步骤

### 2. 用户ID不匹配
检查`task.userIds`和`activeUserId`是否匹配：
- 单用户任务应该使用`task.userIds[0]`
- 多用户任务应该使用`activeUserId`

### 3. 步骤状态问题
检查步骤的完成状态：
- `step.completedByUsers`数组是否正确
- `isCompletedByCurrentUser`的计算是否正确

## 测试用例

### 测试用例1：新建单例任务
1. 创建新的单例任务，不添加步骤
2. 保存任务
3. 打开任务详情页面
4. 检查是否显示默认步骤"我已完成任务"
5. 点击步骤或checkbox
6. 检查控制台调试信息
7. 验证步骤状态是否正确更新

### 测试用例2：现有任务
1. 打开现有的单例任务
2. 检查是否有步骤
3. 如果没有步骤，尝试添加一个步骤
4. 测试步骤的点击和checkbox功能

## 预期结果

### 正常情况
- 单例任务应该显示默认步骤"我已完成任务"
- 点击步骤或checkbox应该能正常切换完成状态
- 完成状态应该正确保存和显示
- 完成时间应该正确记录

### 调试信息
- 控制台应该显示详细的调试信息
- 点击事件应该被正确触发
- API调用应该成功执行

## 如果问题仍然存在

### 检查清单
1. 确认任务有默认步骤
2. 确认activeUserId正确设置
3. 确认点击事件被触发
4. 确认API调用成功
5. 确认状态更新正确

### 进一步调试
如果问题仍然存在，可以：
1. 检查网络请求是否成功
2. 检查本地存储是否正确更新
3. 检查组件重新渲染是否正常
4. 检查状态管理是否正确
