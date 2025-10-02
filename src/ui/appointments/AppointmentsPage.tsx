import { useState, useMemo } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  message,
  Tag,
  Typography,
  Grid,
  Checkbox,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useStore } from "../../domain/store";
import type { ID, Appointment } from "../../domain/types";
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
  const [form] = Form.useForm<{
    title: string;
    content: string;
    userIds: ID[];
    startTime: dayjs.Dayjs;
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

  const formatTimeRemaining = (startTime: string) => {
    const now = dayjs();
    const start = dayjs(startTime);
    const diff = start.diff(now);

    if (diff < 0) {
      return "已过期";
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}天${hours}小时${minutes}分钟`;
    } else if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  };

  const getAppointmentStatus = (appointment: Appointment) => {
    const now = dayjs();
    const start = dayjs(appointment.startTime);

    if (appointment.completed) {
      return { status: "completed", text: "已完成", color: "green" };
    }

    if (start.isBefore(now)) {
      return { status: "started", text: "已开始", color: "blue" };
    }

    return { status: "pending", text: "待开始", color: "orange" };
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        title: values.title,
        content: values.content,
        userIds: values.userIds,
        startTime: values.startTime.toISOString(),
      };

      if (editing) {
        updateAppointment(editing.id, data);
        message.success("预约提醒已更新");
      } else {
        createAppointment(data);
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
    });
    setOpen(true);
  };

  const handleDelete = (id: ID) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这个预约提醒吗？",
      onOk: () => {
        deleteAppointment(id);
        message.success("预约提醒已删除");
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
      title: "距离开始时间",
      dataIndex: "startTime",
      key: "timeRemaining",
      render: (time: string) => {
        const remaining = formatTimeRemaining(time);
        const isOverdue = remaining === "已过期";
        return <Tag color={isOverdue ? "red" : "blue"}>{remaining}</Tag>;
      },
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (_: any, record: Appointment) => {
        const statusInfo = getAppointmentStatus(record);
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
            const statusInfo = getAppointmentStatus(appointment);
            const userNames = appointment.userIds.map(
              (id) => users.find((u) => u.id === id)?.nickname || "未知"
            );
            const remaining = formatTimeRemaining(appointment.startTime);
            const isOverdue = remaining === "已过期";

            return (
              <Card
                key={appointment.id}
                size="small"
                title={appointment.title}
                extra={<Tag color={statusInfo.color}>{statusInfo.text}</Tag>}
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
                  <Text strong>距离开始：</Text>
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
            <Select
              mode="multiple"
              placeholder="选择用户"
              options={users.map((u) => ({ value: u.id, label: u.nickname }))}
            />
          </Form.Item>

          <Form.Item
            name="startTime"
            label="开始时间"
            rules={[{ required: true, message: "请选择开始时间" }]}
          >
            <MobileDateTimePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
