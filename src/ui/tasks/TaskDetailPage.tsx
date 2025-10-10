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
  message,
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
  const { tasks, subtasks, users, projects, setStepDone, setStepUndone, updateTask, setTaskCompletedByUser, setTaskUserNote, setStepUserNote, setSubtaskUserNote, updateSubtask, addSubtask, setSubtaskStepDone, setSubtaskStepUndone } = useStore();

  const task = useMemo(
    () => tasks.find((t) => t.id === taskId),
    [tasks, taskId]
  );

  const taskSubtasks = useMemo(
    () => subtasks.filter((s) => s.taskId === taskId),
    [subtasks, taskId]
  );
  const [activeUserId, setActiveUserId] = useState<ID | undefined>(
    task?.userIds?.[0]
  );
  const [activeNoteSubtaskId, setActiveNoteSubtaskId] = useState<ID | null>(null);
  const [activeUserNoteId, setActiveUserNoteId] = useState<ID | null>(null);
  const [tempUserNote, setTempUserNote] = useState<string>("");

  // 处理用户备注保存
  const handleUserNoteSave = async (note: string) => {
    console.log('handleUserNoteSave called:', { note, activeUserId, taskId: task?.id });
    if (activeUserId && task) {
      try {
        await setTaskUserNote(task.id, activeUserId, note);
        console.log('用户备注保存成功');
      } catch (error) {
        console.error('用户备注保存失败:', error);
      }
    }
  };

  // 处理用户备注输入框激活
  const handleUserNoteActivate = (noteId: string) => {
    setActiveUserNoteId(noteId);
    setTempUserNote(task?.userNotes?.[activeUserId!] || "");
  };

  // 当activeUserId变化时，更新tempUserNote
  useEffect(() => {
    if (activeUserId && task) {
      setTempUserNote(task.userNotes?.[activeUserId] || "");
    }
  }, [activeUserId, task]);

  // 点击空白区域取消激活备注输入框
  useEffect(() => {
    const handleClickOutside = async (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // 如果点击的不是备注相关的元素，则取消激活
      if (!target.closest('.subtask-note-area') && !target.closest('.note-button') && !target.closest('.user-note-area') && !target.closest('.user-note-button')) {
        // 如果有激活的用户备注输入框，先保存备注
        if (activeUserNoteId && activeUserId && task) {
          console.log('点击空白区域，保存用户备注', { tempUserNote, activeUserId });
          await handleUserNoteSave(tempUserNote);
        }
        setActiveNoteSubtaskId(null);
        setActiveUserNoteId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeUserNoteId, activeUserId, task, tempUserNote, handleUserNoteSave]);

  if (!task) return <Empty description="任务不存在" />;

  const projectName = task.projectId
    ? projects.find((p) => p.id === task.projectId)?.name ?? "-"
    : "-";

  const totalSubtasks = taskSubtasks.length;
  const doneSubtasks = taskSubtasks.filter((s) => s.completed).length;
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
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
              {!task.completed && (
                <Button
                  type="primary"
                  size="small"
                  onClick={async () => {
                    try {
                      await updateTask(task.id, { completed: true });
                      message.success('任务已强制完成');
                    } catch (error) {
                      console.error('操作失败:', error);
                      message.error('操作失败，请重试');
                    }
                  }}
                  style={{ fontSize: "12px" }}
                >
                  强制完成
                </Button>
              )}
              {task.completed && (
                <Button
                  size="small"
                  onClick={async () => {
                    try {
                      await updateTask(task.id, { completed: false });
                      message.success('任务完成状态已取消');
                    } catch (error) {
                      console.error('操作失败:', error);
                      message.error('操作失败，请重试');
                    }
                  }}
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
          <div style={{ color: "#555" }}>
            {task.type === TaskType.SINGLE ? (
              <>
                用户数：{task.userIds.length}，已完成用户：{(() => {
                  if (task.userIds.length === 1) {
                    return task.completed ? 1 : 0;
                  } else {
                    // 多用户场景：检查每个用户是否完成了所有步骤
                    return task.userIds.filter(userId => {
                      if (task.steps.length === 0) {
                        // 无步骤任务：检查用户是否在完成列表中
                        return (task.completedByUsers || []).includes(userId);
                      } else {
                        // 有步骤任务：检查用户是否完成了所有步骤
                        return task.steps.every(step => 
                          (step.completedByUsers || []).includes(userId)
                        );
                      }
                    }).length;
                  }
                })()}
              </>
            ) : (
              <>
                用户数：{task.userIds.length}，子任务：{doneSubtasks}/{totalSubtasks}
              </>
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

      <div style={{ marginTop: 12 }}>
        {task.type === "single" ? (
          <Card 
            title={
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>完成步骤</span>
                {task.userIds.length > 0 && activeUserId && (
                  <Button
                    size="small"
                    type="text"
                    className="user-note-button"
                    onClick={() => {
                      if (activeUserNoteId === 'steps') {
                        setActiveUserNoteId(null);
                      } else {
                        setActiveUserNoteId('steps');
                      }
                    }}
                    title="添加用户备注"
                  >
                    📝
                  </Button>
                )}
              </div>
            }
          >
            {task.steps.length === 0 ? (
              <div>
                {task.userIds.length > 0 && (
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
                  <div>
                    <Button
                      type="primary"
                      onClick={() =>
                        updateTask(task.id, { completed: !task.completed })
                      }
                    >
                      {task.completed ? "取消完成" : "标记完成"}
                    </Button>
                    
                    {/* 单用户任务的用户备注区域 */}
                    {task.userIds.length > 0 && activeUserId && (
                      <div className="user-note-area" style={{ marginTop: 12 }}>
                        {activeUserNoteId === 'steps' ? (
                          <Input.TextArea
                            size="small"
                            value={tempUserNote}
                            onChange={(e) => {
                              setTempUserNote(e.target.value);
                            }}
                            onBlur={async () => {
                              console.log('onBlur triggered', { tempUserNote, activeUserId });
                              await handleUserNoteSave(tempUserNote);
                              setActiveUserNoteId(null);
                            }}
                            placeholder="添加用户备注..."
                            rows={2}
                            autoFocus={true}
                          />
                        ) : task.userNotes?.[activeUserId] ? (
                          <div 
                            style={{ 
                              padding: "4px 8px", 
                              backgroundColor: "#f5f5f5", 
                              borderRadius: "4px",
                              fontSize: "12px",
                              color: "#666",
                              cursor: "pointer",
                              minHeight: "20px"
                            }}
                            onClick={() => handleUserNoteActivate('steps')}
                          >
                            {task.userNotes[activeUserId]}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: "16px", border: "1px solid #f0f0f0", borderRadius: "6px" }}>
                    <div style={{ marginBottom: "12px", fontWeight: "500" }}>
                      任务完成状态
                    </div>
                    {activeUserId && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <Checkbox
                            checked={(task.completedByUsers || []).includes(activeUserId)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTaskCompletedByUser(task.id, activeUserId);
                              }
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
                        
                        {/* 用户备注功能 */}
                        <div style={{ marginTop: "8px" }}>
                          <div style={{ marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>
                            我的备注
                          </div>
                          <Input.TextArea
                            placeholder="添加个人备注..."
                            value={tempUserNote}
                            onChange={(e) => {
                              setTempUserNote(e.target.value);
                            }}
                            onBlur={async () => {
                              console.log('onBlur triggered (multi-user)', { tempUserNote, activeUserId });
                              await handleUserNoteSave(tempUserNote);
                            }}
                            rows={3}
                            style={{ resize: "none" }}
                          />
                        </div>
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
                {task.userIds.length > 0 && (
                  <Tabs
                    tabPosition="top"
                    activeKey={activeUserId}
                    onChange={(k) => setActiveUserId(k)}
                    items={task.userIds.map((uid) => {
                      const uname =
                        users.find((u) => u.id === uid)?.nickname ?? "未知";
                      
                      // 修复用户完成状态判断逻辑
                      let userDone = false;
                      if (task.steps.length > 0) {
                        // 有步骤的任务：检查用户是否完成了所有步骤
                        userDone = task.steps.every((s) => 
                          (s.completedByUsers || []).includes(uid)
                        );
                      } else {
                        // 无步骤的任务：检查用户是否在完成列表中
                        userDone = (task.completedByUsers || []).includes(uid);
                      }
                      return {
                        key: uid,
                        label: (
                          <span style={{ position: "relative", display: "flex", alignItems: "center", gap: "4px" }}>
                            <span>{uname}</span>
                            {userDone && (
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "#52c41a"
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
                
                {/* 用户备注区域 */}
                {task.userIds.length > 0 && activeUserId && (
                  <div className="user-note-area" style={{ marginBottom: 12 }}>
                    {activeUserNoteId === 'steps' ? (
                      <Input.TextArea
                        size="small"
                        value={tempUserNote}
                        onChange={(e) => {
                          setTempUserNote(e.target.value);
                        }}
                        onBlur={async () => {
                          console.log('onBlur triggered (steps)', { tempUserNote, activeUserId });
                          await handleUserNoteSave(tempUserNote);
                          setActiveUserNoteId(null);
                        }}
                        placeholder="添加用户备注..."
                        rows={2}
                        autoFocus={true}
                      />
                    ) : task.userNotes?.[activeUserId] ? (
                      <div 
                        style={{ 
                          padding: "4px 8px", 
                          backgroundColor: "#f5f5f5", 
                          borderRadius: "4px",
                          fontSize: "12px",
                          color: "#666",
                          cursor: "pointer",
                          minHeight: "20px"
                        }}
                        onClick={() => handleUserNoteActivate('steps')}
                      >
                        {task.userNotes[activeUserId]}
                      </div>
                    ) : null}
                  </div>
                )}
                
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {task.steps.map((step, index) => {
                    // 在多用户场景下，显示当前用户是否完成了这个步骤
                    const isCompletedByCurrentUser = task.userIds.length > 1
                      ? (step.completedByUsers || []).includes(activeUserId || '')
                      : (step.completedByUsers || []).includes(task.userIds[0]);

  

                    // 显示是否有任何用户完成了这个步骤
                    const isCompletedByAnyone = task.userIds.length > 0 
                      ? (step.completedByUsers || []).length > 0
                      : Boolean(step.doneByUserId);
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
                        onClick={async () => {
                          try {
                            if (task.userIds.length > 1 && activeUserId) {
                              // 多用户任务（包括多用户单例任务）
                              if (isCompletedByCurrentUser) {
                                await setStepUndone(task.id, step.id, activeUserId);
                              } else {
                                await setStepDone(task.id, step.id, activeUserId);
                              }
                            } else if (task.userIds.length === 1) {
                              // 单用户任务，使用completedByUsers数组
                              if (isCompletedByCurrentUser) {
                                await setStepUndone(task.id, step.id, task.userIds[0]);
                              } else {
                                await setStepDone(task.id, step.id, task.userIds[0]);
                              }
                            }
                          } catch (error) {
                            console.error('操作失败:', error);
                            message.error('操作失败，请重试');
                          }
                        }}
                      >
                        <div style={{ minWidth: "20px", textAlign: "center" }}>
                          {index + 1}
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", flex: 1, minHeight: "22px" }}>
                          <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", height: "22px" }}>
                            <CustomCheckbox
                              checked={isCompletedByCurrentUser}
                              onChange={async (checked) => {
                                try {
                     
                                  
                                  if (task.userIds.length > 1 && activeUserId) {
                                    // 多用户任务（包括多用户单例任务）
                                    if (checked) {
                                      console.log('标记步骤完成');
                                      await setStepDone(task.id, step.id, activeUserId);
                                    } else {
                                      console.log('取消步骤完成');
                                      await setStepUndone(task.id, step.id, activeUserId);
                                    }
                                  } else if (task.userIds.length === 1) {
                                    // 单用户任务，使用completedByUsers数组
                                    if (checked) {
                                      console.log('单用户任务标记步骤完成');
                                      await setStepDone(task.id, step.id, task.userIds[0]);
                                    } else {
                                      console.log('单用户任务取消步骤完成');
                                      await setStepUndone(task.id, step.id, task.userIds[0]);
                                    }
                                  }
                                } catch (error) {
                                  console.error('操作失败:', error);
                                  message.error('操作失败，请重试');
                                }
                              }}
                              color={currentColor}
                            />
                          </div>
                          <span style={{ 
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            height: "22px",
                            textDecoration: isCompletedByCurrentUser ? 'line-through' : 'none',
                            opacity: isCompletedByCurrentUser ? 0.6 : 1
                          }}>{step.name}</span>
                        </div>
                        {isCompletedByCurrentUser && step.userCompletedAt && step.userCompletedAt[activeUserId || ''] && (
                          <div style={{ marginLeft: "auto", fontSize: "12px", color: "#666" }}>
                            完成于: {dayjs(step.userCompletedAt[activeUserId || '']).format("MM-DD HH:mm")}
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
            title={
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>子任务（{doneSubtasks}/{totalSubtasks} 已完成）</span>
                {task.userIds.length > 0 && activeUserId && (
                  <Button
                    size="small"
                    type="text"
                    className="user-note-button"
                    onClick={() => {
                      if (activeUserNoteId === 'subtasks') {
                        setActiveUserNoteId(null);
                      } else {
                        setActiveUserNoteId('subtasks');
                      }
                    }}
                    title="添加用户备注"
                  >
                    📝
                  </Button>
                )}
              </div>
            }>
            <Row gutter={[12, 12]}>
              <Col xs={24} md={24}>
                <Tabs
                  tabPosition="top"
                  activeKey={activeUserId}
                  onChange={(k) => setActiveUserId(k)}
                  items={task.userIds.map((uid) => {
                    const uname =
                      users.find((u) => u.id === uid)?.nickname ?? "未知";
                    const userSubs = taskSubtasks.filter(
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
                {/* 用户备注区域 */}
                {task.userIds.length > 0 && activeUserId && (
                  <div className="user-note-area" style={{ marginBottom: 12 }}>
                    {activeUserNoteId === 'subtasks' ? (
                      <Input.TextArea
                        size="small"
                        value={tempUserNote}
                        onChange={(e) => {
                          setTempUserNote(e.target.value);
                        }}
                        onBlur={async () => {
                          console.log('onBlur triggered (subtasks)', { tempUserNote, activeUserId });
                          await handleUserNoteSave(tempUserNote);
                          setActiveUserNoteId(null);
                        }}
                        placeholder="添加用户备注555..."
                        rows={2}
                        autoFocus={true}
                      />
                    ) : task.userNotes?.[activeUserId] ? (
                      <div 
                        style={{ 
                          padding: "4px 8px", 
                          backgroundColor: "#f5f5f5", 
                          borderRadius: "4px",
                          fontSize: "12px",
                          color: "#666",
                          cursor: "pointer",
                          minHeight: "20px"
                        }}
                        onClick={() => handleUserNoteActivate('subtasks')}
                      >
                        {task.userNotes[activeUserId]}
                      </div>
                    ) : null}
                  </div>
                )}
                
                <Space direction="vertical" style={{ width: "100%" }}>
                  {taskSubtasks
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
                        styles={{
                          header: {
                            borderLeft: `8px solid`,
                            borderLeftColor:!st.completed ? colors[idx % colors.length] : "#fff",
                          },
                          body:  {
                            borderLeft: `8px solid`,
                            borderLeftColor:!st.completed ? colors[idx % colors.length] : "#fff",
                            padding: 8
                          }
                        }}
                        title={
                          editingSubtaskId === st.id ? (
                            <Input
                              size="small"
                              value={editingName}
                              autoFocus
                              onChange={(e) => setEditingName(e.target.value)}
                              onPressEnter={async () => {
                                try {
                                  await updateSubtask(task.id, st.id, { 
                                    name: editingName.trim() || st.name 
                                  });
                                setEditingSubtaskId(null);
                                } catch (error) {
                                  console.error('更新失败:', error);
                                  message.error('更新失败，请重试');
                                }
                              }}
                              onBlur={async () => {
                                try {
                                  await updateSubtask(task.id, st.id, { 
                                    name: editingName.trim() || st.name 
                                  });
                                setEditingSubtaskId(null);
                                } catch (error) {
                                  console.error('更新失败:', error);
                                  message.error('更新失败，请重试');
                                }
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
                                   const isCompleted = activeUserId ? (sp.completedByUsers || []).includes(activeUserId) : false;
                                   
                                   return (
                                <div
                                  key={sp.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                         gap: 4,
                                         padding: "4px 10px",
                                         border: "1px solid #f0f0f0",
                                         borderRadius: "4px",
                                         backgroundColor: isCompleted ? "#f6ffed" : "#fff",
                                         cursor: "pointer",
                                         transition: "all 0.2s ease"
                                       }}
                                       onClick={async () => {
                                         try {
                                           if (activeUserId) {
                                             if (isCompleted) {
                                               await setSubtaskStepUndone(task.id, st.id, sp.id, activeUserId);
                                             } else {
                                               await setSubtaskStepDone(task.id, st.id, sp.id, activeUserId);
                                             }
                                           }
                                         } catch (error) {
                                           console.error('操作失败:', error);
                                           message.error('操作失败，请重试');
                                         }
                                       }}
                                     >
                                       <div style={{ minWidth: "16px", textAlign: "center", fontSize: "12px" }}>
                                         {stepIndex + 1}
                                       </div>
                                       <CustomCheckbox
                                         checked={isCompleted}
                                         onChange={async (checked) => {
                                           try {
                                             if (checked && activeUserId) {
                                               await setSubtaskStepDone(task.id, st.id, sp.id, activeUserId);
                                             } else if (!checked && activeUserId) {
                                               await setSubtaskStepUndone(task.id, st.id, sp.id, activeUserId);
                                             }
                                           } catch (error) {
                                             console.error('操作失败:', error);
                                             message.error('操作失败，请重试');
                                           }
                                         }}
                                         color={currentColor}
                                       />
                                       <span style={{ 
                                         marginLeft: "8px", 
                                         flex: 1,
                                         textDecoration: isCompleted ? 'line-through' : 'none',
                                         opacity: isCompleted ? 0.6 : 1
                                       }}>
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
                          </>
                        ) : (
                          // 无步骤的子任务，直接提供完成标记
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "6px 16px",
                              border: "1px solid #f0f0f0",
                              borderRadius: "6px",
                              backgroundColor: st.completed ? "#f6ffed" : "#fff",
                              cursor: "pointer",
                              transition: "all 0.2s ease"
                            }}
                            onClick={async () => {
                              try {
                                await updateSubtask(task.id, st.id, {
                                  completed: !st.completed,
                                });
                              } catch (error) {
                                console.error('操作失败:', error);
                                message.error('操作失败，请重试');
                              }
                            }}
                          >
                            <CustomCheckbox
                              checked={st.completed}
                              onChange={async (checked) => {
                                try {
                                  await updateSubtask(task.id, st.id, {
                                    completed: checked,
                                  });
                                } catch (error) {
                                  console.error('操作失败:', error);
                                  message.error('操作失败，请重试');
                                }
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
                          <div className="subtask-note-area" style={{ marginTop: 4 }}>
                            {activeNoteSubtaskId === st.id ? (
                              // 编辑态：显示输入框
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
                                  } else {
                                    // 有内容时，取消激活但保持显示
                                    setActiveNoteSubtaskId(null);
                                  }
                                }}
                                  placeholder="子任务备注..."
                                  rows={2}
                                autoFocus={true}
                              />
                            ) : (
                              // 展示态：显示备注内容
                              <div 
                                style={{ 
                                  padding: "4px 8px", 
                                  backgroundColor: "#f5f5f5", 
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  color: "#666",
                                  cursor: "pointer",
                                  minHeight: "20px"
                                }}
                                onClick={() => setActiveNoteSubtaskId(st.id)}
                              >
                                {st.note}
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    ))}
                  <Button
                    type="dashed"
                    onClick={() => {
                      if (!activeUserId) return;
                      const seq =
                        taskSubtasks.filter(
                          (s) => s.ownerUserId === activeUserId
                        ).length + 1;
                      addSubtask(task.id, {
                        name: `子任务 ${seq}`,
                        ownerUserId: activeUserId,
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
