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
    done: boolean
  ) => void;

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
      repeat: data.repeat || "none",
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
      base.type === "composite"
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
  setStepDone: (taskId, subtaskId, stepId, done) =>
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
            }));
          } else {
            steps = steps.map((sp) =>
              sp.id === stepId
                ? { ...sp, doneByUserId: done ? "__done__" : undefined }
                : sp
            );
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
              }));
            } else {
              steps = steps.map((sp) =>
                sp.id === stepId
                  ? { ...sp, doneByUserId: done ? st.ownerUserId : undefined }
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
          ? { ...a, completed: true, status: "completed" as const }
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
  if (task.type === "single") {
    const allDone =
      task.steps.length > 0
        ? task.steps.every((s) => Boolean(s.doneByUserId))
        : task.completed;
    return { ...task, completed: allDone };
  }
  const subtasks = (task.subtasks ?? []).map((st) => ({
    ...st,
    completed:
      st.steps.length > 0
        ? st.steps.every((s) => s.doneByUserId === st.ownerUserId)
        : st.completed,
  }));
  const completed = subtasks.length > 0 && subtasks.every((st) => st.completed);
  return { ...task, subtasks, completed };
}
