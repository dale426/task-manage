import {
  Button,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Select,
  Grid,
  Card,
  Tag,
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import { useStore } from "../../domain/store";
import type { Project, ID } from "../../domain/types";
import { ProjectRepeat, ProjectRepeatLabels } from "../../domain/enums";

export default function ProjectsPage() {
  const { projects, users, createProject, updateProject, deleteProject } =
    useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form] = Form.useForm<{
    name: string;
    note?: string;
    userIds?: ID[];
    repeat?: ProjectRepeat;
  }>();

  const rows = useMemo(() => projects, [projects]);
  const screens = Grid.useBreakpoint();

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button
          type="primary"
          onClick={() => {
            setEditing(null);
            form.resetFields();
            setOpen(true);
          }}
        >
          新增项目
        </Button>
      </Space>

      {screens.lg ? (
        <Table
          rowKey="id"
          dataSource={rows}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: "项目名称", dataIndex: "name" },
            { title: "备注", dataIndex: "note" },
            {
              title: "关联用户",
              dataIndex: "userIds",
              render: (userIds: ID[]) => {
                const userNames =
                  userIds
                    ?.map((id) => users.find((u) => u.id === id)?.nickname)
                    .filter(Boolean)
                    .join(", ") || "-";
                return userNames;
              },
            },
            {
              title: "重复频率",
              dataIndex: "repeat",
              render: (repeat: ProjectRepeat) => {
                return ProjectRepeatLabels[repeat] || ProjectRepeatLabels[ProjectRepeat.NONE];
              },
            },
            {
              title: "操作",
              render: (_, record) => (
                <Space>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setEditing(record);
                      form.setFieldsValue({
                        name: record.name,
                        note: record.note,
                        userIds: record.userIds || [],
                        repeat: record.repeat || ProjectRepeat.NONE,
                      });
                      setOpen(true);
                    }}
                  >
                    编辑
                  </Button>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deleteProject(record.id)}
                  >
                    删除
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      ) : (
        <Space direction="vertical" style={{ width: "100%" }}>
          {rows.map((project) => {
            const userNames =
              project.userIds
                ?.map((id) => users.find((u) => u.id === id)?.nickname)
                .filter(Boolean)
                .join(", ") || "-";


            return (
              <Card
                key={project.id}
                size="small"
                title={project.name}
                extra={
                  <Space>
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setEditing(project);
                        form.setFieldsValue({
                          name: project.name,
                          note: project.note,
                          userIds: project.userIds || [],
                          repeat: project.repeat || ProjectRepeat.NONE,
                        });
                        setOpen(true);
                      }}
                    />
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => deleteProject(project.id)}
                    />
                  </Space>
                }
              >
                <div style={{ marginBottom: 8 }}>
                  <strong>备注：</strong>
                  <span>{project.note || "-"}</span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>关联用户：</strong>
                  <span>{userNames}</span>
                </div>
                <div>
                  <strong>重复频率：</strong>
                  <Tag color="blue">
                    {ProjectRepeatLabels[project.repeat || ProjectRepeat.NONE]}
                  </Tag>
                </div>
              </Card>
            );
          })}
        </Space>
      )}
      <Modal
        open={open}
        title={editing ? "编辑项目" : "新增项目"}
        onCancel={() => setOpen(false)}
        onOk={() => {
          form.validateFields().then((values) => {
            if (editing) updateProject(editing.id, values);
            else createProject(values);
            setOpen(false);
          });
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: "请输入项目名称" }]}
          >
            <Input placeholder="例如：官网改版" />
          </Form.Item>
          <Form.Item name="userIds" label="关联用户">
            <Select
              mode="multiple"
              placeholder="选择用户"
              options={users.map((u) => ({ value: u.id, label: u.nickname }))}
            />
          </Form.Item>
          <Form.Item name="repeat" label="重复频率" initialValue={ProjectRepeat.NONE}>
            <Select
              options={[
                { value: ProjectRepeat.NONE, label: ProjectRepeatLabels[ProjectRepeat.NONE] },
                { value: ProjectRepeat.DAILY, label: ProjectRepeatLabels[ProjectRepeat.DAILY] },
                { value: ProjectRepeat.WEEKLY, label: ProjectRepeatLabels[ProjectRepeat.WEEKLY] },
                { value: ProjectRepeat.MONTHLY, label: ProjectRepeatLabels[ProjectRepeat.MONTHLY] },
              ]}
            />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
