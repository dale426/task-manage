import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider, App as AntApp, theme } from "antd";
import zhCN from "antd/locale/zh_CN";
import { RouterProvider, createBrowserRouter, createHashRouter } from "react-router-dom";
import routes from "./routes";
import "./styles.css";
import { useStore } from "./domain/store";

// 使用HashRouter避免部署时的路径问题
const router = createHashRouter(routes);

// 初始化数据
const initializeApp = async () => {
  try {
    await useStore.getState().initializeData();
    console.log('数据初始化完成');
  } catch (error) {
    console.error('数据初始化失败:', error);
  }
};

// 应用根组件
const App = () => {
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    initializeApp().then(() => {
      setIsInitialized(true);
    });
  }, []);

  if (!isInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '16px'
      }}>
        正在加载数据...
      </div>
    );
  }

  return (
    <ConfigProvider locale={zhCN} theme={{ algorithm: theme.defaultAlgorithm }}>
      <AntApp>
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);



