import { Empty } from "antd";
import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../../domain/store";
import type { ID, Task, Subtask } from "../../domain/types";
import { TaskType } from "../../domain/enums";
import TaskHeader from "./components/TaskHeader";
import TaskSteps from "./components/TaskSteps";
import SubtaskList from "./components/SubtaskList";

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { 
    tasks, 
    subtasks, 
    users, 
    projects, 
    setStepDone, 
    setStepUndone, 
    updateTask, 
    setTaskCompletedByUser, 
    setTaskUserNote, 
    updateSubtask, 
    addSubtask, 
    setSubtaskStepDone, 
    setSubtaskStepUndone,
    deleteSubtask
  } = useStore();

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

  // 确保单用户任务的activeUserId正确设置
  useEffect(() => {
    if (task && task.userIds.length === 1 && !activeUserId) {
      setActiveUserId(task.userIds[0]);
    }
  }, [task, activeUserId]);

  // 处理用户备注保存
  const handleUserNoteSave = async (note: string) => {
    if (activeUserId && task) {
      try {
        await setTaskUserNote(task.id, activeUserId, note);
      } catch (error) {
        console.error('用户备注保存失败:', error);
      }
    }
  };

  // 处理子任务备注设置
  const handleSetSubtaskNote = (taskId: string, subtaskId: string, note: string) => {
    updateSubtask(taskId, subtaskId, { note });
  };

  // 处理子任务删除
  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    deleteSubtask(taskId, subtaskId);
  };

  if (!task) return <Empty description="任务不存在" />;

  return (
    <div>
      <TaskHeader
        task={task}
        projects={projects}
        onTaskUpdate={updateTask}
        onNavigateBack={() => navigate(-1)}
      />

      <div style={{ marginTop: 12 }}>
        {task.type === TaskType.SINGLE ? (
          <TaskSteps
            task={task}
            users={users}
            activeUserId={activeUserId}
            onUserChange={setActiveUserId}
            onStepDone={setStepDone}
            onStepUndone={setStepUndone}
            onTaskUpdate={updateTask}
            onUserNoteSave={handleUserNoteSave}
          />
        ) : (
          <SubtaskList
            task={task}
            taskSubtasks={taskSubtasks}
            users={users}
            activeUserId={activeUserId}
            onUserChange={setActiveUserId}
            onAddSubtask={async (taskId, data) => await addSubtask(taskId, data)}
            onUpdateSubtask={updateSubtask}
            onDeleteSubtask={handleDeleteSubtask}
            onSubtaskStepDone={setSubtaskStepDone}
            onSubtaskStepUndone={setSubtaskStepUndone}
            onSetSubtaskNote={handleSetSubtaskNote}
            onUserNoteSave={handleUserNoteSave}
          />
        )}
      </div>
    </div>
  );
}
