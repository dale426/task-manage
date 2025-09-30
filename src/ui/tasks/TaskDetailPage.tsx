import {
  Button,
  Card,
  Checkbox,
  Empty,
  Space,
  Tabs,
  Tag,
  Row,
  Col,
  Input,
} from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../../domain/store";
import type { ID, Task, Subtask } from "../../domain/types";
import { nanoid } from "../../utils/id";

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { tasks, users, projects, setStepDone, updateTask } = useStore();
  const task = useMemo(
    () => tasks.find((t) => t.id === taskId),
    [tasks, taskId]
  );
  const [activeUserId, setActiveUserId] = useState<ID | undefined>(
    task?.userIds?.[0]
  );

  if (!task) return <Empty description="任务不存在" />;

  const projectName = task.projectId
    ? projects.find((p) => p.id === task.projectId)?.name ?? "-"
    : "-";

  const totalSubtasks = (task.subtasks ?? []).length;
  const doneSubtasks = (task.subtasks ?? []).filter((s) => s.completed).length;
  const [editingSubtaskId, setEditingSubtaskId] = useState<ID | null>(null);
  const [editingName, setEditingName] = useState<string>("");

  return (
    <div>
      <Row align="middle" justify="space-between" style={{ marginBottom: 12 }}>
        <Col>
          <Space>
            <Button onClick={() => navigate(-1)}>返回</Button>
            <Tag color={task.type === "single" ? "blue" : "purple"}>
              {task.type === "single" ? "单例" : "复合"}
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
            {task.type === "single" && task.steps.length === 0 && (
              <Checkbox
                checked={task.completed}
                onChange={() =>
                  updateTask(task.id, { completed: !task.completed })
                }
              />
            )}
            <span>{task.name}</span>
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
          <div style={{ color: "#555" }}>
            用户数：{task.userIds.length}，子任务：{doneSubtasks}/
            {totalSubtasks}
          </div>
          {task.dueAt && (
            <div style={{ color: "#555" }}>
              截止时间：{dayjs(task.dueAt).format("YYYY-MM-DD HH:mm:ss")}
            </div>
          )}
          {task.note && <div style={{ color: "#555" }}>备注：{task.note}</div>}
        </Space>
      </Card>

      <div style={{ marginTop: 12 }}>
        {task.type === "single" ? (
          <Card title="完成步骤">
            {task.steps.length === 0 ? (
              <Button
                type="primary"
                onClick={() =>
                  updateTask(task.id, { completed: !task.completed })
                }
              >
                {task.completed ? "取消完成" : "标记完成"}
              </Button>
            ) : (
              <div>
                {task.userIds.length > 1 && (
                  <Tabs
                    tabPosition="top"
                    activeKey={activeUserId}
                    onChange={(k) => setActiveUserId(k)}
                    items={task.userIds.map((uid) => {
                      const uname =
                        users.find((u) => u.id === uid)?.nickname ?? "未知";
                      const userSteps = task.steps.filter(
                        (s) => s.doneByUserId === uid
                      );
                      const userDone =
                        task.steps.length > 0
                          ? task.steps.every((s) => s.doneByUserId === uid)
                          : false;
                      return {
                        key: uid,
                        label: (
                          <span style={{ position: "relative" }}>
                            {uname}
                            {userDone && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: -2,
                                  right: -8,
                                  fontSize: "12px",
                                  color: "#52c41a",
                                }}
                              >
                                ✓
                              </span>
                            )}
                          </span>
                        ),
                      };
                    })}
                    style={{ marginBottom: 12 }}
                  />
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {task.steps.map((step) => (
                    <div
                      key={step.id}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Checkbox
                        checked={Boolean(step.doneByUserId)}
                        onChange={(e) =>
                          setStepDone(task.id, null, step.id, e.target.checked)
                        }
                      >
                        {step.name}
                      </Checkbox>
                    </div>
                  ))}
                </div>
                {task.steps.length === 0 && (
                  <Button
                    type="primary"
                    onClick={() =>
                      updateTask(task.id, { completed: !task.completed })
                    }
                  >
                    {task.completed ? "取消完成" : "标记完成"}
                  </Button>
                )}
              </div>
            )}
          </Card>
        ) : (
          <Card title={`子任务（${doneSubtasks}/${totalSubtasks} 已完成）`}>
            <Row gutter={[12, 12]}>
              <Col xs={24} md={24}>
                <Tabs
                  tabPosition="top"
                  activeKey={activeUserId}
                  onChange={(k) => setActiveUserId(k)}
                  items={task.userIds.map((uid) => {
                    const uname =
                      users.find((u) => u.id === uid)?.nickname ?? "未知";
                    const userSubs = (task.subtasks ?? []).filter(
                      (s) => s.ownerUserId === uid
                    );
                    const userDone =
                      userSubs.length > 0 && userSubs.every((s) => s.completed);
                    return {
                      key: uid,
                      label: (
                        <span style={{ position: "relative" }}>
                          {uname}
                          {userDone && (
                            <span
                              style={{
                                position: "absolute",
                                top: -2,
                                right: -8,
                                fontSize: "12px",
                                color: "#52c41a",
                              }}
                            >
                              ✓
                            </span>
                          )}
                        </span>
                      ),
                    };
                  })}
                />
              </Col>
              <Col xs={24} md={24}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  {(task.subtasks ?? [])
                    .filter(
                      (st) => !activeUserId || st.ownerUserId === activeUserId
                    )
                    .map((st, idx) => (
                      <Card
                        key={st.id}
                        size="small"
                        style={{
                          background: idx % 2 === 0 ? "#fff" : "#fafafa",
                          borderColor: idx % 2 === 0 ? "#f0f0f0" : "#e6f7ff",
                        }}
                        title={
                          editingSubtaskId === st.id ? (
                            <Input
                              size="small"
                              value={editingName}
                              autoFocus
                              onChange={(e) => setEditingName(e.target.value)}
                              onPressEnter={() => {
                                useStore
                                  .getState()
                                  .updateSubtask(task.id, st.id, {
                                    name: editingName.trim() || st.name,
                                  });
                                setEditingSubtaskId(null);
                              }}
                              onBlur={() => {
                                useStore
                                  .getState()
                                  .updateSubtask(task.id, st.id, {
                                    name: editingName.trim() || st.name,
                                  });
                                setEditingSubtaskId(null);
                              }}
                            />
                          ) : (
                            <Space>
                              {st.name}
                              {st.completed && (
                                <span style={{ color: "#52c41a" }}>✔</span>
                              )}
                            </Space>
                          )
                        }
                        extra={
                          <Space>
                            <Button
                              size="small"
                              type="text"
                              onClick={() => {
                                setEditingSubtaskId(st.id);
                                setEditingName(st.name);
                              }}
                              title="编辑"
                            >
                              ✏️
                            </Button>
                            <Button
                              size="small"
                              type="text"
                              onClick={() => {
                                const current = st.note;
                                if (current && current.length > 0) {
                                  // remove note
                                  useStore
                                    .getState()
                                    .updateSubtask(task.id, st.id, {
                                      note: "",
                                    });
                                } else {
                                  // add empty note to show editor
                                  useStore
                                    .getState()
                                    .updateSubtask(task.id, st.id, {
                                      note: " ",
                                    });
                                }
                              }}
                              title={
                                st.note && st.note.trim()
                                  ? "隐藏备注"
                                  : "添加备注"
                              }
                            >
                              📝
                            </Button>
                            <Button
                              size="small"
                              type="text"
                              onClick={() =>
                                useStore
                                  .getState()
                                  .deleteSubtask(task.id, st.id)
                              }
                              title="删除"
                            >
                              🗑
                            </Button>
                          </Space>
                        }
                      >
                        {(st.steps.length > 0 ||
                          (st.note && st.note.trim())) && (
                          <>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 12,
                              }}
                            >
                              {st.steps.map((sp) => (
                                <div
                                  key={sp.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <Checkbox
                                    checked={sp.doneByUserId === st.ownerUserId}
                                    onChange={(e) =>
                                      setStepDone(
                                        task.id,
                                        st.id,
                                        sp.id,
                                        e.target.checked
                                      )
                                    }
                                  >
                                    {sp.name}
                                  </Checkbox>
                                </div>
                              ))}
                            </div>
                            {st.note && st.note.trim() && (
                              <div style={{ marginTop: 8 }}>
                                <Input.TextArea
                                  size="small"
                                  value={st.note}
                                  onChange={(e) =>
                                    useStore
                                      .getState()
                                      .updateSubtask(task.id, st.id, {
                                        note: e.target.value,
                                      })
                                  }
                                  placeholder="子任务备注..."
                                  rows={2}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </Card>
                    ))}
                  <Button
                    type="dashed"
                    onClick={() => {
                      if (!activeUserId) return;
                      const stepTemplate = task.steps.map((s) => ({
                        ...s,
                        id: nanoid(),
                        doneByUserId: undefined,
                      }));
                      const seq =
                        (task.subtasks || []).filter(
                          (s) => s.ownerUserId === activeUserId
                        ).length + 1;
                      useStore.getState().addSubtask(task.id, {
                        name: `子任务 ${seq}`,
                        ownerUserId: activeUserId,
                        steps: stepTemplate,
                      });
                    }}
                  >
                    + 新增子任务
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        )}
      </div>
    </div>
  );
}
