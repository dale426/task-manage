import { createElement } from "react";
import { RouteObject } from "react-router-dom";
import RootLayout from "./ui/RootLayout";
import ProjectsPage from "./ui/projects/ProjectsPage";
import UsersPage from "./ui/users/UsersPage";
import TasksPage from "./ui/tasks/TasksPage";
import TaskDetailPage from "./ui/tasks/TaskDetailPage";
import AppointmentsPage from "./ui/appointments/AppointmentsPage";

const routes: RouteObject[] = [
  {
    path: "/",
    element: createElement(RootLayout),
    children: [
      { index: true, element: createElement(TasksPage) },
      { path: "projects", element: createElement(ProjectsPage) },
      { path: "users", element: createElement(UsersPage) },
      { path: "tasks", element: createElement(TasksPage) },
      { path: "tasks/:taskId", element: createElement(TaskDetailPage) },
      { path: "appointments", element: createElement(AppointmentsPage) },
    ],
  },
];

export default routes;
