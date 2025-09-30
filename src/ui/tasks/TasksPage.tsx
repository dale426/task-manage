import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Checkbox,
  Row,
  Col,
  message,
} from "antd";
import { Grid, Card } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useStore } from "../../domain/store";
import type { ID, Task, TaskType } from "../../domain/types";
import { useNavigate } from "react-router-dom";

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
  const { tasks, projects, users, createTask, updateTask, deleteTask } =
    useStore();
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
  const screens = Grid.useBreakpoint();

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Form
          form={filterForm}
          layout="vertical"
          onValuesChange={() => {
            // Auto-trigger filtering when form values change
            const values = filterForm.getFieldsValue();
            // Force re-render by updating a dummy state or using the form instance
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
      {/* 表格渲染已移至底部条件分支，避免与移动端卡片重复渲染 */}
      <Modal
        open={open}
        title={editing ? "编辑任务" : "新增任务"}
        width={720}
        onCancel={() => setOpen(false)}
        onOk={() => {
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
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="任务名称"
            rules={[{ required: true, message: "请输入任务名称" }]}
          >
            <Input placeholder="例如：发布v1.0版本" />
          </Form.Item>
          <Form.Item name="projectId" label="关联项目">
            <Select
              allowClear
              placeholder="选择项目"
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
              onChange={(projectId) => {
                if (projectId) {
                  const project = projects.find((p) => p.id === projectId);
                  if (project?.userIds && project.userIds.length > 0) {
                    form.setFieldsValue({ userIds: project.userIds });
                  }
                }
              }}
            />
          </Form.Item>
          <Form.Item
            name="userIds"
            label="关联用户"
            rules={[{ required: true, message: "请选择关联用户" }]}
          >
            <Select
              mode="multiple"
              placeholder="选择用户"
              options={users.map((u) => ({ value: u.id, label: u.nickname }))}
            />
          </Form.Item>
          <Form.Item name="type" label="任务类型" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "single", label: "单例任务" },
                { value: "composite", label: "复合任务" },
              ]}
            />
          </Form.Item>
          {/* Composite subtask templates */}
          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.type !== cur.type}
          >
            {({ getFieldValue }) =>
              getFieldValue("type") === "composite" ? (
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>
                    子任务模板
                  </div>
                  <Form.List name="subtaskTemplates">
                    {(fields, { add, remove }) => (
                      <div>
                        {fields.map((field, idx) => (
                          <div
                            key={field.key}
                            style={{
                              display: "flex",
                              gap: 8,
                              marginBottom: 8,
                              alignItems: "center",
                            }}
                          >
                            <Tag>{idx + 1}</Tag>
                            <Form.Item
                              style={{ flex: 1, marginBottom: 0 }}
                              name={[field.name, "name"]}
                              rules={[
                                { required: true, message: "请输入子任务名称" },
                              ]}
                            >
                              <Input placeholder="例如：开发任务A" />
                            </Form.Item>
                            <Button
                              onClick={() => add({ name: "" }, field.name + 1)}
                            >
                              + 添加
                            </Button>
                            <Button danger onClick={() => remove(field.name)}>
                              删除
                            </Button>
                          </div>
                        ))}
                        {fields.length === 0 && (
                          <Button
                            type="dashed"
                            onClick={() => add({ name: "" })}
                          >
                            + 新增子任务
                          </Button>
                        )}
                      </div>
                    )}
                  </Form.List>
                </div>
              ) : null
            }
          </Form.Item>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>完成步骤</div>
            <Form.List name="steps">
              {(fields, { add, remove }) => (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {fields.map((field, idx) => (
                    <div
                      key={field.key}
                      style={{ display: "flex", gap: 6, alignItems: "center" }}
                    >
                      <Tag>{idx + 1}</Tag>
                      <Form.Item
                        style={{ marginBottom: 0, width: 220 }}
                        name={[field.name, "name"]}
                        rules={[{ required: true, message: "请输入步骤名称" }]}
                      >
                        <Input placeholder="例如：代码合并" />
                      </Form.Item>
                      <Button onClick={() => add({ name: "" }, field.name + 1)}>
                        + 添加
                      </Button>
                      <Button danger onClick={() => remove(field.name)}>
                        删
                      </Button>
                    </div>
                  ))}
                  {fields.length === 0 && (
                    <Button type="dashed" onClick={() => add({ name: "" })}>
                      + 新增步骤
                    </Button>
                  )}
                </div>
              )}
            </Form.List>
          </div>
          <Form.Item name="dueAt" label="任务截止时间">
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Mobile card view (only render one of table or cards) */}
      {!screens.md ? (
        <Space direction="vertical" style={{ width: "100%" }}>
          {rows.map((r) => (
            <Card
              key={r.id}
              size="small"
              title={r.name}
              extra={
                <Space>
                  {r.completed ? (
                    <>
                      <span style={{ color: "#52c41a" }}>已完成</span>
                      <span style={{ color: "#52c41a" }}>✓</span>
                    </>
                  ) : (
                    <>
                      <span style={{ color: "#1890ff" }}>进行中</span>
                      <span style={{ color: "#1890ff" }}>○</span>
                    </>
                  )}
                </Space>
              }
              onClick={() => navigate(`/tasks/${r.id}`)}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                <div style={{ color: "#888" }}>
                  {projects.find((p) => p.id === r.projectId)?.name ?? "-"}
                </div>
                <div>
                  {r.userIds
                    .map(
                      (uid) =>
                        users.find((u) => u.id === uid)?.nickname ?? "未知"
                    )
                    .join("、") || "-"}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: 8,
                    borderTop: "1px solid #f0f0f0",
                  }}
                >
                  <Tag color={r.type === "single" ? "blue" : "purple"}>
                    {r.type === "single" ? "单例" : "复合"}
                  </Tag>
                  <Space>
                    <Button
                      icon={<EditOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(r);
                        form.setFieldsValue({
                          name: r.name,
                          projectId: r.projectId,
                          userIds: r.userIds,
                          type: r.type,
                          steps: r.steps,
                          subtaskTemplates: (r.subtaskTemplates || []).map(
                            (name) => ({ name })
                          ),
                          dueAt: r.dueAt ? dayjs(r.dueAt) : undefined,
                          note: r.note,
                        });
                        setOpen(true);
                      }}
                    />
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        Modal.confirm({
                          title: "确认删除",
                          content: "确定要删除这个任务吗？",
                          onOk: () => {
                            deleteTask(r.id);
                            message.success("任务已删除");
                          },
                        });
                      }}
                    />
                  </Space>
                </div>
              </Space>
            </Card>
          ))}
        </Space>
      ) : (
        <Table
          rowKey="id"
          dataSource={rows}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "任务名称",
              dataIndex: "name",
              render: (v: string, r: Task) => (
                <a onClick={() => navigate(`/tasks/${r.id}`)}>{v}</a>
              ),
            },
            {
              title: "类型",
              dataIndex: "type",
              render: (t: TaskType) =>
                t === "single" ? (
                  <Tag color="blue">单例</Tag>
                ) : (
                  <Tag color="purple">复合</Tag>
                ),
            },
            {
              title: "项目",
              dataIndex: "projectId",
              render: (pid?: ID) =>
                projects.find((p) => p.id === pid)?.name ?? "-",
            },
            {
              title: "关联用户",
              render: (_: any, r: Task) =>
                r.userIds
                  .map(
                    (uid) => users.find((u) => u.id === uid)?.nickname ?? "未知"
                  )
                  .join("、") || "-",
            },
            {
              title: "截止时间",
              dataIndex: "dueAt",
              render: (d?: string) =>
                d ? dayjs(d).format("YYYY-MM-DD HH:mm:ss") : "-",
            },
            {
              title: "状态",
              dataIndex: "completed",
              render: (v: boolean) => (
                <Space>
                  {v ? (
                    <>
                      <span style={{ color: "#52c41a" }}>已完成</span>
                      <span style={{ color: "#52c41a" }}>✓</span>
                    </>
                  ) : (
                    <>
                      <span style={{ color: "#1890ff" }}>进行中</span>
                      <span style={{ color: "#1890ff" }}>○</span>
                    </>
                  )}
                </Space>
              ),
            },
            {
              title: "操作",
              render: (_: any, record: Task) => (
                <Space>
                  <Button
                    onClick={() => {
                      setEditing(record);
                      form.setFieldsValue({
                        name: record.name,
                        projectId: record.projectId,
                        userIds: record.userIds,
                        note: record.note,
                        type: record.type,
                        steps: record.steps.map((s) => ({
                          id: s.id,
                          name: s.name,
                        })),
                        dueAt: record.dueAt ? dayjs(record.dueAt) : undefined,
                      });
                      setOpen(true);
                    }}
                  >
                    编辑
                  </Button>
                  <Button danger onClick={() => deleteTask(record.id)}>
                    删除
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
