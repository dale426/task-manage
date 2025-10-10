import { TaskType, ProjectRepeat, UserLevel } from './enums';

export type ID = string;

export type User = {
  id: ID;
  nickname: string;
  phone?: string;
  note?: string;
  level?: UserLevel; // 用户级别，默认为三级
};

export type Project = {
  id: ID;
  name: string;
  note?: string;
  userIds?: ID[]; // associated users
  repeat?: ProjectRepeat; // repeat frequency
};

export type Appointment = {
  id: ID;
  title: string;
  content: string;
  userIds: ID[]; // reminder users
  startTime: string; // ISO string
  endTime: string; // ISO string
  completed: boolean;
  completedAt?: string; // ISO string when appointment was completed
  status: "pending" | "started" | "completed" | "ended"; // appointment status
};

export { TaskType };

export type TaskStep = {
  id: ID;
  name: string;
  doneByUserId?: ID; // reserved for per-user completion in subtasks
  completedByUsers?: ID[]; // array of user IDs who completed this step
  completedAt?: string; // ISO string when step was completed
  userCompletedAt?: { [userId: ID]: string }; // completion time for each user
  userNotes?: { [userId: ID]: string }; // user-specific notes for steps
};

export type Subtask = {
  id: ID;
  taskId: ID; // 关联的任务ID
  name: string;
  ownerUserId: ID; // the user this subtask belongs to
  steps: TaskStep[];
  completed: boolean;
  completedAt?: string; // ISO string when subtask was completed
  note?: string; // subtask notes
  userNotes?: { [userId: ID]: string }; // user-specific notes for subtasks
};

export type Task = {
  id: ID;
  name: string;
  projectId?: ID;
  userIds: ID[]; // associated users
  note?: string;
  type: TaskType;
  steps: TaskStep[]; // for single task, directly usable; for composite, used as template for subtasks
  subtaskTemplates?: string[]; // for composite: template names used to generate per-user subtasks
  dueAt?: string; // ISO string
  completed: boolean;
  completedAt?: string; // ISO string when task was completed
  completedByUsers?: ID[]; // array of user IDs who completed this task (for multi-user tasks without steps)
  userCompletedAt?: { [userId: ID]: string }; // completion time for each user (for multi-user tasks without steps)
  userNotes?: { [userId: ID]: string }; // user-specific notes for multi-user tasks
};

export type UserNote = {
  id: ID;
  entityType: 'task' | 'task_step' | 'subtask';
  entityId: ID;
  userId: ID;
  note: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
};
