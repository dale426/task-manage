import { useState, useMemo } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Space,
  Table,
  message,
  Tag,
  Typography,
  Grid,
  Checkbox,
} from "antd";
import MobileSelect from "../components/MobileSelect";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  DownOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useStore } from "../../domain/store";
import type { ID, Appointment } from "../../domain/types";
import { UserLevel, UserLevelOrder, UserLevelLabels } from "../../domain/enums";
import dayjs from "dayjs";
import MobileDateTimePicker from "../components/MobileDateTimePicker";

const { Text } = Typography;

export default function AppointmentsPage() {
  const {
    appointments,
    users,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    markAppointmentCompleted,
  } = useStore();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<ID>>(new Set());

  const toggleCardExpansion = (appointmentId: ID) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appointmentId)) {
        newSet.delete(appointmentId);
      } else {
        newSet.add(appointmentId);
      }
      return newSet;
    });
  };
  const [form] = Form.useForm<{
    title: string;
    content: string;
    userIds: ID[];
    startTime: dayjs.Dayjs;
    endTime: dayjs.Dayjs;
  }>();

  const rows = useMemo(() => {
    // Sort: completed appointments last, others by proximity to start time
    return [...(appointments ?? [])].sort((a, b) => {
      // Completed appointments go to the end
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;

      // Within same completion status, sort by start time proximity
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();
      return timeA - timeB;
    });
  }, [appointments]);

  // 计算预约提醒状态
  const getAppointmentStatus = (appointment: Appointment) => {
    const now = dayjs();
    const start = dayjs(appointment.startTime);
    const end = dayjs(appointment.endTime);
    
    if (appointment.completed) {
      return "completed";
    }
    
    if (now.isAfter(end)) {
      return "ended";
    }
    
    if (now.isAfter(start)) {
      return "started";
    }
    
    return "pending";
  };

  // 格式化时间距离
  const formatTimeRemaining = (appointment: Appointment) => {
    const now = dayjs();
    const start = dayjs(appointment.startTime);
    const end = dayjs(appointment.endTime);
    const status = getAppointmentStatus(appointment);
    
    if (status === "completed") {
      return "已完成";
    }
    
    if (status === "ended") {
      return "已结束";
    }
    
    if (status === "started") {
      // 已开始，显示距离结束时间
      const diff = end.diff(now);
      if (diff < 0) {
        return "已结束";
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        return `距离结束: ${days}天${hours}小时${minutes}分钟`;
      } else if (hours > 0) {
        return `距离结束: ${hours}小时${minutes}分钟`;
      } else {
        return `距离结束: ${minutes}分钟`;
      }
    }
    
    // pending状态，显示距离开始时间
    const diff = start.diff(now);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `距离开始: ${days}天${hours}小时${minutes}分钟`;
    } else if (hours > 0) {
      return `距离开始: ${hours}小时${minutes}分钟`;
    } else {
      return `距离开始: ${minutes}分钟`;
    }
  };


  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        title: values.title,
        content: values.content,
        userIds: values.userIds,
        startTime: values.startTime.toISOString(),
        endTime: values.endTime.toISOString(),
      };

      if (editing) {
        await updateAppointment(editing.id, data);
        message.success("预约提醒已更新");
      } else {
        await createAppointment(data);
        message.success("预约提醒已创建");
      }

      setOpen(false);
      setEditing(null);
      form.resetFields();
    } catch (error) {
      console.error("Form validation failed:", error);
    }
  };

  const handleEdit = (record: Appointment) => {
    setEditing(record);
    form.setFieldsValue({
      title: record.title,
      content: record.content,
      userIds: record.userIds,
      startTime: dayjs(record.startTime),
      endTime: dayjs(record.endTime),
    });
    setOpen(true);
  };

  const handleDelete = (id: ID) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这个预约提醒吗？",
      onOk: async () => {
        try {
          await deleteAppointment(id);
          message.success("预约提醒已删除");
        } catch (error) {
          console.error("删除失败:", error);
          message.error("删除失败，请重试");
        }
      },
    });
  };

  const columns = [
    {
      title: "提醒事项",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "具体内容",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
    },
    {
      title: "提醒用户",
      dataIndex: "userIds",
      key: "userIds",
      render: (userIds: ID[]) => {
        const userNames = userIds.map(
          (id) => users.find((u) => u.id === id)?.nickname || "未知"
        );
        return userNames.join(", ");
      },
    },
    {
      title: "开始时间",
      dataIndex: "startTime",
      key: "startTime",
      render: (time: string) => dayjs(time).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "结束时间",
      dataIndex: "endTime",
      key: "endTime",
      render: (time: string) => dayjs(time).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "时间状态",
      dataIndex: "startTime",
      key: "timeRemaining",
      render: (time: string, record: Appointment) => {
        const remaining = formatTimeRemaining(record);
        const status = getAppointmentStatus(record);
        const isOverdue = status === "ended" && !record.completed;
        return <Tag color={isOverdue ? "red" : "blue"}>{remaining}</Tag>;
      },
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (_: any, record: Appointment) => {
        const status = getAppointmentStatus(record);
        const statusMap = {
          pending: { color: "orange", text: "未开始" },
          started: { color: "blue", text: "已开始" },
          completed: { color: "green", text: "已完成" },
          ended: { color: "red", text: "已结束" }
        };
        const statusInfo = statusMap[status];
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: "完成时间",
      dataIndex: "completedAt",
      key: "completedAt",
      render: (completedAt: string, record: Appointment) => {
        if (record.completed && completedAt) {
          return <Text style={{ color: "#52c41a" }}>
            {dayjs(completedAt).format("YYYY-MM-DD HH:mm")}
          </Text>;
        }
        return "-";
      },
    },
    {
      title: "操作",
      key: "actions",
      render: (_: any, record: Appointment) => (
        <Space>
          {!record.completed && (
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => {
                markAppointmentCompleted(record.id);
                message.success("预约提醒已标记完成");
              }}
            >
              标记完成
            </Button>
          )}
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const screens = Grid.useBreakpoint();

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null);
            form.resetFields();
            setOpen(true);
          }}
        >
          新增预约提醒
        </Button>
      </div>

      {screens.lg ? (
        <Table
          columns={columns}
          dataSource={rows}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ) : (
        <Space direction="vertical" style={{ width: "100%" }}>
          {rows.map((appointment) => {
            const status = getAppointmentStatus(appointment);
            const statusMap = {
              pending: { color: "orange", text: "未开始" },
              started: { color: "blue", text: "已开始" },
              completed: { color: "green", text: "已完成" },
              ended: { color: "red", text: "已结束" }
            };
            const statusInfo = statusMap[status];
            const userNames = appointment.userIds.map(
              (id) => users.find((u) => u.id === id)?.nickname || "未知"
            );
            const remaining = formatTimeRemaining(appointment);
            const isOverdue = status === "ended" && !appointment.completed;

            const isCompleted = status === "completed";
            const isExpanded = expandedCards.has(appointment.id);
            const shouldCollapse = isCompleted && !isExpanded;
            
            return (
              <Card
                key={appointment.id}
                size="small"
                title={
                  <div 
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: isCompleted ? "pointer" : "default"
                    }}
                    onClick={isCompleted ? () => toggleCardExpansion(appointment.id) : undefined}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {isCompleted && (
                        <span>
                          {isExpanded ? <DownOutlined /> : <RightOutlined />}
                        </span>
                      )}
                      <span>{appointment.title}</span>
                    </div>
                    <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                  </div>
                }
                style={{
                  opacity: isCompleted ? 0.6 : 1,
                  transition: "opacity 0.3s ease"
                }}
                bodyStyle={{
                  display: shouldCollapse ? "none" : "block"
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <Text strong>内容：</Text>
                  <Text>{appointment.content}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>提醒用户：</Text>
                  <Text>{userNames.join(", ")}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>开始时间：</Text>
                  <Text>
                    {dayjs(appointment.startTime).format("YYYY-MM-DD HH:mm")}
                  </Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>结束时间：</Text>
                  <Text>
                    {dayjs(appointment.endTime).format("YYYY-MM-DD HH:mm")}
                  </Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>时间状态：</Text>
                  <Tag color={isOverdue ? "red" : "blue"}>{remaining}</Tag>
                </div>
                {appointment.completed && appointment.completedAt && (
                  <div style={{ marginBottom: 8 }}>
                    <Text strong>完成时间：</Text>
                    <Text style={{ color: "#52c41a" }}>
                      {dayjs(appointment.completedAt).format("YYYY-MM-DD HH:mm")}
                    </Text>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: 8,
                    borderTop: "1px solid #f0f0f0",
                  }}
                >
                  <Space>
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(appointment)}
                    >
                      编辑
                    </Button>
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(appointment.id)}
                    >
                      删除
                    </Button>
                  </Space>
                  <Button
                    size="small"
                    type={appointment.completed ? "default" : "primary"}
                    icon={<CheckOutlined />}
                    disabled={appointment.completed}
                    onClick={() => {
                      if (appointment.completed) {
                        // Cancel completion
                        updateAppointment(appointment.id, {
                          completed: false,
                          status: "pending",
                        });
                        message.success("已取消完成标记");
                      } else {
                        // Mark as completed
                        markAppointmentCompleted(appointment.id);
                        message.success("预约提醒已标记完成");
                      }
                    }}
                  >
                    {appointment.completed ? "已完成" : "标记完成"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </Space>
      )}

      <Modal
        title={editing ? "编辑预约提醒" : "新增预约提醒"}
        open={open}
        onOk={handleSubmit}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        width={screens.lg ? 600 : "95%"}
        style={{ top: screens.lg ? undefined : 20 }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="提醒事项"
            rules={[{ required: true, message: "请输入提醒事项" }]}
          >
            <Input placeholder="例如：项目评审会议" />
          </Form.Item>

          <Form.Item
            name="content"
            label="具体内容"
            rules={[{ required: true, message: "请输入具体内容" }]}
          >
            <Input.TextArea rows={3} placeholder="详细描述提醒内容..." />
          </Form.Item>

          <Form.Item
            name="userIds"
            label="提醒用户"
            rules={[{ required: true, message: "请选择提醒用户" }]}
          >
            <MobileSelect
              mode="multiple"
              placeholder="选择用户"
              options={users
                .sort((a, b) => {
                  const levelA = UserLevelOrder[a.level || UserLevel.LEVEL_3];
                  const levelB = UserLevelOrder[b.level || UserLevel.LEVEL_3];
                  return levelA - levelB;
                })
                .map((u) => {
                  const level = u.level || UserLevel.LEVEL_3;
                  const levelColor = level === UserLevel.LEVEL_1 ? "red" : level === UserLevel.LEVEL_2 ? "orange" : "blue";
                  return { 
                    value: u.id, 
                    label: u.nickname,
                    tag: {
                      text: UserLevelLabels[level],
                      color: levelColor
                    }
                  };
                })}
            />
          </Form.Item>

          <Form.Item
            name="startTime"
            label="开始时间"
            rules={[{ required: true, message: "请选择开始时间" }]}
          >
            <MobileDateTimePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="endTime"
            label="结束时间"
            rules={[{ required: true, message: "请选择结束时间" }]}
          >
            <MobileDateTimePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
