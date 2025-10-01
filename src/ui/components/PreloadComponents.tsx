import { useEffect } from 'react';

// 预加载关键组件
export function PreloadComponents() {
  useEffect(() => {
    // 预加载任务相关组件
    import('../tasks/TasksPage');
    import('../tasks/components/TaskForm');
    import('../tasks/components/TaskList');
    
    // 预加载其他页面组件（延迟加载，不阻塞首屏）
    const timer = setTimeout(() => {
      import('../projects/ProjectsPage');
      import('../users/UsersPage');
      import('../appointments/AppointmentsPage');
    }, 2000); // 2秒后预加载其他页面

    return () => clearTimeout(timer);
  }, []);

  return null;
}
