import { Button, Form, Input, Tag } from "antd";
import MobileSelect from "../../components/MobileSelect";
import { useMemo } from "react";
import { useStore } from "../../../domain/store";
import type { ID, Task } from "../../../domain/types";
import { TaskType, TaskTypeLabels, UserLevel, UserLevelOrder, UserLevelLabels } from "../../../domain/enums";
import dayjs from "dayjs";
import MobileDateTimePicker from "../../components/MobileDateTimePicker";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

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
        <Input 
          placeholder="例如：发布v1.0版本" 
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </Form.Item>
      <Form.Item name="projectId" label="关联项目">
        <MobileSelect
          allowClear
          placeholder="选择项目"
          options={projects.map((p) => ({ value: p.id, label: p.name }))}
          onChange={(projectId: ID) => {
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
        <MobileSelect
          mode="multiple"
          placeholder="选择用户"
          options={users
            .sort((a, b) => {
              const levelA = UserLevelOrder[a.level || UserLevel.LEVEL_3];
              const levelB = UserLevelOrder[b.level || UserLevel.LEVEL_3];
              return levelA - levelB;
            })
            .map((u) => {
              const level = u.level || UserLevel.LEVEL_3;
              const levelColor = level === UserLevel.LEVEL_1 ? "red" : level === UserLevel.LEVEL_2 ? "orange" : "blue";
              return { 
                value: u.id, 
                label: u.nickname,
                tag: {
                  text: UserLevelLabels[level],
                  color: levelColor
                }
              };
            })}
        />
      </Form.Item>
      <Form.Item name="type" label="任务类型" rules={[{ required: true }]}>
        <MobileSelect
          options={[
            { value: TaskType.SINGLE, label: TaskTypeLabels[TaskType.SINGLE] + "任务" },
            { value: TaskType.COMPOSITE, label: TaskTypeLabels[TaskType.COMPOSITE] + "任务" },
          ]}
        />
      </Form.Item>
      {/* Composite subtask templates */}
      <Form.Item
        noStyle
        shouldUpdate={(prev, cur) => prev.type !== cur.type}
      >
        {({ getFieldValue }) =>
          getFieldValue("type") === TaskType.COMPOSITE ? (
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
                          <Input 
                            placeholder="例如：开发任务A" 
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                          />
                        </Form.Item>
                        <PlusOutlined style={{padding: "0 6px", color: "green"}} onClick={() => add({ name: "" }, field.name + 1)}/>
                        <DeleteOutlined style={{padding: "0 6px", color: "red"}} onClick={() => remove(field.name)}/>
                      </div>
                    ))}
                    {fields.length === 0 && (
                      <Button
                        style={{width: "100%"}}
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
                    rules={[{ required: true, message: "请输入步骤名称" }]}
                  >
                    <Input 
                      placeholder="例如：代码合并" 
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                  </Form.Item>
                  <PlusOutlined style={{padding: "0 6px", color: "green", cursor: "pointer"}} onClick={() => add({ name: "" }, field.name + 1)}/>
                  <DeleteOutlined style={{padding: "0 6px", color: "red", cursor: "pointer"}} onClick={() => remove(field.name)}/>
                </div>
              ))}
              {fields.length === 0 && (
                <Button
                  style={{width: "100%"}}
                  type="dashed"
                  onClick={() => add({ name: "" })}
                >
                  + 新增步骤
                </Button>
              )}
            </div>
          )}
        </Form.List>
      </div>
      <Form.Item name="dueAt" label="任务截止时间">
        <MobileDateTimePicker style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name="note" label="备注">
        <Input.TextArea 
          rows={3} 
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </Form.Item>
    </Form>
  );
}
