import { Button, Input } from "antd";
import { useState, useEffect } from "react";
import { ID } from "../../../domain/types";

interface UserNoteProps {
  activeUserId?: ID;
  userNotes?: Record<string, string>;
  onNoteSave: (note: string) => Promise<void>;
  noteType: string; // 'steps' | 'subtasks'
  className?: string;
}

export default function UserNote({
  activeUserId,
  userNotes,
  onNoteSave,
  noteType,
  className = "user-note-area"
}: UserNoteProps) {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState<string>("");

  // 当activeUserId变化时，更新tempNote
  useEffect(() => {
    if (activeUserId && userNotes) {
      setTempNote(userNotes[activeUserId] || "");
    }
  }, [activeUserId, userNotes]);

  const handleNoteActivate = (noteId: string) => {
    setActiveNoteId(noteId);
    setTempNote(userNotes?.[activeUserId!] || "");
  };

  const handleNoteSave = async (note: string) => {
    if (activeUserId) {
      try {
        await onNoteSave(note);
        console.log('用户备注保存成功');
      } catch (error) {
        console.error('用户备注保存失败:', error);
      }
    }
  };

  if (!activeUserId) return null;

  return (
    <div className={className} style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: "14px", fontWeight: "500" }}>
          {noteType === 'steps' ? '步骤备注' : '子任务备注'}
        </span>
        <Button
          size="small"
          type="text"
          className="user-note-button"
          onClick={() => {
            if (activeNoteId === noteType) {
              setActiveNoteId(null);
            } else {
              setActiveNoteId(noteType);
            }
          }}
          title="添加用户备注"
        >
          📝
        </Button>
      </div>
      
      {activeNoteId === noteType ? (
        <Input.TextArea
          size="small"
          value={tempNote}
          onChange={(e) => {
            setTempNote(e.target.value);
          }}
          onBlur={async () => {
            console.log('onBlur triggered', { tempNote, activeUserId });
            await handleNoteSave(tempNote);
            setActiveNoteId(null);
          }}
          placeholder="添加用户备注..."
          rows={2}
          autoFocus={true}
        />
      ) : userNotes?.[activeUserId] ? (
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
          onClick={() => handleNoteActivate(noteType)}
        >
          {userNotes[activeUserId]}
        </div>
      ) : null}
    </div>
  );
}
