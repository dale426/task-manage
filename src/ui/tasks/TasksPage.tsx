import { Button, Form, Modal, message, Upload, Space, Popover, Tooltip } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useStore } from "../../domain/store";
import type { ID, Task } from "../../domain/types";
import { TaskType } from "../../domain/enums";
import { useNavigate } from "react-router-dom";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import { nanoid } from "../../utils/id";
import { DataExportImportService } from "../../services/DataExportImport";
import { DownloadOutlined, UploadOutlined, DatabaseOutlined } from "@ant-design/icons";

type TaskFormValues = {
  name: string;
  projectId?: ID;
  userIds: ID[];
  note?: string;
  type: TaskType;
  steps: { name: string; id?: string }[];
  dueAt?: dayjs.Dayjs;
  subtaskTemplates?: { name: string }[];
};

export default function TasksPage() {
  const { tasks, projects, users, createTask, updateTask, deleteTask } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form] = Form.useForm<TaskFormValues>();
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [dataStats, setDataStats] = useState<any>(null);
  const navigate = useNavigate();

  const rows = useMemo(() => {
    // Sort: incomplete tasks by deadline proximity, completed tasks last
    return [...tasks].sort((a, b) => {
      // Completed tasks go to the end
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;

      // Within same completion status, sort by deadline
      if (!a.dueAt && !b.dueAt) return 0;
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    });
  }, [tasks]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name,
        projectId: values.projectId,
        userIds: values.userIds,
        note: values.note,
        type: values.type,
        steps: (values.steps || []).map((s) => ({
          id: s.id || nanoid(),
          name: s.name,
        })),
        dueAt: values.dueAt?.toISOString(),
        subtaskTemplates:
          values.type === TaskType.COMPOSITE
            ? (values.subtaskTemplates || [])
                .map((x) => x?.name?.trim())
                .filter(Boolean)
            : undefined,
      } as Omit<Task, "id" | "completed" | "subtasks">;
      
      if (editing) {
        await updateTask(editing.id, payload);
        message.success('任务更新成功');
      } else {
        await createTask(payload);
        message.success('任务创建成功');
      }
      setOpen(false);
    } catch (error) {
      console.error('任务操作失败:', error);
      message.error('操作失败，请重试');
    }
  };

  const handleEdit = (task: Task) => {
    setEditing(task);
    form.setFieldsValue({
      name: task.name,
      projectId: task.projectId,
      userIds: task.userIds,
      note: task.note,
      type: task.type,
      steps: task.steps.map((s) => ({
        id: s.id,
        name: s.name,
      })),
      dueAt: task.dueAt ? dayjs(task.dueAt) : undefined,
      subtaskTemplates: (task.subtaskTemplates || []).map((name) => ({ name })),
    });
    setOpen(true);
  };

  const handleDelete = (taskId: ID) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这个任务吗？",
      onOk: () => {
        deleteTask(taskId);
        message.success("任务已删除");
      },
    });
  };

  // 导出数据
  const handleExport = async () => {
    try {
      await DataExportImportService.exportAllData();
      message.success('数据导出成功！');
    } catch (error) {
      message.error(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 导入数据
  const handleImport = async (file: File) => {
    try {
      await DataExportImportService.importData(file);
      message.success('数据导入成功！页面将刷新以加载新数据。');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      message.error(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
    setImportModalVisible(false);
    return false; // 阻止默认上传行为
  };

  // 显示数据统计
  const showDataStats = () => {
    const stats = DataExportImportService.getDataStatistics();
    setDataStats(stats);
  };

  // 数据统计弹窗内容
  const dataStatsContent = dataStats ? (
    <div style={{ minWidth: 200 }}>
      <div style={{ marginBottom: 8, fontWeight: 'bold' }}>数据统计</div>
      <div>用户: {dataStats.users} 个</div>
      <div>项目: {dataStats.projects} 个</div>
      <div>任务: {dataStats.tasks} 个</div>
      <div>预约: {dataStats.appointments} 个</div>
      <div>子任务: {dataStats.subtasks} 个</div>
      <div>备注: {dataStats.userNotes} 个</div>
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
        总大小: {dataStats.totalSize}
      </div>
    </div>
  ) : null;

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          type="primary"
          onClick={() => {
            setEditing(null);
            form.resetFields();
            form.setFieldsValue({ type: TaskType.SINGLE, userIds: [], steps: [] });
            setOpen(true);
          }}
        >
          新增任务
        </Button>
        
        <Space>
          <Popover content={dataStatsContent} title="数据统计" trigger="click">
            <Tooltip title="数据统计">
              <Button 
                type="text" 
                icon={<DatabaseOutlined />}
                onClick={showDataStats}
              />
            </Tooltip>
          </Popover>
          <Tooltip title="导出数据">
            <Button 
              type="text" 
              icon={<DownloadOutlined/>}
              onClick={() => setImportModalVisible(true)}
            />
          </Tooltip>
          <Tooltip title="导入数据">
          <Button 
              type="text" 
              icon={<UploadOutlined />}
              onClick={handleExport}
            />
          </Tooltip>
        </Space>
      </div>

      <TaskList
        tasks={rows}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onNavigate={navigate}
      />

      <Modal
        open={open}
        title={editing ? "编辑任务" : "新增任务"}
        width={720}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
      >
        <TaskForm
          form={form}
          editing={editing}
          onCancel={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>

      {/* 导入数据模态框 */}
      <Modal
        title="导入数据"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
        width={500}
      >
        <div style={{ padding: '20px 0' }}>
          <div style={{ marginBottom: 16, color: '#666' }}>
            请选择要导入的数据文件（JSON格式）。导入将完全覆盖当前所有数据，请谨慎操作！
          </div>
          <Upload.Dragger
            accept=".json"
            beforeUpload={handleImport}
            showUploadList={false}
            style={{ marginBottom: 16 }}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持单个JSON文件，文件大小不超过10MB
            </p>
          </Upload.Dragger>
          <div style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
            支持从其他设备导出的数据文件
          </div>
        </div>
      </Modal>
    </div>
  );
}