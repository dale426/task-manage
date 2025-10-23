import { Button, Card, Input, Space, message } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { Subtask, ID } from "../../../domain/types";
import { colors } from "../../../utils/randomColor";
import CustomCheckbox from "../../components/CustomCheckbox";

interface SubtaskItemProps {
  subtask: Subtask;
  taskId: string;
  activeUserId?: ID;
  index: number;
  onUpdateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => Promise<void>;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  onSubtaskStepDone: (taskId: string, subtaskId: string, stepId: string, userId: ID) => Promise<void>;
  onSubtaskStepUndone: (taskId: string, subtaskId: string, stepId: string, userId: ID) => Promise<void>;
  onSetSubtaskNote: (taskId: string, subtaskId: string, note: string) => void;
}

export default function SubtaskItem({
  subtask,
  taskId,
  activeUserId,
  index,
  onUpdateSubtask,
  onDeleteSubtask,
  onSubtaskStepDone,
  onSubtaskStepUndone,
  onSetSubtaskNote,
}: SubtaskItemProps) {
  const [editingSubtaskId, setEditingSubtaskId] = useState<ID | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [activeNoteSubtaskId, setActiveNoteSubtaskId] = useState<ID | null>(null);

  const currentColor = colors[index % colors.length];

  const handleSubtaskComplete = async (completed: boolean) => {
    try {
      await onUpdateSubtask(taskId, subtask.id, { completed });
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败，请重试');
    }
  };

  const handleStepComplete = async (stepId: string, completed: boolean) => {
    try {
      if (activeUserId) {
        if (completed) {
          await onSubtaskStepDone(taskId, subtask.id, stepId, activeUserId);
        } else {
          await onSubtaskStepUndone(taskId, subtask.id, stepId, activeUserId);
        }
      }
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败，请重试');
    }
  };

  return (
    <Card
      key={subtask.id}
      size="small"
      className={subtask.completed ? "completed-subtask-card" : "processing-subtask-card"}
      style={{
        border: `1px solid ${subtask.completed ? "#999" : "#555"}`,
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
        opacity: subtask.completed ? 0.6 : 1,
        transition: "opacity 0.2s ease",
        position: "relative",
      }}
      styles={{
        header: {
          borderLeft: `8px solid`,
          borderLeftColor: !subtask.completed ? currentColor : "#fff",
        },
        body: {
          borderLeft: `8px solid`,
          borderLeftColor: !subtask.completed ? currentColor : "#fff",
          padding: 8
        }
      }}
      title={
        editingSubtaskId === subtask.id ? (
          <Input
            size="small"
            value={editingName}
            autoFocus
            onChange={(e) => setEditingName(e.target.value)}
            onPressEnter={async () => {
              try {
                await onUpdateSubtask(taskId, subtask.id, { 
                  name: editingName.trim() || subtask.name 
                });
                setEditingSubtaskId(null);
              } catch (error) {
                console.error('更新失败:', error);
                message.error('更新失败，请重试');
              }
            }}
            onBlur={async () => {
              try {
                await onUpdateSubtask(taskId, subtask.id, { 
                  name: editingName.trim() || subtask.name 
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
            <span style={subtask.completed ? { textDecoration: "line-through" } : {}}>
              {subtask.name}
            </span>
            {subtask.completed && (
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
              setEditingSubtaskId(subtask.id);
              setEditingName(subtask.name);
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
              if (activeNoteSubtaskId === subtask.id) {
                setActiveNoteSubtaskId(null);
              } else {
                setActiveNoteSubtaskId(subtask.id);
                if (subtask.note === undefined || subtask.note === null) {
                  onSetSubtaskNote(taskId, subtask.id, "");
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
            onClick={() => onDeleteSubtask(taskId, subtask.id)}
            title="删除"
          >
            🗑
          </Button>
        </Space>
      }
    >
      {subtask.steps.length > 0 ? (
        // 有步骤的子任务
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {subtask.steps.map((sp, stepIndex) => {
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
                onClick={() => handleStepComplete(sp.id, !isCompleted)}
              >
                <div style={{ minWidth: "16px", textAlign: "center", fontSize: "12px" }}>
                  {stepIndex + 1}
                </div>
                <CustomCheckbox
                  checked={isCompleted}
                  onChange={(checked) => handleStepComplete(sp.id, checked)}
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
            backgroundColor: subtask.completed ? "#f6ffed" : "#fff",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onClick={() => handleSubtaskComplete(!subtask.completed)}
        >
          <CustomCheckbox
            checked={subtask.completed}
            onChange={(checked) => handleSubtaskComplete(checked)}
            color={currentColor}
          />
          <span style={{ flex: 1, fontSize: "14px" }}>
            标记为{subtask.completed ? "未完成" : "完成"}
          </span>
          {subtask.completed && subtask.completedAt && (
            <span style={{ fontSize: "12px", color: "#666" }}>
              完成于 {dayjs(subtask.completedAt).format("MM-DD HH:mm")}
            </span>
          )}
        </div>
      )}
      
      {/* 备注区域 */}
      {(activeNoteSubtaskId === subtask.id || (subtask.note && subtask.note.trim() !== "")) && (
        <div className="subtask-note-area" style={{ marginTop: 4 }}>
          {activeNoteSubtaskId === subtask.id ? (
            // 编辑态：显示输入框
            <Input.TextArea
              size="small"
              value={subtask.note || ""}
              onChange={(e) => {
                onSetSubtaskNote(taskId, subtask.id, e.target.value);
              }}
              onBlur={(e) => {
                // 如果内容为空，则移除备注字段并取消激活
                if (!e.target.value.trim()) {
                  onSetSubtaskNote(taskId, subtask.id, "");
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
              onClick={() => setActiveNoteSubtaskId(subtask.id)}
            >
              {subtask.note}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
