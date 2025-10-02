import { RouteObject } from "react-router-dom";
import RootLayout from "./ui/RootLayout";
import TasksPage from "./ui/tasks/TasksPage";
import TaskDetailPage from "./ui/tasks/TaskDetailPage";
import ProjectsPage from "./ui/projects/ProjectsPage";
import UsersPage from "./ui/users/UsersPage";
import AppointmentsPage from "./ui/appointments/AppointmentsPage";

// 静态路由配置，不使用懒加载
const routes: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { 
        index: true, 
        element: <TasksPage />
      },
      { 
        path: "projects", 
        element: <ProjectsPage />
      },
      { 
        path: "users", 
        element: <UsersPage />
      },
      { 
        path: "tasks", 
        element: <TasksPage />
      },
      { 
        path: "tasks/:taskId", 
        element: <TaskDetailPage />
      },
      { 
        path: "appointments", 
        element: <AppointmentsPage />
      },
    ],
  },
];

export default routes;
