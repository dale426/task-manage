import { createElement, lazy, Suspense } from "react";
import { RouteObject } from "react-router-dom";
import { Spin } from "antd";
import RootLayout from "./ui/RootLayout";

// 懒加载页面组件
const TasksPage = lazy(() => import("./ui/tasks/TasksPage"));
const TaskDetailPage = lazy(() => import("./ui/tasks/TaskDetailPage"));
const ProjectsPage = lazy(() => import("./ui/projects/ProjectsPage"));
const UsersPage = lazy(() => import("./ui/users/UsersPage"));
const AppointmentsPage = lazy(() => import("./ui/appointments/AppointmentsPage"));

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
