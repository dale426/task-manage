import { Button, Form, Input, Modal, Select, Space, Row, Col, message } from "antd";
import { Grid } from "antd";
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

  // filters
  const [filterForm] = Form.useForm<{
    q?: string;
    projectId?: ID;
    userId?: ID;
    status?: "all" | "done" | "todo";
  }>();

  const rows = useMemo(() => {
    const values = filterForm.getFieldsValue();
    const { q, projectId, userId, status } = values;
    const filtered = tasks.filter((t) => {
      if (q && !t.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (projectId && t.projectId !== projectId) return false;
      if (userId && !t.userIds.includes(userId)) return false;
      if (status === "done" && !t.completed) return false;
      if (status === "todo" && t.completed) return false;
      return true;
    });
    // Sort: incomplete tasks by deadline proximity, completed tasks last
    return filtered.sort((a, b) => {
      // Completed tasks go to the end
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;

      // Within same completion status, sort by deadline
      if (!a.dueAt && !b.dueAt) return 0;
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    });
  }, [tasks, filterForm]);

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
      <div style={{ marginBottom: 12 }}>
        <Form
          form={filterForm}
          layout="vertical"
          onValuesChange={() => {
            // Auto-trigger filtering when form values change
          }}
          initialValues={{ status: "all" }}
        >
          <Row gutter={[8, 8]}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="q" label="搜索" style={{ marginBottom: 8 }}>
                <Input allowClear placeholder="任务名称" />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Form.Item
                name="projectId"
                label="项目"
                style={{ marginBottom: 8 }}
              >
                <Select
                  allowClear
                  options={projects.map((p) => ({
                    value: p.id,
                    label: p.name,
                  }))}
                  placeholder="全部"
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Form.Item name="userId" label="用户" style={{ marginBottom: 8 }}>
                <Select
                  allowClear
                  options={users.map((u) => ({
                    value: u.id,
                    label: u.nickname,
                  }))}
                  placeholder="全部"
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Form.Item name="status" label="状态" style={{ marginBottom: 8 }}>
                <Select
                  options={[
                    { value: "all", label: "全部" },
                    { value: "todo", label: "未完成" },
                    { value: "done", label: "已完成" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6} md={6}>
              <Form.Item label=" " style={{ marginBottom: 8 }}>
                <Space size="small">
                  <Button
                    onClick={() => {
                      filterForm.resetFields();
                    }}
                  >
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
        <Space>
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
        </Space>
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