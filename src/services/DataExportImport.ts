import { STORAGE_KEYS } from '../api/constants';
import { User, Project, Task, Appointment, Subtask, TaskStep, UserNote } from '../domain/types';

// 导出数据类型
export interface ExportData {
  version: string;
  exportTime: string;
  data: {
    users: User[];
    projects: Project[];
    tasks: Task[];
    appointments: Appointment[];
    subtasks: Subtask[];
    userNotes: UserNote[];
  };
}

// 数据导入导出服务
export class DataExportImportService {
  private static readonly EXPORT_VERSION = '1.0.0';

  /**
   * 导出所有数据到JSON文件
   */
  static async exportAllData(): Promise<void> {
    try {
      const exportData: ExportData = {
        version: this.EXPORT_VERSION,
        exportTime: new Date().toISOString(),
        data: {
          users: this.getAllData<User>(STORAGE_KEYS.USERS),
          projects: this.getAllData<Project>(STORAGE_KEYS.PROJECTS),
          tasks: this.getAllData<Task>(STORAGE_KEYS.TASKS),
          appointments: this.getAllData<Appointment>(STORAGE_KEYS.APPOINTMENTS),
          subtasks: this.getAllData<Subtask>(STORAGE_KEYS.SUBTASKS),
          userNotes: this.getAllData<UserNote>(STORAGE_KEYS.USER_NOTES),
        }
      };

      // 创建下载链接
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      // 创建下载链接并触发下载
      const link = document.createElement('a');
      link.href = url;
      link.download = `task-manage-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      throw new Error(`导出数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 从JSON文件导入数据
   */
  static async importData(file: File): Promise<void> {
    try {
      const text = await this.readFileAsText(file);
      const importData: ExportData = JSON.parse(text);

      // 验证数据格式
      this.validateImportData(importData);

      // 清空现有数据
      this.clearAllData();

      // 导入新数据
      this.setAllData(STORAGE_KEYS.USERS, importData.data.users);
      this.setAllData(STORAGE_KEYS.PROJECTS, importData.data.projects);
      this.setAllData(STORAGE_KEYS.TASKS, importData.data.tasks);
      this.setAllData(STORAGE_KEYS.APPOINTMENTS, importData.data.appointments);
      this.setAllData(STORAGE_KEYS.SUBTASKS, importData.data.subtasks);
      this.setAllData(STORAGE_KEYS.USER_NOTES, importData.data.userNotes);

    } catch (error) {
      throw new Error(`导入数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取数据统计信息
   */
  static getDataStatistics(): {
    users: number;
    projects: number;
    tasks: number;
    appointments: number;
    subtasks: number;
    userNotes: number;
    totalSize: string;
  } {
    const stats = {
      users: this.getAllData<User>(STORAGE_KEYS.USERS).length,
      projects: this.getAllData<Project>(STORAGE_KEYS.PROJECTS).length,
      tasks: this.getAllData<Task>(STORAGE_KEYS.TASKS).length,
      appointments: this.getAllData<Appointment>(STORAGE_KEYS.APPOINTMENTS).length,
      subtasks: this.getAllData<Subtask>(STORAGE_KEYS.SUBTASKS).length,
      userNotes: this.getAllData<UserNote>(STORAGE_KEYS.USER_NOTES).length,
    };

    const totalSize = this.calculateTotalSize();
    
    return {
      ...stats,
      totalSize
    };
  }

  /**
   * 从localStorage获取所有数据
   */
  private static getAllData<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn(`获取数据失败 ${key}:`, error);
      return [];
    }
  }

  /**
   * 设置所有数据到localStorage
   */
  private static setAllData<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      throw new Error(`保存数据失败 ${key}: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 清空所有数据
   */
  private static clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  /**
   * 读取文件内容
   */
  private static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('文件读取失败'));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }

  /**
   * 验证导入数据格式
   */
  private static validateImportData(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new Error('无效的数据格式');
    }

    if (!data.version || !data.exportTime || !data.data) {
      throw new Error('数据格式不完整，缺少必要字段');
    }

    if (!Array.isArray(data.data.users) ||
        !Array.isArray(data.data.projects) ||
        !Array.isArray(data.data.tasks) ||
        !Array.isArray(data.data.appointments) ||
        !Array.isArray(data.data.subtasks) ||
        !Array.isArray(data.data.userNotes)) {
      throw new Error('数据格式错误，数据字段必须是数组');
    }
  }

  /**
   * 计算数据总大小
   */
  private static calculateTotalSize(): string {
    let totalBytes = 0;
    
    Object.values(STORAGE_KEYS).forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        totalBytes += new Blob([data]).size;
      }
    });

    if (totalBytes < 1024) {
      return `${totalBytes} B`;
    } else if (totalBytes < 1024 * 1024) {
      return `${(totalBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }
}
