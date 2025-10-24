import { Button, Card, Checkbox, message } from "antd";
import dayjs from "dayjs";
import { Task, ID } from "../../../domain/types";
import { TaskType } from "../../../domain/enums";
import { colors } from "../../../utils/randomColor";
import CustomCheckbox from "../../components/CustomCheckbox";
import UserTabs from "./UserTabs";
import UserNote from "./UserNote";

interface TaskStepsProps {
  task: Task;
  users: any[];
  activeUserId?: ID;
  onUserChange: (userId: ID) => void;
  onStepDone: (taskId: string, stepId: string, userId: ID) => Promise<void>;
  onStepUndone: (taskId: string, stepId: string, userId: ID) => Promise<void>;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onUserNoteSave: (note: string) => Promise<void>;
}

export default function TaskSteps({
  task,
  users,
  activeUserId,
  onUserChange,
  onStepDone,
  onStepUndone,
  onTaskUpdate,
  onUserNoteSave,
}: TaskStepsProps) {
  const handleStepClick = async (stepId: string) => {
    console.log('TaskSteps: handleStepClick called', { stepId, taskId: task.id, userIds: task.userIds, activeUserId });
    try {
      if (task.userIds.length > 1 && activeUserId) {
        // 多用户任务
        const isCompleted = task.steps.find(s => s.id === stepId)?.completedByUsers?.includes(activeUserId) || false;
        console.log('TaskSteps: 多用户任务', { isCompleted, stepId, activeUserId });
        if (isCompleted) {
          await onStepUndone(task.id, stepId, activeUserId);
        } else {
          await onStepDone(task.id, stepId, activeUserId);
        }
      } else if (task.userIds.length === 1) {
        // 单用户任务
        const isCompleted = task.steps.find(s => s.id === stepId)?.completedByUsers?.includes(task.userIds[0]) || false;
        console.log('TaskSteps: 单用户任务', { isCompleted, stepId, userId: task.userIds[0] });
        if (isCompleted) {
          await onStepUndone(task.id, stepId, task.userIds[0]);
        } else {
          await onStepDone(task.id, stepId, task.userIds[0]);
        }
      }
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败，请重试');
    }
  };

  const handleCheckboxChange = async (stepId: string, checked: boolean) => {
    console.log('TaskSteps: handleCheckboxChange called', { stepId, checked, taskId: task.id, userIds: task.userIds, activeUserId });
    try {
      if (task.userIds.length > 1 && activeUserId) {
        console.log('TaskSteps: 多用户任务checkbox', { checked, stepId, activeUserId });
        if (checked) {
          await onStepDone(task.id, stepId, activeUserId);
        } else {
          await onStepUndone(task.id, stepId, activeUserId);
        }
      } else if (task.userIds.length === 1) {
        console.log('TaskSteps: 单用户任务checkbox', { checked, stepId, userId: task.userIds[0] });
        if (checked) {
          await onStepDone(task.id, stepId, task.userIds[0]);
        } else {
          await onStepUndone(task.id, stepId, task.userIds[0]);
        }
      }
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败，请重试');
    }
  };

  const getUserCompletionStatus = (userId: ID) => {
    if (task.steps.length === 0) {
      return (task.completedByUsers || []).includes(userId);
    } else {
      return task.steps.every(step => 
        (step.completedByUsers || []).includes(userId)
      );
    }
  };

  return (
    <Card title="完成步骤">
      {task.steps.length === 0 ? (
        <div>
          <UserTabs
            userIds={task.userIds}
            users={users}
            activeUserId={activeUserId}
            onUserChange={onUserChange}
            getUserCompletionStatus={getUserCompletionStatus}
            task={task}
            showTaskProgress={true}
          />
          
          {task.userIds.length === 1 ? (
            <div>
              <Button
                type="primary"
                onClick={() => onTaskUpdate(task.id, { completed: !task.completed })}
              >
                {task.completed ? "取消完成" : "标记完成"}
              </Button>
              
              <UserNote
                activeUserId={activeUserId}
                userNotes={task.userNotes}
                onNoteSave={onUserNoteSave}
                noteType="steps"
              />
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
                          // 这里需要调用设置用户完成状态的方法
                          console.log('设置用户完成状态');
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
                  
                  <UserNote
                    activeUserId={activeUserId}
                    userNotes={task.userNotes}
                    onNoteSave={onUserNoteSave}
                    noteType="steps"
                  />
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
          <UserTabs
            userIds={task.userIds}
            users={users}
            activeUserId={activeUserId}
            onUserChange={onUserChange}
            getUserCompletionStatus={getUserCompletionStatus}
            task={task}
            showTaskProgress={true}
          />
          
          <UserNote
            activeUserId={activeUserId}
            userNotes={task.userNotes}
            onNoteSave={onUserNoteSave}
            noteType="steps"
          />
          
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {task.steps.map((step, index) => {
              const isCompletedByCurrentUser = task.userIds.length > 1
                ? (step.completedByUsers || []).includes(activeUserId || '')
                : (step.completedByUsers || []).includes(task.userIds[0]);
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
                  onClick={() => handleStepClick(step.id)}
                >
                  <div style={{ minWidth: "20px", textAlign: "center" }}>
                    {index + 1}
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", flex: 1, minHeight: "22px" }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", height: "22px" }}>
                      <CustomCheckbox
                        checked={isCompletedByCurrentUser}
                        onChange={(checked) => handleCheckboxChange(step.id, checked)}
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
                    }}>
                      {step.name}
                    </span>
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
          
          {/* 由于现在所有任务都有步骤，这个按钮不再需要 */}
        </div>
      )}
    </Card>
  );
}
