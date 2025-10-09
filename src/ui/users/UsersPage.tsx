import { Button, Form, Input, Modal, Space, Table, Grid, Card, Select, Tag } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import { useStore } from "../../domain/store";
import type { User } from "../../domain/types";
import { UserLevel, UserLevelLabels } from "../../domain/enums";

export default function UsersPage() {
  const { users, createUser, updateUser, deleteUser } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form] = Form.useForm<{
    nickname: string;
    phone?: string;
    note?: string;
    level: UserLevel;
  }>();

  const rows = useMemo(() => users, [users]);
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
          新增用户
        </Button>
      </Space>

      {screens.lg ? (
        <Table
          rowKey="id"
          dataSource={rows}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: "昵称", dataIndex: "nickname" },
            { title: "手机号", dataIndex: "phone" },
            { 
              title: "级别", 
              dataIndex: "level",
              render: (level: UserLevel) => (
                <Tag color={level === UserLevel.LEVEL_1 ? "red" : level === UserLevel.LEVEL_2 ? "orange" : "blue"}>
                  {UserLevelLabels[level || UserLevel.LEVEL_3]}
                </Tag>
              )
            },
            { title: "备注", dataIndex: "note" },
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
                        nickname: record.nickname,
                        phone: record.phone,
                        note: record.note,
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
                    onClick={() => deleteUser(record.id)}
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
          {rows.map((user) => (
            <Card
              key={user.id}
              size="small"
              title={user.nickname}
              extra={
                <Space>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setEditing(user);
                      form.setFieldsValue({
                        nickname: user.nickname,
                        phone: user.phone,
                        note: user.note,
                        level: user.level || UserLevel.LEVEL_3,
                      });
                      setOpen(true);
                    }}
                  />
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deleteUser(user.id)}
                  />
                </Space>
              }
            >
              <div style={{ marginBottom: 8 }}>
                <strong>手机号：</strong>
                <span>{user.phone || "-"}</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>级别：</strong>
                <Tag color={user.level === UserLevel.LEVEL_1 ? "red" : user.level === UserLevel.LEVEL_2 ? "orange" : "blue"}>
                  {UserLevelLabels[user.level || UserLevel.LEVEL_3]}
                </Tag>
              </div>
              <div>
                <strong>备注：</strong>
                <span>{user.note || "-"}</span>
              </div>
            </Card>
          ))}
        </Space>
      )}
      <Modal
        open={open}
        title={editing ? "编辑用户" : "新增用户"}
        onCancel={() => setOpen(false)}
        onOk={() => {
          form.validateFields().then((values) => {
            if (editing) updateUser(editing.id, values);
            else createUser(values);
            setOpen(false);
          });
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="nickname"
            label="昵称"
            rules={[{ required: true, message: "请输入昵称" }]}
          >
            <Input placeholder="例如：张三" />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="例如：13800000000" />
          </Form.Item>
          <Form.Item 
            name="level" 
            label="级别"
            initialValue={UserLevel.LEVEL_3}
            rules={[{ required: true, message: "请选择用户级别" }]}
          >
            <Select
              options={[
                { value: UserLevel.LEVEL_1, label: UserLevelLabels[UserLevel.LEVEL_1] },
                { value: UserLevel.LEVEL_2, label: UserLevelLabels[UserLevel.LEVEL_2] },
                { value: UserLevel.LEVEL_3, label: UserLevelLabels[UserLevel.LEVEL_3] }
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
