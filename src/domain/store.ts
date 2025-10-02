import { create } from "zustand";
import { nanoid } from "../utils/id";
import type {
  Project,
  Task,
  TaskStep,
  User,
  ID,
  Subtask,
  Appointment,
} from "./types";
import { TaskType, ProjectRepeat } from "./enums";

type Entities = {
  projects: Project[];
  users: User[];
  tasks: Task[];
  appointments: Appointment[];
};

const STORAGE_KEY = "task-manage/entities/v1";

function load(): Entities {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { projects: [], users: [], tasks: [], appointments: [] };
    return JSON.parse(raw);
  } catch {
    return { projects: [], users: [], tasks: [], appointments: [] };
  }
}

function save(state: Entities) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export type StoreState = Entities & {
  // Projects
  createProject: (
    data: Pick<Project, "name" | "note" | "userIds" | "repeat">
  ) => Project;
  updateProject: (
    id: ID,
    updates: Partial<Pick<Project, "name" | "note" | "userIds" | "repeat">>
  ) => void;
  deleteProject: (id: ID) => void;

  // Users
  createUser: (data: Pick<User, "nickname" | "phone" | "note">) => User;
  updateUser: (
    id: ID,
    updates: Partial<Pick<User, "nickname" | "phone" | "note">>
  ) => void;
  deleteUser: (id: ID) => void;

  // Tasks
  createTask: (data: Omit<Task, "id" | "completed" | "subtasks">) => Task;
  updateTask: (id: ID, updates: Partial<Task>) => void;
  deleteTask: (id: ID) => void;
  addSubtask: (taskId: ID, subtask: Omit<Subtask, "id" | "completed">) => void;
  updateSubtask: (taskId: ID, subtaskId: ID, updates: Partial<Subtask>) => void;
  deleteSubtask: (taskId: ID, subtaskId: ID) => void;
  setStepDone: (
    taskId: ID,
    subtaskId: ID | null,
    stepId: ID,
    done: boolean,
    userId?: ID
  ) => void;
  setTaskCompletedByUser: (taskId: ID, userId: ID, completed: boolean) => void;

  // Appointments
  createAppointment: (
    data: Omit<Appointment, "id" | "completed" | "status">
  ) => Appointment;
  updateAppointment: (id: ID, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: ID) => void;
  markAppointmentCompleted: (id: ID) => void;
};

