import { STORAGE_KEYS, API_CONFIG, API_ENDPOINTS } from './constants';
import type { ID, User, Project, Task, TaskStep, Subtask, Appointment } from '../domain/types';
import { UserLevel, TaskType, ProjectRepeat } from '../domain/enums';

// 通用响应类型
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分页响应类型
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 请求参数类型
interface CreateUserRequest {
  nickname: string;
  phone?: string;
  note?: string;
  level?: UserLevel;
}

interface UpdateUserRequest {
  nickname?: string;
  phone?: string;
  note?: string;
  level?: UserLevel;
}

interface CreateProjectRequest {
  name: string;
  note?: string;
  userIds?: ID[];
  repeat?: ProjectRepeat;
}

interface UpdateProjectRequest {
  name?: string;
  note?: string;
  userIds?: ID[];
  repeat?: ProjectRepeat;
}

interface CreateTaskRequest {
  name: string;
  projectId?: ID;
  userIds: ID[];
  note?: string;
  type: TaskType;
  steps: { name: string }[];
  subtaskTemplates?: string[];
  dueAt?: string;
}

interface UpdateTaskRequest {
  name?: string;
  projectId?: ID;
  userIds?: ID[];
  note?: string;
  type?: TaskType;
  steps?: { name: string }[];
  subtaskTemplates?: string[];
  dueAt?: string;
  completed?: boolean;
}

interface CreateAppointmentRequest {
  title: string;
  content: string;
  userIds: ID[];
  startTime: string;
  endTime: string;
}

interface UpdateAppointmentRequest {
  title?: string;
  content?: string;
  userIds?: ID[];
  startTime?: string;
  endTime?: string;
  completed?: boolean;
  status?: 'pending' | 'started' | 'completed' | 'ended';
}

interface CreateUserNoteRequest {
  entityType: 'task' | 'task_step' | 'subtask';
  entityId: ID;
  userId: ID;
  note: string;
}

interface UpdateUserNoteRequest {
  note: string;
}

// 本地存储工具函数
class LocalStorageManager {
  static get<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      console.log(`读取localStorage[${key}]:`, JSON.parse(data || '[]'));
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`读取localStorage[${key}]失败:`, error);
      return [];
    }
  }

  static set<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  static add<T extends { id: ID }>(key: string, item: T): T {
    const items = this.get<T>(key);
    items.push(item);
    this.set(key, items);
    return item;
  }

  static update<T extends { id: ID }>(key: string, id: ID, updates: Partial<T>): T | undefined {
    const items = this.get<T>(key);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return undefined;
    
    items[index] = { ...items[index], ...updates } as T;
    this.set(key, items);
    return items[index];
  }

  static delete<T extends { id: ID }>(key: string, id: ID): boolean {
    const items = this.get<T>(key);
    const filteredItems = items.filter(item => item.id !== id);
    if (filteredItems.length === items.length) return false;
    
    this.set(key, filteredItems);
    return true;
  }

  static findById<T extends { id: ID }>(key: string, id: ID): T | undefined {
    const items = this.get<T>(key);
    return items.find(item => item.id === id);
  }
}

// 模拟API请求延迟
const delay = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms));

// API请求类
class ApiRequest {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // 模拟网络延迟
    await delay();
    
    try {
      // 这里可以替换为真实的API调用
      // const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      //   ...options,
      //   headers: {
      //     ...API_CONFIG.HEADERS,
      //     ...options.headers,
      //   },
      // });
      // return await response.json();
      
      // 目前使用localStorage模拟API响应
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 用户管理API
  static async getUsers(): Promise<ApiResponse<User[]>> {
    const users = LocalStorageManager.get<User>(STORAGE_KEYS.USERS);
    return { success: true, data: users };
  }

  static async getUserById(id: ID): Promise<ApiResponse<User>> {
    const user = LocalStorageManager.findById<User>(STORAGE_KEYS.USERS, id);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    return { success: true, data: user };
  }

  static async createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nickname: data.nickname,
      phone: data.phone,
      note: data.note,
      level: data.level || UserLevel.LEVEL_3,
    };
    
