// 数据库表对应的localStorage key常量
export const STORAGE_KEYS = {
  // 核心实体表
  USERS: 'task-manage/users',
  PROJECTS: 'task-manage/projects', 
  TASKS: 'task-manage/tasks',
  APPOINTMENTS: 'task-manage/appointments',
  
  // 关联关系表
  PROJECT_USERS: 'task-manage/project_users',
  TASK_USERS: 'task-manage/task_users',
  APPOINTMENT_USERS: 'task-manage/appointment_users',
  
  // 步骤管理表
  TASK_STEPS: 'task-manage/task_steps',
  SUBTASKS: 'task-manage/subtasks',
  SUBTASK_STEPS: 'task-manage/subtask_steps',
  
  // 完成记录表
  TASK_STEP_COMPLETIONS: 'task-manage/task_step_completions',
  SUBTASK_STEP_COMPLETIONS: 'task-manage/subtask_step_completions',
  
  // 扩展功能表
  USER_NOTES: 'task-manage/user_notes',
} as const;

// API基础配置
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3001/api',
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
} as const;

// API端点常量
export const API_ENDPOINTS = {
  // 用户管理
  USERS: '/users',
  USER_BY_ID: (id: string) => `/users/${id}`,
  
  // 项目管理
  PROJECTS: '/projects',
  PROJECT_BY_ID: (id: string) => `/projects/${id}`,
  PROJECT_USERS: (id: string) => `/projects/${id}/users`,
  
  // 任务管理
  TASKS: '/tasks',
  TASK_BY_ID: (id: string) => `/tasks/${id}`,
  TASK_USERS: (id: string) => `/tasks/${id}/users`,
  TASK_STEPS: (id: string) => `/tasks/${id}/steps`,
  TASK_STEP_COMPLETE: (taskId: string, stepId: string) => `/tasks/${taskId}/steps/${stepId}/complete`,
  TASK_COMPLETE: (id: string) => `/tasks/${id}/complete`,
  
  // 子任务管理
  SUBTASKS: (taskId: string) => `/tasks/${taskId}/subtasks`,
  SUBTASK_BY_ID: (taskId: string, subtaskId: string) => `/tasks/${taskId}/subtasks/${subtaskId}`,
  SUBTASK_STEPS: (taskId: string, subtaskId: string) => `/tasks/${taskId}/subtasks/${subtaskId}/steps`,
  SUBTASK_STEP_COMPLETE: (taskId: string, subtaskId: string, stepId: string) => `/tasks/${taskId}/subtasks/${subtaskId}/steps/${stepId}/complete`,
  SUBTASK_COMPLETE: (taskId: string, subtaskId: string) => `/tasks/${taskId}/subtasks/${subtaskId}/complete`,
  
  // 预约管理
  APPOINTMENTS: '/appointments',
  APPOINTMENT_BY_ID: (id: string) => `/appointments/${id}`,
  APPOINTMENT_USERS: (id: string) => `/appointments/${id}/users`,
  APPOINTMENT_COMPLETE: (id: string) => `/appointments/${id}/complete`,
  
  // 用户备注
  USER_NOTES: '/user-notes',
  USER_NOTES_BY_ENTITY: (entityType: string, entityId: string) => `/user-notes/${entityType}/${entityId}`,
} as const;
