import { Button, Form, Modal, message, Upload, Space, Popover, Tooltip } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useStore } from "../../domain/store";
import type { ID, Task, Subtask } from "../../domain/types";
import { TaskType } from "../../domain/enums";
import { useNavigate } from "react-router-dom";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import { nanoid } from "../../utils/id";
import { DataExportImportService } from "../../services/DataExportImport";
import { DownloadOutlined, UploadOutlined, DatabaseOutlined } from "@ant-design/icons";
import { TaskStep } from "../../domain/types";
import ApiRequest from "../../api/Request";

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
  const { tasks, projects, users, createTask, updateTask, deleteTask, initializeData } = useStore();
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

  // 复制任务
  const handleCopyTask = (originalTask: Task) => {
    Modal.confirm({
      title: "确认复制任务",
      content: `确定要复制任务"${originalTask.name}"吗？复制将包含所有关联用户、项目、子任务和步骤信息，但会重置所有完成状态。`,
      onOk: async () => {
        try {
          await performTaskCopy(originalTask);
        } catch (error) {
          message.error(`复制失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      },
    });
  };

  // 执行任务复制
  const performTaskCopy = async (originalTask: Task) => {
    try {
      // 如果是复合任务，先获取所有子任务（包括手动添加的）
      let originalSubtasks: Subtask[] = [];
      if (originalTask.type === TaskType.COMPOSITE) {
        const subtasksRes = await ApiRequest.getSubtasksByTaskId(originalTask.id);
        if (subtasksRes.success && subtasksRes.data) {
          originalSubtasks = subtasksRes.data;
          console.log(`获取到原始任务的子任务数量: ${originalSubtasks.length}`, originalSubtasks);
        }
      }
      
      // 创建新任务ID
      const newTaskId = nanoid();
      
      // 复制任务基本信息，重置状态
      const copiedTask = {
        ...originalTask,
        id: newTaskId, // 指定新任务ID
        name: `${originalTask.name}（复制）`,
        completed: false,
        completedAt: undefined,
        completedByUsers: undefined,
        userCompletedAt: undefined,
        userNotes: undefined,
        // 复制步骤但重置完成状态
        steps: originalTask.steps.map((step: TaskStep) => ({
          ...step,
          id: nanoid(),
          doneByUserId: undefined,
          completedByUsers: undefined,
          completedAt: undefined,
          userCompletedAt: undefined,
          userNotes: undefined,
        })),
        // 复制子任务模板
        subtaskTemplates: originalTask.subtaskTemplates ? [...originalTask.subtaskTemplates] : undefined,
      };

      // 创建新任务（传入id以确保使用我们指定的ID）
      await createTask(copiedTask);
      
      // 如果是复合任务且有子任务，复制所有子任务（包括手动添加的）
      // 注意：由于 createTask 会根据模板自动生成子任务，我们需要先删除这些自动生成的子任务
      // 然后再复制所有原始子任务，这样可以确保手动添加的子任务也被复制
      if (originalTask.type === TaskType.COMPOSITE && originalSubtasks.length > 0) {
        // 删除自动生成的模板子任务（如果有的话）
        const newTaskSubtasksRes = await ApiRequest.getSubtasksByTaskId(newTaskId);
        if (newTaskSubtasksRes.success && newTaskSubtasksRes.data) {
          console.log(`删除自动生成的子任务数量: ${newTaskSubtasksRes.data.length}`);
          // 删除所有自动生成的子任务
          for (const autoSubtask of newTaskSubtasksRes.data) {
            await ApiRequest.deleteSubtask(newTaskId, autoSubtask.id);
          }
        }
        
        // 复制所有原始子任务（包括手动添加的）
        console.log(`开始复制 ${originalSubtasks.length} 个子任务...`);
        const copyResult = await ApiRequest.copySubtasks(originalTask.id, newTaskId);
        if (copyResult.success && copyResult.data) {
          console.log(`成功复制 ${copyResult.data.length} 个子任务`, copyResult.data);
        } else {
          console.error('复制子任务失败:', copyResult.error);
        }
      }
      
      // 重新加载数据以确保UI更新
      await initializeData();
      
      message.success('任务复制成功！');
    } catch (error) {
      console.error('复制任务时发生错误:', error);
      message.error(`复制失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

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
        onCopy={handleCopyTask}
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