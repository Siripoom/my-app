"use client";

import { useRouter, usePathname } from "next/navigation";
import { Layout, Menu, Button, Typography } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";

const { Sider } = Layout;
const { Title } = Typography;

type MenuItem = Required<MenuProps>["items"][number];

const menuItems: MenuItem[] = [
  {
    key: "/admin",
    icon: <DashboardOutlined />,
    label: "แดชบอร์ด",
  },
  {
    key: "/admin/team",
    icon: <TeamOutlined />,
    label: "จัดการทีมงาน",
  },
  {
    key: "/admin/users",
    icon: <UserOutlined />,
    label: "จัดการผู้ใช้",
  },
  {
    key: "/admin/settings",
    icon: <SettingOutlined />,
    label: "ตั้งค่าระบบ",
  },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export default function AdminSidebar({
  collapsed,
  onCollapse,
}: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    router.push(e.key);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      theme="dark"
      width={250}
      collapsedWidth={80}
      style={{
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          padding: collapsed ? "16px 8px" : "16px 24px",
          textAlign: "center",
          borderBottom: "1px solid #303030",
        }}
      >
        {!collapsed ? (
          <Title level={4} style={{ color: "white", margin: 0 }}>
            Admin Panel
          </Title>
        ) : (
          <Title level={4} style={{ color: "white", margin: 0 }}>
            A
          </Title>
        )}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ marginTop: 16 }}
      />

      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: collapsed ? 8 : 24,
          right: collapsed ? 8 : 24,
        }}
      >
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => onCollapse(!collapsed)}
          style={{
            fontSize: "16px",
            width: "100%",
            height: 40,
            color: "white",
          }}
        >
          {!collapsed && "ซ่อนเมนู"}
        </Button>
      </div>
    </Sider>
  );
}
