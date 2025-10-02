import { Button, Form, Modal, message } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useStore } from "../../domain/store";
import type { ID, Task, TaskType } from "../../domain/types";
import { useNavigate } from "react-router-dom";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";

type TaskFormValues = {
  name: string;
  projectId?: ID;
  userIds: ID[];
  note?: string;
  type: TaskType;
  steps: { name: string; id?: string }[];
  dueAt?: dayjs.Dayjs;
  subtaskTemplates?: { name: string }[];
};

export default function TasksPage() {
  const { tasks, projects, users, createTask, updateTask, deleteTask } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form] = Form.useForm<TaskFormValues>();
  const navigate = useNavigate();

  const rows = useMemo(() => {
    // Sort: incomplete tasks by deadline proximity, completed tasks last
    return [...tasks].sort((a, b) => {
      // Completed tasks go to the end
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;

      // Within same completion status, sort by deadline
      if (!a.dueAt && !b.dueAt) return 0;
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    });
  }, [tasks]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const payload = {
        name: values.name,
        projectId: values.projectId,
        userIds: values.userIds,
        note: values.note,
        type: values.type,
        steps: (values.steps || []).map((s) => ({
          id: s.id || crypto.randomUUID(),
          name: s.name,
        })),
        dueAt: values.dueAt?.toISOString(),
        subtaskTemplates:
          values.type === "composite"
            ? (values.subtaskTemplates || [])
                .map((x) => x?.name?.trim())
                .filter(Boolean)
            : undefined,
      } as Omit<Task, "id" | "completed" | "subtasks">;
      if (editing) updateTask(editing.id, payload);
      else createTask(payload);
      setOpen(false);
    });
  };

  const handleEdit = (task: Task) => {
    setEditing(task);
    form.setFieldsValue({
      name: task.name,
      projectId: task.projectId,
      userIds: task.userIds,
      note: task.note,
      type: task.type,
      steps: task.steps.map((s) => ({
        id: s.id,
        name: s.name,
      })),
      dueAt: task.dueAt ? dayjs(task.dueAt) : undefined,
      subtaskTemplates: (task.subtaskTemplates || []).map((name) => ({ name })),
    });
    setOpen(true);
  };

  const handleDelete = (taskId: ID) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这个任务吗？",
      onOk: () => {
        deleteTask(taskId);
        message.success("任务已删除");
      },
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          onClick={() => {
            setEditing(null);
            form.resetFields();
            form.setFieldsValue({ type: "single", userIds: [], steps: [] });
            setOpen(true);
          }}
        >
          新增任务
        </Button>
      </div>

      <TaskList
        tasks={rows}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onNavigate={navigate}
      />

      <Modal
        open={open}
        title={editing ? "编辑任务" : "新增任务"}
        width={720}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
      >
        <TaskForm
          form={form}
          editing={editing}
          onCancel={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>
    </div>
  );
}