import { Tabs, Tag } from "antd";
import { ID, User, Task, Subtask } from "../../../domain/types";
import { TaskType } from "../../../domain/enums";

interface UserTabsProps {
  userIds: ID[];
  users: User[];
  activeUserId?: ID;
  onUserChange: (userId: ID) => void;
  getUserCompletionStatus?: (userId: ID) => boolean;
  getUserIncompleteCount?: (userId: ID) => number;
  // 新增props用于显示任务完成情况
  task?: Task;
  taskSubtasks?: Subtask[];
  showTaskProgress?: boolean;
}

export default function UserTabs({
  userIds,
  users,
  activeUserId,
  onUserChange,
  getUserCompletionStatus,
  getUserIncompleteCount,
  task,
  taskSubtasks,
  showTaskProgress = false,
}: UserTabsProps) {
  if (userIds.length === 0) return null;

  // 计算单例任务的待完成步骤数
  const getSingleTaskIncompleteSteps = (userId: ID) => {
    if (!task || task.type !== TaskType.SINGLE) return 0;
    
    let incompleteCount = 0;
    task.steps.forEach(step => {
      const isCompleted = (step.completedByUsers || []).includes(userId);
      if (!isCompleted) {
        incompleteCount++;
      }
    });
    return incompleteCount;
  };

  // 计算复合任务的完成情况
  const getCompositeTaskProgress = (userId: ID) => {
    if (!task || task.type !== TaskType.COMPOSITE || !taskSubtasks) return { completed: 0, total: 0 };
    
    const userSubtasks = taskSubtasks.filter(subtask => subtask.ownerUserId === userId);
    const completedSubtasks = userSubtasks.filter(subtask => subtask.completed);
    
    return {
      completed: completedSubtasks.length,
      total: userSubtasks.length
    };
  };

  const items = userIds.map((uid, index) => {
    const uname = users.find((u) => u.id === uid)?.nickname ?? "未知";
    const isCompleted = getUserCompletionStatus?.(uid) || false;
    const incompleteCount = getUserIncompleteCount?.(uid) || 0;
    const isLastUser = index === userIds.length - 1;
    
    // 判断当前tab是否激活
    const isActive = activeUserId === uid;
    
    // 计算任务完成情况
    let progressTag = null;
    if (showTaskProgress && task) {
      if (task.type === TaskType.SINGLE) {
        // 单例任务：显示待完成步骤数或完成图标
        const incompleteSteps = getSingleTaskIncompleteSteps(uid);
        if (incompleteSteps > 0) {
          // 有未完成步骤，显示剩余数量
          progressTag = (
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                backgroundColor: "#ff9500",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "8px",
                fontWeight: "bold",
                lineHeight: "1",
                margin: 0,
                minWidth: "14px",
              }}
            >
              {incompleteSteps}
            </div>
          );
        } else if (task.steps.length > 0) {
          // 所有步骤完成，显示完成图标
          progressTag = (
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                backgroundColor: "#52c41a",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "8px",
                fontWeight: "bold",
                lineHeight: "1",
                margin: 0,
                minWidth: "14px",
              }}
            >
              ✓
            </div>
          );
        }
      } else if (task.type === TaskType.COMPOSITE) {
          // 复合任务：显示剩余未完成的任务数或完成图标
          const progress = getCompositeTaskProgress(uid);
          if (progress.total > 0) {
            const incompleteCount = progress.total - progress.completed;
            if (incompleteCount > 0) {
              // 有未完成任务，显示剩余数量
              progressTag = (
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    backgroundColor: "#ff9500",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: "500",
                    lineHeight: "1",
                    margin: 0,
                    minWidth: "14px",
                    transform: isActive ? "scale(1.2)" : "scale(1)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  {incompleteCount}
                </div>
              );
            } else {
              // 所有任务完成，显示完成图标
              progressTag = (
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    backgroundColor: "#52c41a",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "8px",
                    fontWeight: "bold",
                    lineHeight: "1",
                    margin: 0,
                    minWidth: "14px",
                    transform: isActive ? "scale(1.2)" : "scale(1)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  ✓
                </div>
              );
            }
          }
        }
    }
    
    // 获取复合任务的总数信息
    const getCompositeTaskTotal = (userId: ID) => {
      if (!task || task.type !== TaskType.COMPOSITE || !taskSubtasks) return 0;
      const userSubtasks = taskSubtasks.filter(subtask => subtask.ownerUserId === userId);
      return userSubtasks.length;
    };

    return {
      key: uid,
      label: (
        <div style={{ position: "relative", display: "inline-block" }}>
          <span style={{ 
            padding: `0 ${isLastUser ? "26px" : "6px"} 0 6px`, 
            fontSize: "14px" 
          }}>{uname}</span>
          {progressTag && (
            <span
              style={{
                position: "absolute",
                top: "2px",
                right: isLastUser ? "18px": "-2px",
                transform: isActive ? "translate(50%, -50%) scale(1.2)" : "translate(50%, -50%)",
                transformOrigin: "center center",
                transition: "transform 0.2s ease",
                zIndex: 1,
              }}
            >
              {progressTag}
            </span>
          )}
          {!showTaskProgress && isCompleted && (
            <span
              style={{
                fontSize: "12px",
                color: "#52c41a",
                marginLeft: "4px",
              }}
            >
              ✓
            </span>
          )}
          {showTaskProgress && task?.type === TaskType.COMPOSITE && (
            <span
              style={{
                position: "absolute",
                bottom: "-6px",
                left: isLastUser ? "calc(50% - 10px)" : "50%",
                transform: "translateX(-50%) scaleY(0.7)",
                fontSize: "8px",
                color: "#999",
                fontWeight: "normal",
                lineHeight: "1",
                whiteSpace: "nowrap",
                zIndex: 1,
                transformOrigin: "center bottom",
              }}
            >
              （ {getCompositeTaskTotal(uid)} ）
            </span>
          )}
        </div>
      ),
    };
  });

  return (
    <Tabs
      tabPosition="top"
      activeKey={activeUserId}
      onChange={onUserChange}
      items={items}
      style={{ marginBottom: 12 }}
    />
  );
}
