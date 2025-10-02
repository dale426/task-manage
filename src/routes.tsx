import { createElement, lazy, Suspense } from "react";
import { RouteObject } from "react-router-dom";
import { Spin } from "antd";
import RootLayout from "./ui/RootLayout";

// 使用更安全的懒加载方式，添加错误处理
const createLazyComponent = (importFunc: () => Promise<any>) => {
  return lazy(() => importFunc().catch(err => {
    console.error('Dynamic import failed:', err);
    // 返回一个错误页面组件
    return { default: () => createElement('div', { style: { padding: '20px', textAlign: 'center' } }, 'Page loading failed. Please refresh.') };
  }));
};

const TasksPage = createLazyComponent(() => import("./ui/tasks/TasksPage"));
const TaskDetailPage = createLazyComponent(() => import("./ui/tasks/TaskDetailPage"));
const ProjectsPage = createLazyComponent(() => import("./ui/projects/ProjectsPage"));
const UsersPage = createLazyComponent(() => import("./ui/users/UsersPage"));
const AppointmentsPage = createLazyComponent(() => import("./ui/appointments/AppointmentsPage"));

// 加载中组件
const LoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '200px' 
  }}>
    <Spin size="large" />
  </div>
);

const routes: RouteObject[] = [
  {
    path: "/",
    element: createElement(RootLayout),
    children: [
      { 
        index: true, 
        element: createElement(Suspense, { fallback: createElement(LoadingSpinner) }, createElement(TasksPage))
      },
      { 
        path: "projects", 
        element: createElement(Suspense, { fallback: createElement(LoadingSpinner) }, createElement(ProjectsPage))
      },
      { 
        path: "users", 
        element: createElement(Suspense, { fallback: createElement(LoadingSpinner) }, createElement(UsersPage))
      },
      { 
        path: "tasks", 
        element: createElement(Suspense, { fallback: createElement(LoadingSpinner) }, createElement(TasksPage))
      },
      { 
        path: "tasks/:taskId", 
        element: createElement(Suspense, { fallback: createElement(LoadingSpinner) }, createElement(TaskDetailPage))
      },
      { 
        path: "appointments", 
        element: createElement(Suspense, { fallback: createElement(LoadingSpinner) }, createElement(AppointmentsPage))
      },
    ],
  },
];

export default routes;
