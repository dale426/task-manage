// 任务类型枚举
export enum TaskType {
  SINGLE = "single",
  COMPOSITE = "composite"
}

// 任务类型显示名称映射
export const TaskTypeLabels = {
  [TaskType.SINGLE]: "单例",
  [TaskType.COMPOSITE]: "复合"
} as const;

// 项目重复频率枚举
export enum ProjectRepeat {
  NONE = "none",
  DAILY = "daily", 
  WEEKLY = "weekly",
  MONTHLY = "monthly"
}

// 项目重复频率显示名称映射
export const ProjectRepeatLabels = {
  [ProjectRepeat.NONE]: "不重复",
  [ProjectRepeat.DAILY]: "每日",
  [ProjectRepeat.WEEKLY]: "每周", 
  [ProjectRepeat.MONTHLY]: "每月"
} as const;

// 用户级别枚举
export enum UserLevel {
  LEVEL_1 = "level_1",
  LEVEL_2 = "level_2", 
  LEVEL_3 = "level_3"
}

// 用户级别显示名称映射
export const UserLevelLabels = {
  [UserLevel.LEVEL_1]: "一级",
  [UserLevel.LEVEL_2]: "二级",
  [UserLevel.LEVEL_3]: "三级"
} as const;

// 用户级别排序权重（数字越小排序越靠前）
export const UserLevelOrder = {
  [UserLevel.LEVEL_1]: 1,
  [UserLevel.LEVEL_2]: 2,
  [UserLevel.LEVEL_3]: 3
} as const;
