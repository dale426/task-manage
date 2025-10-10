import { create } from "zustand";
import ApiRequest from "../api/Request";
import type {
  Project,
  Task,
  TaskStep,
  User,
  ID,
  Subtask,
  Appointment,
} from "./types";
import { TaskType, ProjectRepeat, UserLevel } from "./enums";

// 检查任务是否应该自动完成
const checkTaskAutoCompletion = (task: Task, subtasks: Subtask[]): boolean => {
  // 如果任务已经被强制完成，不进行自动完成检查
  if (task.completed) {
    return false;
  }

  if (task.type === TaskType.COMPOSITE) {
    // 复合任务：检查所有子任务是否都完成
    const taskSubtasks = subtasks.filter(s => s.taskId === task.id);
    
    // 如果没有子任务，不能自动完成
    if (taskSubtasks.length === 0) {
      return false;
    }
    
    // 检查所有子任务是否都完成
    return taskSubtasks.every(subtask => {
      if (subtask.steps.length > 0) {
        // 有步骤的子任务，检查所有步骤是否被所有者完成
        return subtask.steps.every(step => 
          step.completedByUsers?.includes(subtask.ownerUserId) || 
          step.doneByUserId === subtask.ownerUserId
        );
      } else {
        // 无步骤的子任务，直接检查子任务完成状态
        return subtask.completed;
      }
    });
  } else {
    // 单例任务：检查所有步骤是否都被所有用户完成
    if (task.steps.length === 0) {
      // 无步骤的任务，检查所有用户是否都完成
      return task.userIds.every(userId => 
        task.completedByUsers?.includes(userId)
      );
    } else {
      // 有步骤的任务，检查所有步骤是否都被所有用户完成
      return task.steps.every(step => {
        if (task.userIds.length > 1) {
          // 多用户任务，检查所有用户是否都完成了这个步骤
          return task.userIds.every(userId => 
            step.completedByUsers?.includes(userId)
          );
        } else {
          // 单用户任务，检查用户是否完成了这个步骤
          return step.doneByUserId === task.userIds[0] || 
                 (step.completedByUsers && step.completedByUsers.length > 0);
        }
      });
    }
  }
};

type Entities = {
  projects: Project[];
  users: User[];
  tasks: Task[];
  subtasks: Subtask[];
  appointments: Appointment[];
};

// 初始状态
const initialState: Entities = {
  projects: [],
  users: [],
  tasks: [],
  subtasks: [],
  appointments: [],
};

