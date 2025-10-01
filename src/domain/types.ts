export type ID = string;

export type User = {
  id: ID;
  nickname: string;
  phone?: string;
  note?: string;
};

export type Project = {
  id: ID;
  name: string;
  note?: string;
  userIds?: ID[]; // associated users
  repeat?: "none" | "daily" | "weekly" | "monthly"; // repeat frequency
};

export type Appointment = {
  id: ID;
  title: string;
  content: string;
  userIds: ID[]; // reminder users
  startTime: string; // ISO string
  completed: boolean;
  completedAt?: string; // ISO string when appointment was completed
  status: "pending" | "started" | "completed"; // appointment status
};

export type TaskType = "single" | "composite";

export type TaskStep = {
  id: ID;
  name: string;
  doneByUserId?: ID; // reserved for per-user completion in subtasks
  completedByUsers?: ID[]; // array of user IDs who completed this step
  completedAt?: string; // ISO string when step was completed
  userCompletedAt?: { [userId: ID]: string }; // completion time for each user
};

export type Subtask = {
  id: ID;
  name: string;
  ownerUserId: ID; // the user this subtask belongs to
  steps: TaskStep[];
  completed: boolean;
  completedAt?: string; // ISO string when subtask was completed
  note?: string; // subtask notes
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
  subtasks?: Subtask[]; // present when type is composite
  dueAt?: string; // ISO string
  completed: boolean;
  completedAt?: string; // ISO string when task was completed
  completedByUsers?: ID[]; // array of user IDs who completed this task (for multi-user tasks without steps)
  userCompletedAt?: { [userId: ID]: string }; // completion time for each user (for multi-user tasks without steps)
};