export const useStore = create<StoreState>((set, get) => ({
  ...load(),

  createProject: (data) => {
    const project: Project = {
      id: nanoid(),
      name: data.name,
      note: data.note,
      userIds: data.userIds,
      repeat: data.repeat || ProjectRepeat.NONE,
    };
    set((s) => {
      const ns = { ...s, projects: [project, ...s.projects] };
      save(ns);
      return ns;
    });
    return project;
  },
  updateProject: (id, updates) =>
    set((s) => {
      const projects = s.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      );
      const ns = { ...s, projects };
      save(ns);
      return ns;
    }),
  deleteProject: (id) =>
    set((s) => {
      const ns = { ...s, projects: s.projects.filter((p) => p.id !== id) };
      save(ns);
      return ns;
    }),

  createUser: (data) => {
    const user: User = {
      id: nanoid(),
      nickname: data.nickname,
      phone: data.phone,
      note: data.note,
    };
    set((s) => {
      const ns = { ...s, users: [user, ...s.users] };
      save(ns);
      return ns;
    });
    return user;
  },
  updateUser: (id, updates) =>
    set((s) => {
      const users = s.users.map((u) =>
        u.id === id ? { ...u, ...updates } : u
      );
      const ns = { ...s, users };
      save(ns);
      return ns;
    }),
  deleteUser: (id) =>
    set((s) => {
      const ns = { ...s, users: s.users.filter((u) => u.id !== id) };
      save(ns);
      return ns;
    }),

  createTask: (data) => {
    const base: Task = {
      ...data,
      id: nanoid(),
      completed: false,
    };
    const task: Task =
      base.type === TaskType.COMPOSITE
        ? {
            ...base,
            subtasks: generateSubtasks(
              base.userIds,
              base.steps,
              base.subtaskTemplates
            ),
          }
        : base;
    set((s) => {
      const ns = { ...s, tasks: [task, ...s.tasks] };
      save(ns);
      return ns;
    });
    return task;
  },
  updateTask: (id, updates) =>
    set((s) => {
      const tasks = s.tasks.map((t) =>
        t.id === id ? recomputeTask({ ...t, ...updates }) : t
      );
      const ns = { ...s, tasks };
      save(ns);
      return ns;
    }),
  deleteTask: (id) =>
    set((s) => {
      const ns = { ...s, tasks: s.tasks.filter((t) => t.id !== id) };
      save(ns);
      return ns;
    }),
  addSubtask: (taskId, subtask) =>
    set((s) => {
      const tasks = s.tasks.map((t) =>
        t.id === taskId
          ? recomputeTask({
              ...t,
              subtasks: [
                ...(t.subtasks ?? []),
                { ...subtask, id: nanoid(), completed: false },
              ],
            })
          : t
      );
      const ns = { ...s, tasks };
      save(ns);
      return ns;
    }),
  updateSubtask: (taskId, subtaskId, updates) =>
    set((s) => {
      const tasks = s.tasks.map((t) =>
        t.id === taskId
          ? recomputeTask({
              ...t,
              subtasks: (t.subtasks ?? []).map((st) =>
                st.id === subtaskId ? { ...st, ...updates } : st
              ),
            })
          : t
      );
      const ns = { ...s, tasks };
      save(ns);
      return ns;
    }),
  deleteSubtask: (taskId, subtaskId) =>
    set((s) => {
      const tasks = s.tasks.map((t) =>
        t.id === taskId
          ? recomputeTask({
              ...t,
              subtasks: (t.subtasks ?? []).filter((st) => st.id !== subtaskId),
            })
          : t
      );
      const ns = { ...s, tasks };
      save(ns);
      return ns;
    }),
  setStepDone: (taskId, subtaskId, stepId, done, userId) =>
    set((s) => {
      const tasks = s.tasks.map((t) => {
        if (t.id !== taskId) return t;
        if (t.type === "single") {
          const idx = t.steps.findIndex((x) => x.id === stepId);
          if (idx === -1) return t;
          let steps = t.steps.slice();
          if (done && idx === steps.length - 1) {
            steps = steps.map((sp, i) => ({
              ...sp,
              doneByUserId: i <= idx ? "__done__" : sp.doneByUserId,
              completedAt: i <= idx ? (sp.completedAt || new Date().toISOString()) : sp.completedAt,
            }));
          } else {
            steps = steps.map((sp) => {
              if (sp.id !== stepId) return sp;
              
              if (t.userIds.length > 1 && userId) {
                // Multi-user scenario: track completion per user
                const completedByUsers = sp.completedByUsers || [];
                const userCompletedAt = sp.userCompletedAt || {};
                const now = new Date().toISOString();
                
                if (done) {
                  // Add user to completed list if not already there
                  const newCompletedByUsers = completedByUsers.includes(userId) 
                    ? completedByUsers 
                    : [...completedByUsers, userId];
                  return {
                    ...sp,
                    completedByUsers: newCompletedByUsers,
                    userCompletedAt: {
                      ...userCompletedAt,
                      [userId]: userCompletedAt[userId] || now
                    },
                    // Keep doneByUserId for backward compatibility
                    doneByUserId: newCompletedByUsers.length > 0 ? "__done__" : undefined,
                    completedAt: sp.completedAt || now
                  };
                } else {
                  // Remove user from completed list
                  const newCompletedByUsers = completedByUsers.filter(id => id !== userId);
                  const newUserCompletedAt = { ...userCompletedAt };
                  delete newUserCompletedAt[userId];
                  
                  return {
                    ...sp,
                    completedByUsers: newCompletedByUsers,
                    userCompletedAt: newUserCompletedAt,
                    doneByUserId: newCompletedByUsers.length > 0 ? "__done__" : undefined,
                    completedAt: newCompletedByUsers.length > 0 ? sp.completedAt : undefined
                  };
                }
              } else {
                // Single user scenario: use original logic
                return {
                  ...sp,
                  doneByUserId: done ? (userId || "__done__") : undefined,
                  completedAt: done ? (sp.completedAt || new Date().toISOString()) : undefined,
                };
              }
            });
          }
          return recomputeTask({ ...t, steps });
        }
        const subtasks = (t.subtasks ?? []).map((st) => {
          if (subtaskId && st.id === subtaskId) {
            const idx = st.steps.findIndex((x) => x.id === stepId);
            if (idx === -1) return st;
            let steps = st.steps.slice();
            if (done && idx === steps.length - 1) {
              steps = steps.map((sp, i) => ({
                ...sp,
                doneByUserId: i <= idx ? st.ownerUserId : sp.doneByUserId,
                completedAt: i <= idx ? (sp.completedAt || new Date().toISOString()) : sp.completedAt,
              }));
            } else {
              steps = steps.map((sp) =>
                sp.id === stepId
                  ? { 
                      ...sp, 
                      doneByUserId: done ? st.ownerUserId : undefined,
                      completedAt: done ? (sp.completedAt || new Date().toISOString()) : undefined,
                    }
                  : sp
              );
            }
            return { ...st, steps };
          }
          return st;
        });
        return recomputeTask({ ...t, subtasks });
      });
      const ns = { ...s, tasks };
      save(ns);
      return ns;
    }),
  setTaskCompletedByUser: (taskId, userId, completed) =>
    set((s) => {
      const tasks = s.tasks.map((t) => {
        if (t.id !== taskId) return t;
        
        const completedByUsers = t.completedByUsers || [];
        const userCompletedAt = t.userCompletedAt || {};
        const now = new Date().toISOString();
        
        let newCompletedByUsers, newUserCompletedAt;
        
        if (completed) {
          // Add user to completed list if not already there
          newCompletedByUsers = completedByUsers.includes(userId) 
            ? completedByUsers 
            : [...completedByUsers, userId];
          newUserCompletedAt = {
            ...userCompletedAt,
            [userId]: userCompletedAt[userId] || now
          };
        } else {
          // Remove user from completed list
          newCompletedByUsers = completedByUsers.filter(id => id !== userId);
          newUserCompletedAt = { ...userCompletedAt };
          delete newUserCompletedAt[userId];
        }
        
        // Check if all users have completed the task
        const allUsersCompleted = t.userIds.every(uid => newCompletedByUsers.includes(uid));
        
        return {
          ...t,
          completedByUsers: newCompletedByUsers,
          userCompletedAt: newUserCompletedAt,
          completed: allUsersCompleted,
          completedAt: allUsersCompleted && !t.completedAt ? now : t.completedAt
        };
      });
      const ns = { ...s, tasks };
      save(ns);
      return ns;
    }),

  // Appointments
  createAppointment: (data) => {
    const appointment: Appointment = {
      id: nanoid(),
      ...data,
      completed: false,
      status: "pending",
    };
    set((s) => {
      const ns = {
        ...s,
        appointments: [appointment, ...(s.appointments ?? [])],
      };
      save(ns);
      return ns;
    });
    return appointment;
  },
  updateAppointment: (id, updates) =>
    set((s) => {
      const appointments = s.appointments.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      );
      const ns = { ...s, appointments };
      save(ns);
      return ns;
    }),
  deleteAppointment: (id) =>
    set((s) => {
      const ns = {
        ...s,
        appointments: s.appointments.filter((a) => a.id !== id),
      };
      save(ns);
      return ns;
    }),
  markAppointmentCompleted: (id) =>
    set((s) => {
      const appointments = s.appointments.map((a) =>
        a.id === id
          ? { ...a, completed: true, completedAt: new Date().toISOString(), status: "completed" as const }
          : a
      );
      const ns = { ...s, appointments };
      save(ns);
      return ns;
    }),
}));

