import { Button, Card, Checkbox, Space, Tag, Row, Col, message } from "antd";
import dayjs from "dayjs";
import { Task, Project } from "../../../domain/types";
import { TaskType, TaskTypeLabels } from "../../../domain/enums";

interface TaskHeaderProps {
  task: Task;
  projects: Project[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onNavigateBack: () => void;
}

export default function TaskHeader({ 
  task, 
  projects, 
  onTaskUpdate, 
  onNavigateBack 
}: TaskHeaderProps) {
  const projectName = task.projectId
    ? projects.find((p) => p.id === task.projectId)?.name ?? "-"
    : "-";

  const handleTaskComplete = async (completed: boolean) => {
    try {
      await onTaskUpdate(task.id, { completed });
      message.success(completed ? '任务已强制完成' : '任务完成状态已取消');
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败，请重试');
    }
  };

  return (
    <div>
      <Row align="middle" justify="space-between" style={{ marginBottom: 12 }}>
        <Col>
          <Space>
            <Button onClick={onNavigateBack}>返回</Button>
            <Tag color={task.type === TaskType.SINGLE ? "blue" : "purple"}>
              {TaskTypeLabels[task.type]}
            </Tag>
            {task.completed && <Tag color="green">已完成</Tag>}
          </Space>
        </Col>
        <Col>
          {task.dueAt && (
            <Tag color="geekblue">
              {dayjs(task.dueAt).format("YYYY-MM-DD HH:mm:ss")}
            </Tag>
          )}
        </Col>
      </Row>
      
      <Card>
        <Space direction="vertical" style={{ width: "100%" }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {task.type === TaskType.SINGLE && task.steps.length === 0 && task.userIds.length === 1 && (
              <Checkbox
                checked={task.completed}
                onChange={() => onTaskUpdate(task.id, { completed: !task.completed })}
              />
            )}
            <span>{task.name}</span>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
              {!task.completed && (
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleTaskComplete(true)}
                  style={{ fontSize: "12px" }}
                >
                  强制完成
                </Button>
              )}
              {task.completed && (
                <Button
                  size="small"
                  onClick={() => handleTaskComplete(false)}
                  style={{ fontSize: "12px" }}
                >
                  取消完成
                </Button>
              )}
            </div>
          </div>
          
          <div style={{ color: "#555" }}>
            项目：<span style={{ fontWeight: "bold" }}>{projectName}</span>
            {task.projectId && (
              <span style={{ marginLeft: 8, color: "#666" }}>
                (
                {(() => {
                  const project = projects.find((p) => p.id === task.projectId);
                  const repeatMap = {
                    none: "不重复",
                    daily: "每日",
                    weekly: "每周",
                    monthly: "每月",
                  };
                  return (
                    repeatMap[project?.repeat as keyof typeof repeatMap] ||
                    "不重复"
                  );
                })()}
                )
              </span>
            )}
          </div>
          
          {task.dueAt && (
            <div style={{ color: "#555" }}>
              截止时间：{dayjs(task.dueAt).format("YYYY-MM-DD HH:mm:ss")}
            </div>
          )}
          
          {task.note && <div style={{ color: "#555" }}>备注：{task.note}</div>}
        </Space>
      </Card>
    </div>
  );
}
