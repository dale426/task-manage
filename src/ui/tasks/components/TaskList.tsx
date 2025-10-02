import { Button, Card, Space, Table, Tag, Grid } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useMemo } from "react";
import { useStore } from "../../../domain/store";
import type { ID, Task } from "../../../domain/types";
import { TaskType, TaskTypeLabels, ProjectRepeatLabels } from "../../../domain/enums";
import completeImg from "../../../assets/complete.png";
import processingImg from "../../../assets/processing.png";

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
      render: (v: string, r: Task) => {
        const projectName = projects.find((p) => p.id === r.projectId)?.name;
        return (
          <a onClick={() => onNavigate(`/tasks/${r.id}`)}>
            {projectName && (
              <span style={{ color: "#1890ff", marginRight: "4px" }}>
                {projectName} -
              </span>
            )}
            <span>{v}</span>
          </a>
        );
      },
    },
    {
      title: "类型",
      dataIndex: "type",
      render: (t: TaskType) => (
        <Tag color={t === TaskType.SINGLE ? "blue" : "purple"}>
          {TaskTypeLabels[t]}
        </Tag>
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
        if (r.type === TaskType.COMPOSITE && r.subtasks && r.subtasks.length > 0) {
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
        {tasks.map((r) => {
          const project = projects.find((p) => p.id === r.projectId);
          const projectName = project?.name;
          const userNames = r.userIds
            .map((uid) => users.find((u) => u.id === uid)?.nickname ?? "未知")
            .join("、");

          // 计算任务进度
          let completedCount = 0;
          let totalCount = 0;

          if (r.type === TaskType.COMPOSITE && r.subtasks) {
            // 复合任务：统计所有用户的所有子任务
            r.subtasks.forEach(subtask => {
              if (subtask.steps.length > 0) {
                // 有步骤的子任务，统计步骤完成情况
                subtask.steps.forEach(step => {
                  totalCount++;
                  if (step.doneByUserId === subtask.ownerUserId) {
                    completedCount++;
                  }
                });
              } else {
                // 无步骤的子任务，直接统计子任务完成情况
                totalCount++;
                if (subtask.completed) {
                  completedCount++;
                }
              }
            });
          } else {
            // 单例任务：统计步骤或用户完成情况
            if (r.steps.length > 0) {
              // 有步骤的单例任务
              if (r.userIds.length > 1) {
                // 多用户任务，每个用户都要完成所有步骤
                r.userIds.forEach(userId => {
                  r.steps.forEach(step => {
                    totalCount++;
                    if (step.completedByUsers?.includes(userId)) {
                      completedCount++;
                    }
                  });
                });
              } else {
                // 单用户任务
                r.steps.forEach(step => {
                  totalCount++;
                  if (step.doneByUserId) {
                    completedCount++;
                  }
                });
              }
            } else {
              // 无步骤的单例任务
              if (r.userIds.length > 1) {
                // 多用户任务，统计用户完成情况
                totalCount = r.userIds.length;
                completedCount = r.completedByUsers?.length || 0;
              } else {
                // 单用户任务
                totalCount = 1;
                completedCount = r.completed ? 1 : 0;
              }
            }
          }

          return (
            <Card
              key={r.id}
              size="small"
                title={
                  <div style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    lineHeight: "20px"
                  }}>
                    <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "baseline", gap: "4px" }}>
                      <span>
                        {projectName && (
                          <span style={{ color: "#1890ff" }}>
                            {projectName}
                          </span>
                        )}
                        <span> - </span>
                        <span>{r.name}</span>
                      </span>
                      <div style={{ 
                        display: "flex",
                        gap: "2px",
                        alignItems: "flex-start",
                        transform: "translateY(-6px)"
                      }}>
                        <Tag
                          color={r.type === TaskType.SINGLE ? "blue" : "purple"}
                          style={{ 
                            fontSize: "8px", 
                            padding: "0 2px", 
                            height: "10px", 
                            lineHeight: "8px",
                            margin: 0,
                            minWidth: "auto",
                          }}
                        >
                          {TaskTypeLabels[r.type]}
                        </Tag>
                        {project?.repeat && (
                          <Tag
                            color="orange"
                            style={{ 
                              fontSize: "8px", 
                              padding: "0 2px", 
                              height: "10px", 
                              lineHeight: "8px",
                              margin: 0,
                              minWidth: "auto",
                            }}
                          >
                            {ProjectRepeatLabels[project.repeat]}
                          </Tag>
                        )}
                      </div>
                    </div>
                  </div>
                }
              onClick={() => onNavigate(`/tasks/${r.id}`)}
              style={{
                cursor: "pointer",
                position: "relative",
                ...(r.completed
                  ? {
                    '--complete-img-url': `url(${completeImg})`
                  } as React.CSSProperties
                  : {
                    '--processing-img-url': `url(${processingImg})`
                  } as React.CSSProperties)
              }}
              className={r.completed ? "completed-task-card" : "processing-task-card"}
            >
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <div style={{ flex: 1, fontSize: "12px", lineHeight: "18px", marginRight: "60px" }}>
                  <div style={{ color: "#333", marginBottom: "4px" }}>
                    <span style={{ color: "#666" }}>任务进度: </span>
                    <span style={{ color: "#52c41a", fontWeight: "500" }}>{completedCount}</span>
                    <span style={{ color: "#666" }}> / {totalCount}</span>
                  </div>
                  <div style={{ color: "#333", marginBottom: "4px" }}>
                    <span style={{ color: "#666" }}>用户名: </span>
                    <span>{userNames}</span>
                  </div>
                  {r.note && (
                    <div style={{ color: "#333" }}>
                      <span style={{ color: "#666" }}>备注: </span>
                      <span>{r.note}</span>
                    </div>
                  )}
                </div>
                <div style={{
                  position: "absolute",
                  bottom: "12px",
                  right: "12px",
                  display: "flex",
                  gap: "4px"
                }}>
                  <Button
                    size="small"
                    type="text"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(r);
                    }}
                  />
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(r.id);
                    }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
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