function generateSubtasks(
  userIds: ID[],
  templateSteps: TaskStep[],
  subtaskTemplates?: string[]
): Subtask[] {
  const names =
    subtaskTemplates && subtaskTemplates.length > 0
      ? subtaskTemplates
      : ["子任务"];
  const list: Subtask[] = [];
  for (const uid of userIds) {
    for (const name of names) {
      list.push({
        id: nanoid(),
        name,
        ownerUserId: uid,
        steps: templateSteps.map((s) => ({
          ...s,
          id: nanoid(),
          doneByUserId: undefined,
        })),
        completed: false,
      });
    }
  }
  return list;
}

function recomputeTask(task: Task): Task {
  if (task.type === TaskType.SINGLE) {
    let allDone = false;
    
    if (task.steps.length > 0) {
      if (task.userIds.length > 1) {
        // Multi-user scenario: all users must complete all steps
        allDone = task.userIds.every(userId => 
          task.steps.every(step => 
            (step.completedByUsers || []).includes(userId)
          )
        );
      } else {
        // Single user scenario: original logic
        allDone = task.steps.every((s) => Boolean(s.doneByUserId));
      }
    } else {
      allDone = task.completed;
    }
    
    const completedAt = allDone && !task.completedAt ? new Date().toISOString() : task.completedAt;
    return { ...task, completed: allDone, completedAt };
  }
  const subtasks = (task.subtasks ?? []).map((st) => {
    const completed =
      st.steps.length > 0
        ? st.steps.every((s) => s.doneByUserId === st.ownerUserId)
        : st.completed;
    const completedAt = completed && !st.completedAt ? new Date().toISOString() : st.completedAt;
    return { ...st, completed, completedAt };
  });
  const completed = subtasks.length > 0 && subtasks.every((st) => st.completed);
  const completedAt = completed && !task.completedAt ? new Date().toISOString() : task.completedAt;
  return { ...task, subtasks, completed, completedAt };
}
