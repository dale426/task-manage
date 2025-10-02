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
import { useMemo, useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../../domain/store";
import type { ID, Task, Subtask } from "../../domain/types";
import { TaskType, TaskTypeLabels } from "../../domain/enums";
import { nanoid } from "../../utils/id";
import { colors, getRandomColor } from "@/utils/randomColor";
import CustomCheckbox from "../components/CustomCheckbox";
import completeImg from "../../assets/complete.png";
import processingImg from "../../assets/processing.png";

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { tasks, users, projects, setStepDone, updateTask, setTaskCompletedByUser } = useStore();
  const task = useMemo(
    () => tasks.find((t) => t.id === taskId),
    [tasks, taskId]
  );
  const [activeUserId, setActiveUserId] = useState<ID | undefined>(
    task?.userIds?.[0]
  );
  const [activeNoteSubtaskId, setActiveNoteSubtaskId] = useState<ID | null>(null);

  // 点击空白区域取消激活备注输入框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // 如果点击的不是备注相关的元素，则取消激活
      if (!target.closest('.subtask-note-area') && !target.closest('.note-button')) {
        setActiveNoteSubtaskId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
              <div>
                {task.userIds.length > 1 && (
                  <Tabs
                    tabPosition="top"
                    activeKey={activeUserId}
                    onChange={(k) => setActiveUserId(k)}
                    items={task.userIds.map((uid) => {
                      const uname =
                        users.find((u) => u.id === uid)?.nickname ?? "未知";
                      const isUserCompleted = (task.completedByUsers || []).includes(uid);
                      return {
                        key: uid,
                        label: (
                          <span style={{ position: "relative" }}>
                            {uname}
                            {isUserCompleted && (
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
                {task.userIds.length === 1 ? (
                  <Button
                    type="primary"
                    onClick={() =>
                      updateTask(task.id, { completed: !task.completed })
                    }
                  >
                    {task.completed ? "取消完成" : "标记完成"}
                  </Button>
                ) : (
                  <div style={{ padding: "16px", border: "1px solid #f0f0f0", borderRadius: "6px" }}>
                    <div style={{ marginBottom: "12px", fontWeight: "500" }}>
                      任务完成状态
                    </div>
                    {activeUserId && (
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <Checkbox
                          checked={(task.completedByUsers || []).includes(activeUserId)}
                          onChange={(e) => {
                            setTaskCompletedByUser(task.id, activeUserId, e.target.checked);
                          }}
                        >
                          我已完成此任务
                        </Checkbox>
                        {(task.completedByUsers || []).includes(activeUserId) &&
                          task.userCompletedAt &&
                          task.userCompletedAt[activeUserId] && (
                            <div style={{ fontSize: "12px", color: "#666" }}>
                              完成于: {dayjs(task.userCompletedAt[activeUserId]).format("MM-DD HH:mm")}
                            </div>
                          )}
                      </div>
                    )}
                    <div style={{ marginTop: "12px", fontSize: "12px", color: "#666" }}>
                      完成进度: {(task.completedByUsers || []).length}/{task.userIds.length} 个用户已完成
                    </div>
                  </div>
                )}
              </div>
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
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {task.steps.map((step, index) => {
                    // 在多用户场景下，显示当前用户是否完成了这个步骤
                    const isCompletedByCurrentUser = task.userIds.length > 1
                      ? (step.completedByUsers || []).includes(activeUserId || '')
                      : Boolean(step.doneByUserId);

                    // 显示是否有任何用户完成了这个步骤
                    const isCompletedByAnyone = Boolean(step.doneByUserId);
                    const completedUsersCount = (step.completedByUsers || []).length;
                    const currentColor = colors[index % colors.length];

                    return (
                      <div
                        key={step.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 12px",
                          border: "1px solid #f0f0f0",
                          borderRadius: "6px",
                          backgroundColor: "#fff",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                        onClick={() => {
                          if (task.userIds.length > 1 && activeUserId) {
                            setStepDone(task.id, null, step.id, !isCompletedByCurrentUser, activeUserId);
                          } else {
                            setStepDone(task.id, null, step.id, !isCompletedByCurrentUser);
                          }
                        }}
                      >
                        <div style={{ minWidth: "20px", textAlign: "center" }}>
                          {index + 1}
                        </div>
                        <Checkbox
                          checked={isCompletedByCurrentUser}
                          onChange={(e) => {
                            if (task.userIds.length > 1 && activeUserId) {
                              // For multi-user tasks, pass the current user ID
                              setStepDone(task.id, null, step.id, e.target.checked, activeUserId);
                            } else {
                              setStepDone(task.id, null, step.id, e.target.checked);
                            }
                          }}
                          className="custom-checkbox"
                        >
                          {step.name}
                        </Checkbox>
                        {isCompletedByCurrentUser && step.userCompletedAt && step.userCompletedAt[activeUserId || ''] && (
                          <div style={{ marginLeft: "auto", fontSize: "12px", color: "#666" }}>
                            完成于: {dayjs(step.userCompletedAt[activeUserId || '']).format("MM-DD HH:mm")}
                          </div>
                        )}
                        {task.userIds.length > 1 && isCompletedByAnyone && !isCompletedByCurrentUser && (
                          <div style={{ marginLeft: "auto", fontSize: "12px", color: "#1890ff" }}>
                            {completedUsersCount}个用户已完成
                          </div>
                        )}
                      </div>
                    );
                  })}
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
          <Card
            title={`子任务（${doneSubtasks}/${totalSubtasks} 已完成）`}>
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
                    const incompleteCount = userSubs.filter(s => !s.completed).length;
                    
                    return {
                      key: uid,
                      label: (
                        <span style={{ position: "relative", display: "flex", alignItems: "center", gap: "4px" }}>
                          {uname}
                          {userDone ? (
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#52c41a",
                              }}
                            >
                              ✓
                            </span>
                          ) : incompleteCount > 0 ? (
                            <span
                              style={{
                                fontSize: "10px",
                                backgroundColor: "#ff4d4f",
                                color: "white",
                                padding: "1px 4px",
                                borderRadius: "8px",
                                minWidth: "16px",
                                textAlign: "center"
                              }}
                            >
                              {incompleteCount}
                            </span>
                          ) : null}
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
                        className={st.completed ? "completed-subtask-card" : "processing-subtask-card"}
                        style={{
                            border: `1px solid ${st.completed ? "#999" : "#555"}`,
                            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                            opacity: st.completed ? 0.6 : 1,
                            transition: "opacity 0.2s ease",
                            position: "relative",
                            ...(st.completed 
                              ? {
                                  '--complete-img-url': `url(${completeImg})`
                                } as React.CSSProperties
                              : {
                                  '--processing-img-url': `url(${processingImg})`
                                } as React.CSSProperties)
                          }}
                        styles={!st.completed ? {
                          header: {
                            borderLeft: `8px solid ${colors[idx % colors.length]}`
                          },
                          body: {
                            borderLeft: `8px solid ${colors[idx % colors.length]}`
                          }
                        } : {}}
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
                              <span style={st.completed ? { textDecoration: "line-through" } : {}}>
                                {st.name}
                              </span>
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
                              className="note-button"
                              onClick={() => {
                                if (activeNoteSubtaskId === st.id) {
                                  // 如果当前已激活，则取消激活
                                  setActiveNoteSubtaskId(null);
                                } else {
                                  // 激活当前子任务的备注输入框
                                  setActiveNoteSubtaskId(st.id);
                                  // 如果还没有备注字段，则初始化为空字符串
                                  if (st.note === undefined || st.note === null) {
                                    useStore
                                      .getState()
                                      .updateSubtask(task.id, st.id, {
                                        note: "",
                                      });
                                  }
                                }
                              }}
                              title="添加备注"
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
                        {st.steps.length > 0 ? (
                          // 有步骤的子任务
                          <>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                              }}
                            >
                               {st.steps.map((sp, stepIndex) => {
                                   const currentColor = colors[idx % colors.length];
                                   const isCompleted = sp.doneByUserId === st.ownerUserId;
                                   
                                   return (
                                     <div
                                       key={sp.id}
                                       style={{
                                         display: "flex",
                                         alignItems: "center",
                                         gap: 8,
                                         padding: "6px 10px",
                                         border: "1px solid #f0f0f0",
                                         borderRadius: "4px",
                                         backgroundColor: isCompleted ? "#f6ffed" : "#fff",
                                         cursor: "pointer",
                                         transition: "all 0.2s ease"
                                       }}
                                       onClick={() => setStepDone(task.id, st.id, sp.id, !isCompleted)}
                                     >
                                       <div style={{ minWidth: "16px", textAlign: "center", fontSize: "12px" }}>
                                         {stepIndex + 1}
                                       </div>
                                       <CustomCheckbox
                                         checked={isCompleted}
                                         onChange={(checked) =>
                                           setStepDone(
                                             task.id,
                                             st.id,
                                             sp.id,
                                             checked
                                           )
                                         }
                                         color={currentColor}
                                       />
                                       <span style={{ marginLeft: "8px", flex: 1 }}>
                                         {sp.name}
                                       </span>
                                       {isCompleted && sp.completedAt && (
                                         <div style={{ marginLeft: "auto", fontSize: "11px", color: "#666" }}>
                                           完成于: {dayjs(sp.completedAt).format("MM-DD HH:mm")}
                                         </div>
                                       )}
                                     </div>
                                   );
                                 })}
                              </div>
                              {st.note !== undefined && st.note !== null && (
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
                        ) : (
                          // 无步骤的子任务，直接提供完成标记
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "12px 16px",
                              border: "1px solid #f0f0f0",
                              borderRadius: "6px",
                              backgroundColor: st.completed ? "#f6ffed" : "#fff",
                              cursor: "pointer",
                              transition: "all 0.2s ease"
                            }}
                            onClick={() => {
                              useStore.getState().updateSubtask(task.id, st.id, {
                                completed: !st.completed,
                                completedAt: !st.completed ? new Date().toISOString() : undefined
                              });
                            }}
                          >
                            <CustomCheckbox
                              checked={st.completed}
                              onChange={(checked) => {
                                useStore.getState().updateSubtask(task.id, st.id, {
                                  completed: checked,
                                  completedAt: checked ? new Date().toISOString() : undefined
                                });
                              }}
                              color={colors[idx % colors.length]}
                            />
                            <span style={{ flex: 1, fontSize: "14px" }}>
                              标记为{st.completed ? "未完成" : "完成"}
                            </span>
                            {st.completed && st.completedAt && (
                              <span style={{ fontSize: "12px", color: "#666" }}>
                                完成于 {dayjs(st.completedAt).format("MM-DD HH:mm")}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* 备注区域 */}
                        {(activeNoteSubtaskId === st.id || (st.note && st.note.trim() !== "")) && (
                          <div className="subtask-note-area" style={{ marginTop: 8 }}>
                            <Input.TextArea
                              size="small"
                              value={st.note || ""}
                              onChange={(e) => {
                                useStore
                                  .getState()
                                  .updateSubtask(task.id, st.id, {
                                    note: e.target.value,
                                  });
                              }}
                              onBlur={(e) => {
                                // 如果内容为空，则移除备注字段并取消激活
                                if (!e.target.value.trim()) {
                                  useStore
                                    .getState()
                                    .updateSubtask(task.id, st.id, {
                                      note: undefined,
                                    });
                                  setActiveNoteSubtaskId(null);
                                }
                              }}
                              placeholder="子任务备注..."
                              rows={2}
                              autoFocus={activeNoteSubtaskId === st.id && (!st.note || st.note.trim() === "")}
                            />
                          </div>
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
