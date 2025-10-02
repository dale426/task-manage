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
