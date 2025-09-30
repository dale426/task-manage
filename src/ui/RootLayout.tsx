import { Layout, Menu, Grid } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ReactNode, useMemo } from "react";

const { Header, Sider, Content } = Layout;

type NavItem = {
  key: string;
  label: ReactNode;
  path: string;
};

const navItems: NavItem[] = [
  { key: "tasks", label: "任务", path: "/tasks" },
  { key: "projects", label: "项目", path: "/projects" },
  { key: "users", label: "用户", path: "/users" },
  { key: "appointments", label: "预约提醒", path: "/appointments" },
];

export default function RootLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = Grid.useBreakpoint();

  const selectedKeys = useMemo(() => {
    const found = navItems.find((i) => location.pathname.startsWith(i.path));
    return [found?.key ?? "tasks"];
  }, [location.pathname]);

  return (
    <Layout className="app-layout">
      <Header
        style={{ display: "flex", alignItems: "center", padding: "0 16px" }}
      >
        <div
          style={{
            color: "#fff",
            fontWeight: 600,
            marginRight: 16,
            fontSize: screens.lg ? 16 : 14,
            whiteSpace: "nowrap",
          }}
        >
          任务管理
        </div>
        <div style={{ flex: 1, minWidth: 0 }} />
        <Menu
          selectedKeys={selectedKeys}
          theme="dark"
          mode="horizontal"
          items={navItems.map((i) => ({ key: i.key, label: i.label }))}
          onClick={(e) => {
            const item = navItems.find((i) => i.key === e.key);
            if (item) navigate(item.path);
          }}
          style={{ flex: 0 }}
        />
      </Header>
      <Layout>
        <Content>
          <div className="content-wrapper">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