    const createdUser = LocalStorageManager.add(STORAGE_KEYS.USERS, user);
    return { success: true, data: createdUser };
  }

  static async updateUser(id: ID, data: UpdateUserRequest): Promise<ApiResponse<User>> {
    const updatedUser = LocalStorageManager.update<User>(STORAGE_KEYS.USERS, id, data);
    if (!updatedUser) {
      return { success: false, error: 'User not found' };
    }
    return { success: true, data: updatedUser };
  }

  static async deleteUser(id: ID): Promise<ApiResponse<void>> {
    const success = LocalStorageManager.delete(STORAGE_KEYS.USERS, id);
    if (!success) {
      return { success: false, error: 'User not found' };
    }
    return { success: true };
  }

  // 项目管理API
  static async getProjects(): Promise<ApiResponse<Project[]>> {
    const projects = LocalStorageManager.get<Project>(STORAGE_KEYS.PROJECTS);
    return { success: true, data: projects };
  }

  static async getProjectById(id: ID): Promise<ApiResponse<Project>> {
    const project = LocalStorageManager.findById<Project>(STORAGE_KEYS.PROJECTS, id);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }
    return { success: true, data: project };
  }

  static async createProject(data: CreateProjectRequest): Promise<ApiResponse<Project>> {
    const project: Project = {
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      note: data.note,
      userIds: data.userIds || [],
      repeat: data.repeat || ProjectRepeat.NONE,
    };
    
    const createdProject = LocalStorageManager.add(STORAGE_KEYS.PROJECTS, project);
    return { success: true, data: createdProject };
  }

  static async updateProject(id: ID, data: UpdateProjectRequest): Promise<ApiResponse<Project>> {
    const updatedProject = LocalStorageManager.update<Project>(STORAGE_KEYS.PROJECTS, id, data);
    if (!updatedProject) {
      return { success: false, error: 'Project not found' };
    }
    return { success: true, data: updatedProject };
  }

  static async deleteProject(id: ID): Promise<ApiResponse<void>> {
    const success = LocalStorageManager.delete(STORAGE_KEYS.PROJECTS, id);
    if (!success) {
      return { success: false, error: 'Project not found' };
    }
    return { success: true };
  }

  // 任务管理API
  static async getTasks(): Promise<ApiResponse<Task[]>> {
    const tasks = LocalStorageManager.get<Task>(STORAGE_KEYS.TASKS);
    return { success: true, data: tasks };
  }

  // 子任务管理API
  static async getSubtasksByTaskId(taskId: ID): Promise<ApiResponse<Subtask[]>> {
    const allSubtasks = LocalStorageManager.get<Subtask>(STORAGE_KEYS.SUBTASKS);
    const subtasks = allSubtasks.filter(subtask => subtask.taskId === taskId);
    return { success: true, data: subtasks };
  }

  static async getSubtasks(): Promise<ApiResponse<Subtask[]>> {
    const subtasks = LocalStorageManager.get<Subtask>(STORAGE_KEYS.SUBTASKS);
    return { success: true, data: subtasks };
  }

  static async createSubtask(taskId: ID, data: Pick<Subtask, "name" | "ownerUserId">): Promise<ApiResponse<Subtask>> {
    // 获取任务信息以复制步骤
    const task = LocalStorageManager.findById<Task>(STORAGE_KEYS.TASKS, taskId);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    // 为子任务复制任务的步骤
    const subtaskSteps: TaskStep[] = task.steps.map((step, index) => ({
      id: `subtask_step_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      name: step.name,
    }));

    const subtask: Subtask = {
      id: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      name: data.name,
      ownerUserId: data.ownerUserId,
      steps: subtaskSteps,
      completed: false,
    };

    const createdSubtask = LocalStorageManager.add(STORAGE_KEYS.SUBTASKS, subtask);
    return { success: true, data: createdSubtask };
  }

  static async updateSubtask(taskId: ID, subtaskId: ID, updates: Partial<Pick<Subtask, "name" | "completed" | "note">>): Promise<ApiResponse<void>> {
    const subtasks = LocalStorageManager.get<Subtask>(STORAGE_KEYS.SUBTASKS);
    const subtaskIndex = subtasks.findIndex(s => s.id === subtaskId && s.taskId === taskId);
    
    if (subtaskIndex === -1) {
      return { success: false, error: 'Subtask not found' };
    }

    subtasks[subtaskIndex] = { ...subtasks[subtaskIndex], ...updates };
    LocalStorageManager.set(STORAGE_KEYS.SUBTASKS, subtasks);
    return { success: true };
  }

  static async deleteSubtask(taskId: ID, subtaskId: ID): Promise<ApiResponse<void>> {
    const subtasks = LocalStorageManager.get<Subtask>(STORAGE_KEYS.SUBTASKS);
    const filteredSubtasks = subtasks.filter(s => !(s.id === subtaskId && s.taskId === taskId));
    
    if (filteredSubtasks.length === subtasks.length) {
      return { success: false, error: 'Subtask not found' };
    }

    LocalStorageManager.set(STORAGE_KEYS.SUBTASKS, filteredSubtasks);
    return { success: true };
  }

  static async markSubtaskStepComplete(taskId: ID, subtaskId: ID, stepId: ID, userId: ID): Promise<ApiResponse<void>> {
    const subtasks = LocalStorageManager.get<Subtask>(STORAGE_KEYS.SUBTASKS);
    const subtaskIndex = subtasks.findIndex(s => s.id === subtaskId && s.taskId === taskId);
    
    if (subtaskIndex === -1) {
      return { success: false, error: 'Subtask not found' };
    }

    const subtask = subtasks[subtaskIndex];
    const stepIndex = subtask.steps.findIndex(step => step.id === stepId);
    
    if (stepIndex === -1) {
      return { success: false, error: 'Step not found' };
    }

    const step = subtask.steps[stepIndex];
    const completedByUsers = step.completedByUsers || [];
    if (!completedByUsers.includes(userId)) {
      completedByUsers.push(userId);
    }

    const userCompletedAt = step.userCompletedAt || {};
    userCompletedAt[userId] = new Date().toISOString();

    subtask.steps[stepIndex] = {
      ...step,
      completedByUsers,
      userCompletedAt,
      completedAt: new Date().toISOString(),
    };

    // 检查是否所有步骤都完成了
    // 对于多用户场景，检查所有步骤是否都有用户完成
    const allStepsCompleted = subtask.steps.every(step => 
      (step.completedByUsers || []).length > 0
    );

    if (allStepsCompleted) {
      subtask.completed = true;
      subtask.completedAt = new Date().toISOString();
    }

    subtasks[subtaskIndex] = subtask;
    LocalStorageManager.set(STORAGE_KEYS.SUBTASKS, subtasks);
    return { success: true };
  }

  static async getTaskById(id: ID): Promise<ApiResponse<Task>> {
    const task = LocalStorageManager.findById<Task>(STORAGE_KEYS.TASKS, id);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }
    return { success: true, data: task };
  }

  static async createTask(data: CreateTaskRequest): Promise<ApiResponse<Task>> {
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      projectId: data.projectId,
      userIds: data.userIds,
      note: data.note,
      type: data.type,
      steps: data.steps.map((step, index) => ({
        id: `step_${Date.now()}_${index}`,
        name: step.name,
      })),
      subtaskTemplates: data.subtaskTemplates,
      dueAt: data.dueAt,
      completed: false,
    };

    // 先保存任务
    const createdTask = LocalStorageManager.add(STORAGE_KEYS.TASKS, task);
    
    // 如果是复合任务且有子任务模板，为每个用户创建子任务并保存到独立存储
    if (data.type === 'composite' && data.subtaskTemplates && data.subtaskTemplates.length > 0 && data.userIds && data.userIds.length > 0) {
      const subtasks: Subtask[] = [];
      
      // 为每个用户创建子任务
      for (const userId of data.userIds) {
        for (const template of data.subtaskTemplates) {
          // 为每个子任务复制任务的步骤
          const subtaskSteps: TaskStep[] = task.steps.map((step, index) => ({
            id: `subtask_step_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
            name: step.name,
          }));
          
          const subtask: Subtask = {
            id: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            taskId: createdTask.id, // 关联任务ID
            name: template,
            ownerUserId: userId,
            steps: subtaskSteps,
            completed: false,
          };
          subtasks.push(subtask);
        }
      }
      
      // 将子任务保存到独立的存储中
      subtasks.forEach(subtask => {
        LocalStorageManager.add(STORAGE_KEYS.SUBTASKS, subtask);
      });
    }
    
    return { success: true, data: createdTask };
  }

  static async updateTask(id: ID, data: UpdateTaskRequest): Promise<ApiResponse<Task>> {
    const task = LocalStorageManager.findById<Task>(STORAGE_KEYS.TASKS, id);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    // 手动更新任务，避免类型冲突
    const updatedTask = {
      ...task,
      ...data,
      // 如果更新了steps，需要确保每个step都有id
      steps: data.steps ? data.steps.map((step, index) => ({
        id: `step_${Date.now()}_${index}`,
        name: step.name,
      })) : task.steps,
    };

    const tasks = LocalStorageManager.get<Task>(STORAGE_KEYS.TASKS);
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex !== -1) {
      tasks[taskIndex] = updatedTask;
      LocalStorageManager.set(STORAGE_KEYS.TASKS, tasks);
    }

    return { success: true, data: updatedTask };
  }

  static async deleteTask(id: ID): Promise<ApiResponse<void>> {
    const success = LocalStorageManager.delete(STORAGE_KEYS.TASKS, id);
    if (!success) {
      return { success: false, error: 'Task not found' };
    }
    
    // 删除关联的子任务
    const allSubtasks = LocalStorageManager.get<Subtask>(STORAGE_KEYS.SUBTASKS);
    const filteredSubtasks = allSubtasks.filter(subtask => subtask.taskId !== id);
    LocalStorageManager.set(STORAGE_KEYS.SUBTASKS, filteredSubtasks);
    
    console.log(`任务 ${id} 及其关联的子任务已删除`);
    return { success: true };
  }

  // 任务步骤管理API
  static async getTaskSteps(taskId: ID): Promise<ApiResponse<TaskStep[]>> {
    const task = LocalStorageManager.findById<Task>(STORAGE_KEYS.TASKS, taskId);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }
    return { success: true, data: task.steps };
  }

  static async createTaskStep(taskId: ID, name: string): Promise<ApiResponse<TaskStep>> {
    const task = LocalStorageManager.findById<Task>(STORAGE_KEYS.TASKS, taskId);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    const step: TaskStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
    };

    task.steps.push(step);
    
    // 手动更新任务步骤
    const tasks = LocalStorageManager.get<Task>(STORAGE_KEYS.TASKS);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex] = { ...tasks[taskIndex], steps: task.steps };
      LocalStorageManager.set(STORAGE_KEYS.TASKS, tasks);
    }
    
    return { success: true, data: step };
  }

  static async updateTaskStep(taskId: ID, stepId: ID, name: string): Promise<ApiResponse<TaskStep>> {
    const task = LocalStorageManager.findById<Task>(STORAGE_KEYS.TASKS, taskId);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    const stepIndex = task.steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) {
      return { success: false, error: 'Step not found' };
    }

    task.steps[stepIndex] = { ...task.steps[stepIndex], name };
    
    // 手动更新任务步骤
    const tasks = LocalStorageManager.get<Task>(STORAGE_KEYS.TASKS);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex] = { ...tasks[taskIndex], steps: task.steps };
      LocalStorageManager.set(STORAGE_KEYS.TASKS, tasks);
    }
    
    return { success: true, data: task.steps[stepIndex] };
  }

  static async deleteTaskStep(taskId: ID, stepId: ID): Promise<ApiResponse<void>> {
    const task = LocalStorageManager.findById<Task>(STORAGE_KEYS.TASKS, taskId);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    task.steps = task.steps.filter(step => step.id !== stepId);
    
    // 手动更新任务步骤
    const tasks = LocalStorageManager.get<Task>(STORAGE_KEYS.TASKS);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex] = { ...tasks[taskIndex], steps: task.steps };
      LocalStorageManager.set(STORAGE_KEYS.TASKS, tasks);
    }
    
    return { success: true };
  }

  // 任务完成状态管理API
  static async markTaskStepComplete(taskId: ID, stepId: ID, userId: ID): Promise<ApiResponse<void>> {
    const task = LocalStorageManager.findById<Task>(STORAGE_KEYS.TASKS, taskId);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    // 首先在任务的直接步骤中查找
    let stepIndex = task.steps.findIndex(step => step.id === stepId);
    let isSubtaskStep = false;
    let subtaskIndex = -1;

    if (stepIndex === -1) {
      // 如果在直接步骤中没找到，在子任务步骤中查找
      const subtasks = LocalStorageManager.get<Subtask>(STORAGE_KEYS.SUBTASKS);
      const taskSubtasks = subtasks.filter(subtask => subtask.taskId === taskId);
      
      for (let i = 0; i < taskSubtasks.length; i++) {
        const subtask = taskSubtasks[i];
        stepIndex = subtask.steps.findIndex(step => step.id === stepId);
        if (stepIndex !== -1) {
          isSubtaskStep = true;
          subtaskIndex = i;
          break;
        }
      }
    }

    if (stepIndex === -1) {
      return { success: false, error: 'Step not found' };
    }

    if (isSubtaskStep) {
      // 更新子任务步骤
      const subtasks = LocalStorageManager.get<Subtask>(STORAGE_KEYS.SUBTASKS);
      const taskSubtasks = subtasks.filter(subtask => subtask.taskId === taskId);
      const subtask = taskSubtasks[subtaskIndex];
      
      const completedByUsers = subtask.steps[stepIndex].completedByUsers || [];
      if (!completedByUsers.includes(userId)) {
        completedByUsers.push(userId);
      }

      const userCompletedAt = subtask.steps[stepIndex].userCompletedAt || {};
      userCompletedAt[userId] = new Date().toISOString();

      subtask.steps[stepIndex] = {
        ...subtask.steps[stepIndex],
        completedByUsers,
        userCompletedAt,
        completedAt: new Date().toISOString(),
      };

      // 更新子任务
      const allSubtasks = LocalStorageManager.get<Subtask>(STORAGE_KEYS.SUBTASKS);
      const allSubtaskIndex = allSubtasks.findIndex(s => s.id === subtask.id);
      if (allSubtaskIndex !== -1) {
        allSubtasks[allSubtaskIndex] = subtask;
        LocalStorageManager.set(STORAGE_KEYS.SUBTASKS, allSubtasks);
      }
    } else {
      // 更新任务步骤
      const completedByUsers = task.steps[stepIndex].completedByUsers || [];
      if (!completedByUsers.includes(userId)) {
        completedByUsers.push(userId);
      }

      const userCompletedAt = task.steps[stepIndex].userCompletedAt || {};
      userCompletedAt[userId] = new Date().toISOString();

      task.steps[stepIndex] = {
        ...task.steps[stepIndex],
        completedByUsers,
        userCompletedAt,
        completedAt: new Date().toISOString(),
      };

      // 更新任务
      const tasks = LocalStorageManager.get<Task>(STORAGE_KEYS.TASKS);
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        tasks[taskIndex] = task;
        LocalStorageManager.set(STORAGE_KEYS.TASKS, tasks);
      }
    }

    return { success: true };
  }

  static async markTaskStepIncomplete(taskId: ID, stepId: ID, userId: ID): Promise<ApiResponse<void>> {
    console.log('API: markTaskStepIncomplete called', { taskId, stepId, userId });
    const task = LocalStorageManager.findById<Task>(STORAGE_KEYS.TASKS, taskId);
    if (!task) {
      console.log('API: Task not found');
      return { success: false, error: 'Task not found' };
    }

    // 首先在任务的直接步骤中查找
    let stepIndex = task.steps.findIndex(step => step.id === stepId);
    let isSubtaskStep = false;
    let subtaskIndex = -1;

    if (stepIndex === -1) {
      // 如果在直接步骤中没找到，在子任务步骤中查找
      const subtasks = LocalStorageManager.get<Subtask>(STORAGE_KEYS.SUBTASKS);
      const taskSubtasks = subtasks.filter(subtask => subtask.taskId === taskId);
      
      for (let i = 0; i < taskSubtasks.length; i++) {
        const subtask = taskSubtasks[i];
        stepIndex = subtask.steps.findIndex(step => step.id === stepId);
        if (stepIndex !== -1) {
          isSubtaskStep = true;
          subtaskIndex = i;
          break;
        }
      }
    }

    if (stepIndex === -1) {
      return { success: false, error: 'Step not found' };
    }

    if (isSubtaskStep) {
      // 更新子任务步骤
      const subtasks = LocalStorageManager.get<Subtask>(STORAGE_KEYS.SUBTASKS);
      const taskSubtasks = subtasks.filter(subtask => subtask.taskId === taskId);
      const subtask = taskSubtasks[subtaskIndex];

      const completedByUsers = subtask.steps[stepIndex].completedByUsers || [];
      const userCompletedAt = subtask.steps[stepIndex].userCompletedAt || {};
      
      // 移除用户完成状态
      const filteredCompletedByUsers = completedByUsers.filter(id => id !== userId);
      delete userCompletedAt[userId];

      subtask.steps[stepIndex] = {
        ...subtask.steps[stepIndex],
        completedByUsers: filteredCompletedByUsers,
        userCompletedAt,
        // 如果没有任何用户完成，清除completedAt
        completedAt: filteredCompletedByUsers.length > 0 ? subtask.steps[stepIndex].completedAt : undefined,
      };

      // 更新子任务
      const allSubtasks = LocalStorageManager.get<Subtask>(STORAGE_KEYS.SUBTASKS);
      const allSubtaskIndex = allSubtasks.findIndex(s => s.id === subtask.id);
      if (allSubtaskIndex !== -1) {
        allSubtasks[allSubtaskIndex] = subtask;
        LocalStorageManager.set(STORAGE_KEYS.SUBTASKS, allSubtasks);
      }
    } else {
      // 更新任务步骤
      const completedByUsers = task.steps[stepIndex].completedByUsers || [];
      const userCompletedAt = task.steps[stepIndex].userCompletedAt || {};
      
      console.log('API: 更新前状态', { 
        stepId, 
        userId, 
        completedByUsers, 
        userCompletedAt 
      });
      
      // 移除用户完成状态
      const filteredCompletedByUsers = completedByUsers.filter(id => id !== userId);
      delete userCompletedAt[userId];
      
      console.log('API: 更新后状态', { 
        filteredCompletedByUsers, 
        userCompletedAt 
      });

      task.steps[stepIndex] = {
        ...task.steps[stepIndex],
        completedByUsers: filteredCompletedByUsers,
        userCompletedAt,
        // 如果没有任何用户完成，清除completedAt
        completedAt: filteredCompletedByUsers.length > 0 ? task.steps[stepIndex].completedAt : undefined,
      };

      // 更新任务
      const tasks = LocalStorageManager.get<Task>(STORAGE_KEYS.TASKS);
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        tasks[taskIndex] = task;
        LocalStorageManager.set(STORAGE_KEYS.TASKS, tasks);
      }
    }

    return { success: true };
  }

  static async markTaskComplete(taskId: ID, userId: ID): Promise<ApiResponse<void>> {
    const task = LocalStorageManager.findById<Task>(STORAGE_KEYS.TASKS, taskId);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    const completedByUsers = task.completedByUsers || [];
    if (!completedByUsers.includes(userId)) {
      completedByUsers.push(userId);
    }

    const userCompletedAt = task.userCompletedAt || {};
    userCompletedAt[userId] = new Date().toISOString();

    const updates: Partial<Task> = {
      completedByUsers,
      userCompletedAt,
    };

    // 如果所有用户都完成了，标记任务为完成
    if (completedByUsers.length === task.userIds.length) {
      updates.completed = true;
      updates.completedAt = new Date().toISOString();
    }

    // 手动更新任务
    const tasks = LocalStorageManager.get<Task>(STORAGE_KEYS.TASKS);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
      LocalStorageManager.set(STORAGE_KEYS.TASKS, tasks);
    }
    
    return { success: true };
  }

  // 预约管理API
  static async getAppointments(): Promise<ApiResponse<Appointment[]>> {
    const appointments = LocalStorageManager.get<Appointment>(STORAGE_KEYS.APPOINTMENTS);
    return { success: true, data: appointments };
  }

  static async getAppointmentById(id: ID): Promise<ApiResponse<Appointment>> {
    const appointment = LocalStorageManager.findById<Appointment>(STORAGE_KEYS.APPOINTMENTS, id);
    if (!appointment) {
      return { success: false, error: 'Appointment not found' };
    }
    return { success: true, data: appointment };
  }

  static async createAppointment(data: CreateAppointmentRequest): Promise<ApiResponse<Appointment>> {
    const appointment: Appointment = {
      id: `appointment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: data.title,
      content: data.content,
      userIds: data.userIds,
      startTime: data.startTime,
      endTime: data.endTime,
      completed: false,
      status: 'pending',
    };
    
    const createdAppointment = LocalStorageManager.add(STORAGE_KEYS.APPOINTMENTS, appointment);
    return { success: true, data: createdAppointment };
  }

  static async updateAppointment(id: ID, data: UpdateAppointmentRequest): Promise<ApiResponse<Appointment>> {
    const updatedAppointment = LocalStorageManager.update<Appointment>(STORAGE_KEYS.APPOINTMENTS, id, data);
    if (!updatedAppointment) {
      return { success: false, error: 'Appointment not found' };
    }
    return { success: true, data: updatedAppointment };
  }

  static async deleteAppointment(id: ID): Promise<ApiResponse<void>> {
    const success = LocalStorageManager.delete(STORAGE_KEYS.APPOINTMENTS, id);
    if (!success) {
      return { success: false, error: 'Appointment not found' };
    }
    return { success: true };
  }

  static async markAppointmentComplete(id: ID): Promise<ApiResponse<Appointment>> {
    const appointment = LocalStorageManager.findById<Appointment>(STORAGE_KEYS.APPOINTMENTS, id);
    if (!appointment) {
      return { success: false, error: 'Appointment not found' };
    }

    const updatedAppointment = LocalStorageManager.update<Appointment>(STORAGE_KEYS.APPOINTMENTS, id, {
      completed: true,
      completedAt: new Date().toISOString(),
      status: 'completed',
    });

    return { success: true, data: updatedAppointment };
  }

  // 用户备注管理API
  static async getUserNotes(entityType: string, entityId: ID): Promise<ApiResponse<any[]>> {
    const notes = LocalStorageManager.get<any>(STORAGE_KEYS.USER_NOTES);
    const filteredNotes = notes.filter(note => 
      note.entityType === entityType && note.entityId === entityId
    );
    return { success: true, data: filteredNotes };
  }

  static async createUserNote(data: CreateUserNoteRequest): Promise<ApiResponse<any>> {
    const note = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityType: data.entityType,
      entityId: data.entityId,
      userId: data.userId,
      note: data.note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const createdNote = LocalStorageManager.add(STORAGE_KEYS.USER_NOTES, note);
    return { success: true, data: createdNote };
  }

  static async updateUserNote(id: ID, data: UpdateUserNoteRequest): Promise<ApiResponse<any>> {
    const updatedNote = LocalStorageManager.update<any>(STORAGE_KEYS.USER_NOTES, id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
    if (!updatedNote) {
      return { success: false, error: 'Note not found' };
    }
    return { success: true, data: updatedNote };
  }

  static async deleteUserNote(id: ID): Promise<ApiResponse<void>> {
    const success = LocalStorageManager.delete(STORAGE_KEYS.USER_NOTES, id);
    if (!success) {
      return { success: false, error: 'Note not found' };
    }
    return { success: true };
  }
}

export default ApiRequest;
