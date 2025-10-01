import { Button, Card, Space, Table, Tag, Grid } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useMemo } from "react";
import { useStore } from "../../../domain/store";
import type { ID, Task } from "../../../domain/types";

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: ID) => void;
  onNavigate: (path: string) => void;
}

export default function TaskList({ tasks, onEdit, onDelete, onNavigate }: TaskListProps) {
  const { projects, users } = useStore();
  const screens = Grid.useBreakpoint();

  const columns = [
    {
      title: "任务名称",
      dataIndex: "name",
      render: (v: string, r: Task) => (
        <a onClick={() => onNavigate(`/tasks/${r.id}`)}>{v}</a>
      ),
    },
    {
      title: "类型",
      dataIndex: "type",
      render: (t: string) =>
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
      title: "子任务",
      render: (_: any, r: Task) => {
        if (r.type === "composite" && r.subtasks && r.subtasks.length > 0) {
          const completedCount = r.subtasks.filter(s => s.completed).length;
          return `${completedCount}/${r.subtasks.length}`;
        }
        return "-";
      },
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
            onClick={() => onEdit(record)}
          >
            编辑
          </Button>
          <Button danger onClick={() => onDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  if (!screens.md) {
    // 移动端卡片视图
    return (
      <Space direction="vertical" style={{ width: "100%" }}>
        {tasks.map((r) => (
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
            onClick={() => onNavigate(`/tasks/${r.id}`)}
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
              {r.type === "composite" && r.subtasks && r.subtasks.length > 0 && (
                <div style={{ color: "#666", fontSize: "12px" }}>
                  子任务: {r.subtasks.filter(s => s.completed).length}/{r.subtasks.length}
                </div>
              )}
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
                      onEdit(r);
                    }}
                  />
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(r.id);
                    }}
                  />
                </Space>
              </div>
            </Space>
          </Card>
        ))}
      </Space>
    );
  }

  // 桌面端表格视图
  return (
    <Table
      rowKey="id"
      dataSource={tasks}
      pagination={{ pageSize: 10 }}
      columns={columns}
    />
  );
}
