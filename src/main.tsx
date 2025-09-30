import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider, App as AntApp, theme } from "antd";
import zhCN from "antd/locale/zh_CN";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import routes from "./routes";
import "./styles.css";

const router = createBrowserRouter(routes);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN} theme={{ algorithm: theme.defaultAlgorithm }}>
      <AntApp>
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>
);



