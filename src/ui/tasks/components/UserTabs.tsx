import { Tabs } from "antd";
import { ID, User } from "../../../domain/types";

interface UserTabsProps {
  userIds: ID[];
  users: User[];
  activeUserId?: ID;
  onUserChange: (userId: ID) => void;
  getUserCompletionStatus?: (userId: ID) => boolean;
  getUserIncompleteCount?: (userId: ID) => number;
}

export default function UserTabs({
  userIds,
  users,
  activeUserId,
  onUserChange,
  getUserCompletionStatus,
  getUserIncompleteCount,
}: UserTabsProps) {
  if (userIds.length === 0) return null;

  const items = userIds.map((uid) => {
    const uname = users.find((u) => u.id === uid)?.nickname ?? "未知";
    const isCompleted = getUserCompletionStatus?.(uid) || false;
    const incompleteCount = getUserIncompleteCount?.(uid) || 0;
    
    return {
      key: uid,
      label: (
        <span style={{ position: "relative", display: "flex", alignItems: "center", gap: "4px" }}>
          <span>{uname}</span>
          {isCompleted ? (
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
