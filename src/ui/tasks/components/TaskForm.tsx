import { Button, Form, Input, Select, DatePicker, Tag } from "antd";
import { useMemo } from "react";
import { useStore } from "../../../domain/store";
import type { ID, Task, TaskType } from "../../../domain/types";
import dayjs from "dayjs";

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

interface TaskFormProps {
  form: any;
  editing: Task | null;
  onCancel: () => void;
  onSubmit: (values: TaskFormValues) => void;
}

export default function TaskForm({ form, editing, onCancel, onSubmit }: TaskFormProps) {
  const { projects, users } = useStore();

  return (
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
  );
}