export type StoreState = Entities & {
  // 初始化数据
  initializeData: () => Promise<void>;
  
  // 项目管理
  createProject: (
    data: Pick<Project, "name" | "note" | "userIds" | "repeat">
  ) => Promise<Project>;
  updateProject: (
    id: ID,
    updates: Partial<Pick<Project, "name" | "note" | "userIds" | "repeat">>
  ) => Promise<void>;
  deleteProject: (id: ID) => Promise<void>;

  // 用户管理
  createUser: (data: Pick<User, "nickname" | "phone" | "note" | "level">) => Promise<User>;
  updateUser: (
    id: ID,
    updates: Partial<Pick<User, "nickname" | "phone" | "note" | "level">>
  ) => Promise<void>;
  deleteUser: (id: ID) => Promise<void>;

  // 任务管理
  createTask: (
    data: Pick<Task, "name" | "projectId" | "userIds" | "note" | "type" | "steps" | "subtaskTemplates" | "dueAt">
  ) => Promise<Task>;
  updateTask: (
    id: ID,
    updates: Partial<Pick<Task, "name" | "projectId" | "userIds" | "note" | "type" | "steps" | "subtaskTemplates" | "dueAt" | "completed">>
  ) => Promise<void>;
  deleteTask: (id: ID) => Promise<void>;

  // 任务步骤管理
  setStepDone: (taskId: ID, stepId: ID, userId: ID) => Promise<void>;
  setStepUndone: (taskId: ID, stepId: ID, userId: ID) => Promise<void>;
  setTaskCompletedByUser: (taskId: ID, userId: ID) => Promise<void>;
  
  // 任务完成管理
  forceCompleteTask: (taskId: ID) => Promise<void>;
  forceUncompleteTask: (taskId: ID) => Promise<void>;

  // 预约管理
  createAppointment: (
    data: Pick<Appointment, "title" | "content" | "userIds" | "startTime" | "endTime">
  ) => Promise<Appointment>;
  updateAppointment: (
    id: ID,
    updates: Partial<Pick<Appointment, "title" | "content" | "userIds" | "startTime" | "endTime" | "completed" | "status">>
  ) => Promise<void>;
  deleteAppointment: (id: ID) => Promise<void>;
  markAppointmentCompleted: (id: ID) => Promise<void>;
  updateAppointmentStatus: (id: ID, status: "pending" | "started" | "completed" | "ended") => Promise<void>;

  // 用户备注管理
  setTaskUserNote: (taskId: ID, userId: ID, note: string) => Promise<void>;
  setStepUserNote: (taskId: ID, stepId: ID, userId: ID, note: string) => Promise<void>;
  setSubtaskUserNote: (taskId: ID, subtaskId: ID, userId: ID, note: string) => Promise<void>;

  // 子任务管理
  addSubtask: (taskId: ID, data: Pick<Subtask, "name" | "ownerUserId">) => Promise<void>;
  updateSubtask: (taskId: ID, subtaskId: ID, updates: Partial<Pick<Subtask, "name" | "completed" | "note">>) => Promise<void>;
  deleteSubtask: (taskId: ID, subtaskId: ID) => Promise<void>;
  setSubtaskDone: (taskId: ID, subtaskId: ID, userId: ID) => Promise<void>;
  setSubtaskStepDone: (taskId: ID, subtaskId: ID, stepId: ID, userId: ID) => Promise<void>;
  setSubtaskStepUndone: (taskId: ID, subtaskId: ID, stepId: ID, userId: ID) => Promise<void>;
};

