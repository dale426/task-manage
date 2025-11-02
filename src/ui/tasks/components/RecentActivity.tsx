import { Card, List, Space, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { Task, Subtask, User, TaskStep } from "../../../domain/types";
import { TaskType } from "../../../domain/enums";

const { Text } = Typography;

interface ActivityItem {
  id: string;
  type: 'task_step' | 'subtask_step' | 'task_completion' | 'subtask_completion';
  userId: string;
  userName: string;
  stepName?: string;
  subtaskName?: string;
  completedAt: string;
  taskType: 'single' | 'composite';
}

interface RecentActivityProps {
  task: Task;
  taskSubtasks: Subtask[];
  users: User[];
}

export default function RecentActivity({ task, taskSubtasks, users }: RecentActivityProps) {
  const [displayCount, setDisplayCount] = useState(3); // 初始显示3条

  // 获取用户名称的辅助函数
  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.nickname || '未知用户';
  };

  // 收集所有活动记录
  const collectActivities = (): ActivityItem[] => {
    const activities: ActivityItem[] = [];

    // 处理单例任务的步骤完成记录
    if (task.type === TaskType.SINGLE) {
      task.steps.forEach(step => {
        if (step.completedByUsers && step.completedByUsers.length > 0) {
          step.completedByUsers.forEach(userId => {
            const completedAt = step.userCompletedAt?.[userId] || step.completedAt;
            if (completedAt) {
              activities.push({
                id: `${step.id}-${userId}`,
                type: 'task_step',
                userId,
                userName: getUserName(userId),
                stepName: step.name,
                completedAt,
                taskType: 'single'
              });
            }
          });
        }
      });
    }

    // 处理复合任务的子任务步骤完成记录
    if (task.type === TaskType.COMPOSITE) {
      taskSubtasks.forEach(subtask => {
        // 子任务步骤完成记录（优先显示步骤完成，因为更具体）
        subtask.steps.forEach(step => {
          if (step.completedByUsers && step.completedByUsers.length > 0) {
            step.completedByUsers.forEach(userId => {
              const completedAt = step.userCompletedAt?.[userId] || step.completedAt;
              if (completedAt) {
                activities.push({
                  id: `${subtask.id}-${step.id}-${userId}`,
                  type: 'subtask_step',
                  userId,
                  userName: getUserName(userId),
                  stepName: step.name,
                  subtaskName: subtask.name,
                  completedAt,
                  taskType: 'composite'
                });
              }
            });
          }
        });

        // 子任务完成记录（如果没有步骤或步骤都完成了）
        if (subtask.completed && subtask.completedAt && subtask.steps.length === 0) {
          activities.push({
            id: `subtask-${subtask.id}`,
            type: 'subtask_completion',
            userId: subtask.ownerUserId,
            userName: getUserName(subtask.ownerUserId),
            subtaskName: subtask.name,
            completedAt: subtask.completedAt,
            taskType: 'composite'
          });
        }
      });
    }

    // 按时间倒序排序，返回所有记录
    return activities
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  };

  const allActivities = collectActivities();
  const activities = allActivities.slice(0, displayCount); // 根据displayCount显示对应数量的记录
  const hasMore = displayCount < allActivities.length; // 是否还有更多记录

  if (activities.length === 0) {
    return null;
  }

  const renderActivityItem = (activity: ActivityItem) => {
    const completedAt = dayjs(activity.completedAt);
    const timeStr = completedAt.format("MM-DD HH:mm");
    const isToday = completedAt.isSame(dayjs(), 'day');
    
    if (activity.taskType === 'single') {
      // 单例任务：用户 + 步骤名称 + 时间
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Text style={{ fontSize: '12px', color: '#1890ff', fontWeight: 500 }}>
              {activity.userName}
            </Text>
            <Text strong style={{ fontSize: '12px' }}>
              {activity.stepName}
            </Text>
          </div>
          <Text style={{ 
            fontSize: '11px', 
            color: isToday ? '#52c41a' : '#999'
          }}>
            {timeStr}
          </Text>
        </div>
      );
    } else {
      // 复合任务：用户名 + 子任务名称 (步骤名) + 时间
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Text style={{ fontSize: '12px', color: '#722ed1', fontWeight: 500 }}>
              {activity.userName}
            </Text>
            <Text strong style={{ fontSize: '12px' }}>
              {activity.subtaskName}
              {activity.stepName && (
                <Text style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>
                  {' '}({activity.stepName})
                </Text>
              )}
            </Text>
          </div>
          <Text style={{ 
            fontSize: '11px', 
            color: isToday ? '#52c41a' : '#999'
          }}>
            {timeStr}
          </Text>
        </div>
      );
    }
  };

  const handleLoadMore = () => {
    // 如果当前显示3条，点击后显示10条；否则每次增加10条
    if (displayCount === 3) {
      setDisplayCount(Math.min(10, allActivities.length));
    } else {
      setDisplayCount(prev => Math.min(prev + 10, allActivities.length));
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ 
        border: '1px solid #f0f0f0', 
        borderRadius: '4px',
        backgroundColor: 'transparent'
      }}>
        {activities.map((activity, index) => (
          <div 
            key={activity.id}
            style={{ 
              padding: '1px 12px', 
              borderBottom: index < activities.length - 1 ? '1px solid #f5f5f5' : 'none',
              lineHeight: '1'
            }}
          >
            {renderActivityItem(activity)}
          </div>
        ))}
        {/* 查看更多按钮 */}
        {allActivities.length > 0 && (
          <div style={{ 
            padding: '0px 12px', 
            textAlign: 'center',
            borderTop: activities.length > 0 ? '1px solid #f5f5f5' : 'none'
          }}>
            {hasMore ? (
              <Text
                onClick={handleLoadMore}
                style={{
                  fontSize: '12px',
                  color: '#1890ff',
                  cursor: 'pointer',
                  padding: '0',
                  lineHeight: '1',
                }}
              >
                查看更多
              </Text>
            ) : allActivities.length > 3 ? (
              <Text
                style={{
                  fontSize: '12px',
                  color: '#999',
                  padding: '0',
                  lineHeight: '1.5',
                }}
              >
                没有更多了
              </Text>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
