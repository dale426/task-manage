import { Button, Card, Row, Col, Space } from "antd";
import { Task, Subtask, ID } from "../../../domain/types";
import UserTabs from "./UserTabs";
import UserNote from "./UserNote";
import SubtaskItem from "./SubtaskItem";

interface SubtaskListProps {
  task: Task;
  taskSubtasks: Subtask[];
  users: any[];
  activeUserId?: ID;
  onUserChange: (userId: ID) => void;
  onAddSubtask: (taskId: string, data: Pick<Subtask, "name" | "ownerUserId">) => Promise<void>;
  onUpdateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => Promise<void>;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  onSubtaskStepDone: (taskId: string, subtaskId: string, stepId: string, userId: ID) => Promise<void>;
  onSubtaskStepUndone: (taskId: string, subtaskId: string, stepId: string, userId: ID) => Promise<void>;
  onSetSubtaskNote: (taskId: string, subtaskId: string, note: string) => void;
  onUserNoteSave: (note: string) => Promise<void>;
}

export default function SubtaskList({
  task,
  taskSubtasks,
  users,
  activeUserId,
  onUserChange,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onSubtaskStepDone,
  onSubtaskStepUndone,
  onSetSubtaskNote,
  onUserNoteSave,
}: SubtaskListProps) {
  const doneSubtasks = taskSubtasks.filter((s) => s.completed).length;
  const totalSubtasks = taskSubtasks.length;

  const getUserCompletionStatus = (userId: ID) => {
    const userSubs = taskSubtasks.filter((s) => s.ownerUserId === userId);
    return userSubs.length > 0 && userSubs.every((s) => s.completed);
  };

  const getUserIncompleteCount = (userId: ID) => {
    const userSubs = taskSubtasks.filter((s) => s.ownerUserId === userId);
    return userSubs.filter(s => !s.completed).length;
  };

  const handleAddSubtask = () => {
    if (!activeUserId) return;
    const seq = taskSubtasks.filter((s) => s.ownerUserId === activeUserId).length + 1;
    onAddSubtask(task.id, {
      name: `子任务 ${seq}`,
      ownerUserId: activeUserId,
    });
  };

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>子任务（{doneSubtasks}/{totalSubtasks} 已完成）</span>
        </div>
      }
    >
      <Row gutter={[12, 12]}>
        <Col xs={24} md={24}>
          <UserTabs
            userIds={task.userIds}
            users={users}
            activeUserId={activeUserId}
            onUserChange={onUserChange}
            getUserCompletionStatus={getUserCompletionStatus}
            getUserIncompleteCount={getUserIncompleteCount}
          />
        </Col>
        <Col xs={24} md={24}>
          <UserNote
            activeUserId={activeUserId}
            userNotes={task.userNotes}
            onNoteSave={onUserNoteSave}
            noteType="subtasks"
          />
          
          <Space direction="vertical" style={{ width: "100%" }}>
            {taskSubtasks
              .filter((st) => !activeUserId || st.ownerUserId === activeUserId)
              .map((st, idx) => (
                <SubtaskItem
                  key={st.id}
                  subtask={st}
                  taskId={task.id}
                  activeUserId={activeUserId}
                  index={idx}
                  onUpdateSubtask={onUpdateSubtask}
                  onDeleteSubtask={onDeleteSubtask}
                  onSubtaskStepDone={onSubtaskStepDone}
                  onSubtaskStepUndone={onSubtaskStepUndone}
                  onSetSubtaskNote={onSetSubtaskNote}
                />
              ))}
            <Button
              type="dashed"
              onClick={handleAddSubtask}
            >
              + 新增子任务
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );
}
