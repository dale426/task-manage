# 用户Tab任务完成情况Tag功能

## 功能概述

在任务详情页面的用户tab右上角添加任务完成情况的tag显示，参照任务列表页面的tag样式。

## 实现规则

### 1. 单例任务
- **Tag内容**: 待完成步骤数
- **显示条件**: 当用户有未完成的步骤时显示
- **Tag颜色**: 橙色 (orange)
- **示例**: 如果用户有3个未完成步骤，显示 "3"

### 2. 复合任务
- **Tag内容**: "已完成数/总任务数" 格式
- **显示条件**: 当用户有子任务时显示
- **Tag颜色**: 
  - 全部完成: 绿色 (green)
  - 部分完成: 蓝色 (blue)
- **示例**: 如果用户有4个子任务，完成了1个，显示 "1/4"

## 技术实现

### 1. UserTabs组件更新

#### 新增Props
```typescript
interface UserTabsProps {
  // ... 原有props
  task?: Task;                    // 任务信息
  taskSubtasks?: Subtask[];       // 子任务列表（复合任务需要）
  showTaskProgress?: boolean;      // 是否显示任务进度
}
```

#### 新增计算函数
```typescript
// 计算单例任务的待完成步骤数
const getSingleTaskIncompleteSteps = (userId: ID) => {
  if (!task || task.type !== TaskType.SINGLE) return 0;
  
  let incompleteCount = 0;
  task.steps.forEach(step => {
    const isCompleted = (step.completedByUsers || []).includes(userId);
    if (!isCompleted) {
      incompleteCount++;
    }
  });
  return incompleteCount;
};

// 计算复合任务的完成情况
const getCompositeTaskProgress = (userId: ID) => {
  if (!task || task.type !== TaskType.COMPOSITE || !taskSubtasks) return { completed: 0, total: 0 };
  
  const userSubtasks = taskSubtasks.filter(subtask => subtask.ownerUserId === userId);
  const completedSubtasks = userSubtasks.filter(subtask => subtask.completed);
  
  return {
    completed: completedSubtasks.length,
    total: userSubtasks.length
  };
};
```

#### Tag样式
```typescript
// 单例任务tag
<Tag
  color="orange"
  style={{ 
    fontSize: "10px", 
    padding: "0 4px", 
    height: "16px", 
    lineHeight: "14px",
    margin: 0,
    minWidth: "auto",
  }}
>
  {incompleteSteps}
</Tag>

// 复合任务tag
<Tag
  color={progress.completed === progress.total ? "green" : "blue"}
  style={{ 
    fontSize: "10px", 
    padding: "0 4px", 
    height: "16px", 
    lineHeight: "14px",
    margin: 0,
    minWidth: "auto",
  }}
>
  {progress.completed}/{progress.total}
</Tag>
```

### 2. 组件更新

#### TaskSteps组件
```typescript
<UserTabs
  userIds={task.userIds}
  users={users}
  activeUserId={activeUserId}
  onUserChange={onUserChange}
  getUserCompletionStatus={getUserCompletionStatus}
  task={task}
  showTaskProgress={true}
/>
```

#### SubtaskList组件
```typescript
<UserTabs
  userIds={task.userIds}
  users={users}
  activeUserId={activeUserId}
  onUserChange={onUserChange}
  getUserCompletionStatus={getUserCompletionStatus}
  getUserIncompleteCount={getUserIncompleteCount}
  task={task}
  taskSubtasks={taskSubtasks}
  showTaskProgress={true}
/>
```

## 显示效果

### 单例任务示例
```
用户A [3] ✓
用户B [1] 
用户C ✓
```

### 复合任务示例
```
用户A [2/4] ✓
用户B [4/4] ✓
用户C [0/3] 
```

## 样式特点

1. **参照任务列表**: 使用与任务列表页面相同的tag样式
2. **小尺寸**: 10px字体，紧凑的padding
3. **颜色区分**: 
   - 橙色：单例任务待完成步骤
   - 蓝色：复合任务进行中
   - 绿色：复合任务全部完成
4. **位置**: 用户名右侧，完成状态图标左侧

## 兼容性

- 向后兼容：不影响现有功能
- 可选显示：通过`showTaskProgress`控制是否显示
- 渐进增强：只在有任务数据时显示

## 测试用例

### 测试用例1：单例任务
1. 创建单例任务，添加3个步骤
2. 分配给2个用户
3. 用户A完成1个步骤，用户B完成0个步骤
4. 检查用户tab显示：
   - 用户A: [2] (2个待完成步骤)
   - 用户B: [3] (3个待完成步骤)

### 测试用例2：复合任务
1. 创建复合任务，添加4个子任务
2. 分配给2个用户
3. 用户A完成2个子任务，用户B完成4个子任务
4. 检查用户tab显示：
   - 用户A: [2/4] (蓝色，部分完成)
   - 用户B: [4/4] (绿色，全部完成)

### 测试用例3：无进度情况
1. 创建任务但不分配用户
2. 检查用户tab不显示进度tag

## 总结

成功实现了用户tab右上角的任务完成情况tag显示功能：

1. ✅ 单例任务显示待完成步骤数
2. ✅ 复合任务显示完成情况 "已完成/总数"
3. ✅ 参照任务列表页面的tag样式
4. ✅ 颜色区分不同状态
5. ✅ 向后兼容，不影响现有功能
6. ✅ 代码无linting错误