export const useStore = create<StoreState>((set, get) => ({
  ...initialState,

  // 初始化数据
  initializeData: async () => {
    try {
      const [usersRes, projectsRes, tasksRes, subtasksRes, appointmentsRes] = await Promise.all([
        ApiRequest.getUsers(),
        ApiRequest.getProjects(),
        ApiRequest.getTasks(),
        ApiRequest.getSubtasks(),
        ApiRequest.getAppointments(),
      ]);

      set({
        users: usersRes.data || [],
        projects: projectsRes.data || [],
        tasks: tasksRes.data || [],
        subtasks: subtasksRes.data || [],
        appointments: appointmentsRes.data || [],
      });
    } catch (error) {
      console.error('Failed to initialize data:', error);
    }
  },

  // 项目管理
  createProject: async (data) => {
    try {
      const response = await ApiRequest.createProject({
      name: data.name,
      note: data.note,
      userIds: data.userIds,
        repeat: data.repeat,
      });

      if (response.success && response.data) {
        set((state) => ({
          projects: [...state.projects, response.data!],
        }));
        return response.data;
      }
      throw new Error(response.error || 'Failed to create project');
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  },

  updateProject: async (id, updates) => {
    try {
      const response = await ApiRequest.updateProject(id, updates);
      if (response.success && response.data) {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? response.data! : p)),
        }));
      } else {
        throw new Error(response.error || 'Failed to update project');
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  },

  deleteProject: async (id) => {
    try {
      const response = await ApiRequest.deleteProject(id);
      if (response.success) {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        }));
      } else {
        throw new Error(response.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  },

  // 用户管理
  createUser: async (data) => {
    try {
      const response = await ApiRequest.createUser({
      nickname: data.nickname,
      phone: data.phone,
      note: data.note,
        level: data.level,
      });

      if (response.success && response.data) {
        set((state) => ({
          users: [...state.users, response.data!],
        }));
        return response.data;
      }
      throw new Error(response.error || 'Failed to create user');
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  },

  updateUser: async (id, updates) => {
    try {
      const response = await ApiRequest.updateUser(id, updates);
      if (response.success && response.data) {
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? response.data! : u)),
        }));
      } else {
        throw new Error(response.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await ApiRequest.deleteUser(id);
      if (response.success) {
        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
        }));
      } else {
        throw new Error(response.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  },

  // 任务管理
  createTask: async (data) => {
    try {
      const response = await ApiRequest.createTask({
        name: data.name,
        projectId: data.projectId,
        userIds: data.userIds,
        note: data.note,
        type: data.type,
        steps: data.steps,
        subtaskTemplates: data.subtaskTemplates,
        dueAt: data.dueAt,
      });

      if (response.success && response.data) {
        set((state) => ({
          tasks: [...state.tasks, response.data!],
        }));
        return response.data;
      }
      throw new Error(response.error || 'Failed to create task');
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  },

  updateTask: async (id, updates) => {
    try {
      const response = await ApiRequest.updateTask(id, updates);
      if (response.success && response.data) {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? response.data! : t)),
        }));
      } else {
        throw new Error(response.error || 'Failed to update task');
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      const response = await ApiRequest.deleteTask(id);
      if (response.success) {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          // 同时删除关联的子任务
          subtasks: state.subtasks.filter((s) => s.taskId !== id),
        }));
        console.log(`Store: 任务 ${id} 及其关联的子任务已从本地状态中删除`);
      } else {
        throw new Error(response.error || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  },

  // 任务步骤管理
  setStepDone: async (taskId, stepId, userId) => {
    try {
      const response = await ApiRequest.markTaskStepComplete(taskId, stepId, userId);
      if (response.success) {
        // 更新本地状态
        set((state) => {
          const updatedTasks = state.tasks.map((task) => {
            if (task.id !== taskId) return task;
            const updatedSteps = task.steps.map((step) => {
              if (step.id !== stepId) return step;
              const completedByUsers = step.completedByUsers || [];
              if (!completedByUsers.includes(userId)) {
                completedByUsers.push(userId);
              }
              const userCompletedAt = step.userCompletedAt || {};
              userCompletedAt[userId] = new Date().toISOString();
              return {
                ...step,
                completedByUsers,
                userCompletedAt,
                completedAt: new Date().toISOString(),
              };
            });
            return { ...task, steps: updatedSteps };
          });
          
          // 检查是否需要自动完成任务
          const task = updatedTasks.find(t => t.id === taskId);
          if (task && !task.completed) {
            const shouldAutoComplete = checkTaskAutoCompletion(task, state.subtasks);
            if (shouldAutoComplete) {
              // 自动完成任务
              return {
                ...state,
                tasks: updatedTasks.map(t => 
                  t.id === taskId 
                    ? { ...t, completed: true, completedAt: new Date().toISOString() }
                    : t
                )
              };
            }
          }
          
          return { ...state, tasks: updatedTasks };
        });
      } else {
        throw new Error(response.error || 'Failed to mark step as done');
      }
    } catch (error) {
      console.error('Failed to mark step as done:', error);
      throw error;
    }
  },

  setStepUndone: async (taskId, stepId, userId) => {
    try {
      console.log('Store: setStepUndone called', { taskId, stepId, userId });
      const response = await ApiRequest.markTaskStepIncomplete(taskId, stepId, userId);
      console.log('Store: API响应', response);
      if (response.success) {
        console.log('Store: API调用成功，更新本地状态');
        // 更新本地状态
        set((state) => {
          const updatedTasks = state.tasks.map((task) => {
            if (task.id !== taskId) return task;
            const updatedSteps = task.steps.map((step) => {
              if (step.id !== stepId) return step;
              const completedByUsers = step.completedByUsers || [];
              const userCompletedAt = step.userCompletedAt || {};
              
              console.log('Store: 更新前状态', { 
                stepId, 
                userId, 
                completedByUsers, 
                userCompletedAt 
              });
              
              // 移除用户完成状态
              console.log('Store: 过滤前', { completedByUsers, userId });
              const filteredCompletedByUsers = completedByUsers.filter(id => id !== userId);
              console.log('Store: 过滤后', { filteredCompletedByUsers });
              delete userCompletedAt[userId];
              
              console.log('Store: 更新后状态', { 
                filteredCompletedByUsers, 
                userCompletedAt 
              });
              
              return {
                ...step,
                completedByUsers: filteredCompletedByUsers,
                userCompletedAt,
                // 如果没有任何用户完成，清除completedAt
                completedAt: filteredCompletedByUsers.length > 0 ? step.completedAt : undefined,
              };
            });
            return { ...task, steps: updatedSteps };
          });
          
          console.log('Store: 状态更新完成', updatedTasks.find(t => t.id === taskId)?.steps);
          console.log('Store: 最终状态检查', updatedTasks.find(t => t.id === taskId)?.steps.find(s => s.id === stepId));
          return { tasks: updatedTasks };
        });
      } else {
        throw new Error(response.error || 'Failed to mark step as undone');
      }
    } catch (error) {
      console.error('Failed to mark step as undone:', error);
      throw error;
    }
  },

  setTaskCompletedByUser: async (taskId, userId) => {
    try {
      const response = await ApiRequest.markTaskComplete(taskId, userId);
      if (response.success) {
        // 更新本地状态
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== taskId) return task;
            const completedByUsers = task.completedByUsers || [];
            if (!completedByUsers.includes(userId)) {
              completedByUsers.push(userId);
            }
            const userCompletedAt = task.userCompletedAt || {};
            userCompletedAt[userId] = new Date().toISOString();
            
            const isAllUsersCompleted = completedByUsers.length === task.userIds.length;
            return {
              ...task,
              completedByUsers,
              userCompletedAt,
              completed: isAllUsersCompleted,
              completedAt: isAllUsersCompleted ? new Date().toISOString() : task.completedAt,
            };
          }),
        }));
      } else {
        throw new Error(response.error || 'Failed to mark task as completed');
      }
    } catch (error) {
      console.error('Failed to mark task as completed:', error);
      throw error;
    }
  },

  // 强制完成任务
  forceCompleteTask: async (taskId) => {
    try {
      const response = await ApiRequest.updateTask(taskId, { completed: true });
      if (response.success) {
        // 更新本地状态
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== taskId) return task;
            return {
              ...task,
              completed: true,
              completedAt: new Date().toISOString(),
            };
          }),
        }));
      } else {
        throw new Error(response.error || 'Failed to force complete task');
      }
    } catch (error) {
      console.error('Failed to force complete task:', error);
      throw error;
    }
  },

  // 强制取消完成任务
  forceUncompleteTask: async (taskId) => {
    try {
      const response = await ApiRequest.updateTask(taskId, { completed: false });
      if (response.success) {
        // 更新本地状态
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== taskId) return task;
            return {
              ...task,
              completed: false,
              completedAt: undefined,
            };
          }),
        }));
      } else {
        throw new Error(response.error || 'Failed to force uncomplete task');
      }
    } catch (error) {
      console.error('Failed to force uncomplete task:', error);
      throw error;
    }
  },

  // 预约管理
  createAppointment: async (data) => {
    try {
      const response = await ApiRequest.createAppointment({
        title: data.title,
        content: data.content,
        userIds: data.userIds,
        startTime: data.startTime,
        endTime: data.endTime,
      });

      if (response.success && response.data) {
        set((state) => ({
          appointments: [...state.appointments, response.data!],
        }));
        return response.data;
      }
      throw new Error(response.error || 'Failed to create appointment');
    } catch (error) {
      console.error('Failed to create appointment:', error);
      throw error;
    }
  },

  updateAppointment: async (id, updates) => {
    try {
      const response = await ApiRequest.updateAppointment(id, updates);
      if (response.success && response.data) {
        set((state) => ({
          appointments: state.appointments.map((a) => (a.id === id ? response.data! : a)),
        }));
      } else {
        throw new Error(response.error || 'Failed to update appointment');
      }
    } catch (error) {
      console.error('Failed to update appointment:', error);
      throw error;
    }
  },

  deleteAppointment: async (id) => {
    try {
      const response = await ApiRequest.deleteAppointment(id);
      if (response.success) {
        set((state) => ({
          appointments: state.appointments.filter((a) => a.id !== id),
        }));
      } else {
        throw new Error(response.error || 'Failed to delete appointment');
      }
    } catch (error) {
      console.error('Failed to delete appointment:', error);
      throw error;
    }
  },

  markAppointmentCompleted: async (id) => {
    try {
      const response = await ApiRequest.markAppointmentComplete(id);
      if (response.success && response.data) {
        set((state) => ({
          appointments: state.appointments.map((a) => (a.id === id ? response.data! : a)),
        }));
      } else {
        throw new Error(response.error || 'Failed to mark appointment as completed');
      }
    } catch (error) {
      console.error('Failed to mark appointment as completed:', error);
      throw error;
    }
  },

  updateAppointmentStatus: async (id, status) => {
    try {
      const response = await ApiRequest.updateAppointment(id, { status });
      if (response.success && response.data) {
        set((state) => ({
          appointments: state.appointments.map((a) => (a.id === id ? response.data! : a)),
        }));
      } else {
        throw new Error(response.error || 'Failed to update appointment status');
      }
    } catch (error) {
      console.error('Failed to update appointment status:', error);
      throw error;
    }
  },

  // 用户备注管理
  setTaskUserNote: async (taskId, userId, note) => {
    try {
      const response = await ApiRequest.createUserNote({
        entityType: 'task',
        entityId: taskId,
        userId,
        note,
      });
      if (response.success) {
        // 更新本地状态
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== taskId) return task;
            const userNotes = task.userNotes || {};
            userNotes[userId] = note;
            return { ...task, userNotes };
          }),
            }));
          } else {
        throw new Error(response.error || 'Failed to set task user note');
      }
    } catch (error) {
      console.error('Failed to set task user note:', error);
      throw error;
    }
  },

  setStepUserNote: async (taskId, stepId, userId, note) => {
    try {
      const response = await ApiRequest.createUserNote({
        entityType: 'task_step',
        entityId: stepId,
        userId,
        note,
      });
      if (response.success) {
        // 更新本地状态
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== taskId) return task;
            const updatedSteps = task.steps.map((step) => {
              if (step.id !== stepId) return step;
              const userNotes = step.userNotes || {};
              userNotes[userId] = note;
              return { ...step, userNotes };
            });
            return { ...task, steps: updatedSteps };
          }),
              }));
            } else {
        throw new Error(response.error || 'Failed to set step user note');
      }
    } catch (error) {
      console.error('Failed to set step user note:', error);
      throw error;
    }
  },

  setSubtaskUserNote: async (taskId, subtaskId, userId, note) => {
    try {
      const response = await ApiRequest.createUserNote({
        entityType: 'subtask',
        entityId: subtaskId,
        userId,
        note,
      });
      if (response.success) {
        // 更新本地状态
        set((state) => ({
          subtasks: state.subtasks.map((subtask) => {
            if (subtask.id !== subtaskId) return subtask;
            const userNotes = subtask.userNotes || {};
            userNotes[userId] = note;
            return { ...subtask, userNotes };
          }),
        }));
      } else {
        throw new Error(response.error || 'Failed to set subtask user note');
      }
    } catch (error) {
      console.error('Failed to set subtask user note:', error);
      throw error;
    }
  },

  // 子任务管理
  addSubtask: async (taskId, data) => {
    try {
      const response = await ApiRequest.createSubtask(taskId, data);
      if (response.success && response.data) {
        set((state) => ({
          subtasks: [...state.subtasks, response.data!],
        }));
      } else {
        throw new Error(response.error || 'Failed to add subtask');
      }
    } catch (error) {
      console.error('Failed to add subtask:', error);
      throw error;
    }
  },

  updateSubtask: async (taskId, subtaskId, updates) => {
    try {
      const response = await ApiRequest.updateSubtask(taskId, subtaskId, updates);
      if (response.success) {
        // 更新本地状态
        set((state) => ({
          subtasks: state.subtasks.map(subtask => 
            subtask.id === subtaskId 
              ? { ...subtask, ...updates }
              : subtask
          ),
        }));
      } else {
        throw new Error(response.error || 'Failed to update subtask');
      }
    } catch (error) {
      console.error('Failed to update subtask:', error);
      throw error;
    }
  },

  deleteSubtask: async (taskId, subtaskId) => {
    try {
      const response = await ApiRequest.deleteSubtask(taskId, subtaskId);
      if (response.success) {
        // 更新本地状态
        set((state) => ({
          subtasks: state.subtasks.filter(subtask => subtask.id !== subtaskId),
        }));
      } else {
        throw new Error(response.error || 'Failed to delete subtask');
      }
    } catch (error) {
      console.error('Failed to delete subtask:', error);
      throw error;
    }
  },

  setSubtaskDone: async (taskId, subtaskId, userId) => {
    try {
      const response = await ApiRequest.updateSubtask(taskId, subtaskId, {
        completed: true,
      });
      if (response.success) {
        // 更新本地状态
        set((state) => ({
          subtasks: state.subtasks.map(subtask => 
            subtask.id === subtaskId 
              ? { ...subtask, completed: true, completedAt: new Date().toISOString() }
              : subtask
          ),
        }));
      } else {
        throw new Error(response.error || 'Failed to mark subtask as done');
      }
    } catch (error) {
      console.error('Failed to mark subtask as done:', error);
      throw error;
    }
  },

  setSubtaskStepDone: async (taskId, subtaskId, stepId, userId) => {
    try {
      const response = await ApiRequest.markSubtaskStepComplete(taskId, subtaskId, stepId, userId);
      if (response.success) {
        // 更新本地状态
        set((state) => ({
          subtasks: state.subtasks.map(subtask => {
            if (subtask.id === subtaskId) {
              const updatedSteps = subtask.steps.map(step => {
                if (step.id === stepId) {
                  return {
                    ...step,
                    completedByUsers: [...(step.completedByUsers || []), userId],
                    completedAt: new Date().toISOString(),
                  };
                }
                return step;
              });

              // 检查是否所有步骤都完成了
              // 对于多用户场景，检查所有步骤是否都有用户完成
              const allStepsCompleted = updatedSteps.every(step => 
                (step.completedByUsers || []).length > 0
              );

              return {
                ...subtask,
                steps: updatedSteps,
                completed: allStepsCompleted,
                completedAt: allStepsCompleted ? new Date().toISOString() : subtask.completedAt,
              };
            }
            return subtask;
          }),
        }));
      } else {
        throw new Error(response.error || 'Failed to mark subtask step as done');
      }
    } catch (error) {
      console.error('Failed to mark subtask step as done:', error);
      throw error;
    }
  },

  setSubtaskStepUndone: async (taskId, subtaskId, stepId, userId) => {
    try {
      console.log('Store: setSubtaskStepUndone called', { taskId, subtaskId, stepId, userId });
      const response = await ApiRequest.markTaskStepIncomplete(taskId, stepId, userId);
      console.log('Store: API响应', response);
      if (response.success) {
        console.log('Store: API调用成功，更新子任务状态');
        // 更新本地状态
        set((state) => ({
          subtasks: state.subtasks.map(subtask => {
            if (subtask.id === subtaskId) {
              const updatedSteps = subtask.steps.map(step => {
                if (step.id === stepId) {
                  const completedByUsers = step.completedByUsers || [];
                  const userCompletedAt = step.userCompletedAt || {};
                  
                  console.log('Store: 子任务步骤更新前状态', { 
                    stepId, 
                    userId, 
                    completedByUsers, 
                    userCompletedAt 
                  });
                  
                  // 移除用户完成状态
                  const filteredCompletedByUsers = completedByUsers.filter(id => id !== userId);
                  delete userCompletedAt[userId];
                  
                  console.log('Store: 子任务步骤更新后状态', { 
                    filteredCompletedByUsers, 
                    userCompletedAt 
                  });
                  
                  return {
                    ...step,
                    completedByUsers: filteredCompletedByUsers,
                    userCompletedAt,
                    // 如果没有任何用户完成，清除completedAt
                    completedAt: filteredCompletedByUsers.length > 0 ? step.completedAt : undefined,
                  };
                }
                return step;
              });

              // 重新检查子任务完成状态
              // 对于多用户场景，检查所有步骤是否都有用户完成
              const allStepsCompleted = updatedSteps.every(step => 
                (step.completedByUsers || []).length > 0
              );

              return {
                ...subtask,
                steps: updatedSteps,
                completed: allStepsCompleted,
                completedAt: allStepsCompleted ? subtask.completedAt : undefined,
              };
            }
            return subtask;
    }),
}));
      } else {
        throw new Error(response.error || 'Failed to mark subtask step as undone');
      }
    } catch (error) {
      console.error('Failed to mark subtask step as undone:', error);
      throw error;
    }
  },
}));
