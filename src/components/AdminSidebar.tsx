"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Layout, Menu, Button, Typography, Space, Popconfirm, message, Avatar, Skeleton } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  DashboardOutlined,
  SettingOutlined,
  BankOutlined,
  BulbOutlined,
  LogoutOutlined,
  HomeOutlined,
  UserOutlined, // ✨ Import เพิ่ม
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { signOut } from "@/services/authService";
import { supabase } from "@/config/supabase"; // ✨ Import supabase client
import type { UserProfile } from "@/services/userService"; // ✨ Import UserProfile type

const { Sider } = Layout;
const { Title } = Typography;

type MenuItem = Required<MenuProps>["items"][number];

const menuItems: MenuItem[] = [
  { key: "/admin", icon: <DashboardOutlined />, label: "แดชบอร์ด" },
  { key: "/admin/users", icon: <TeamOutlined />, label: "จัดการผู้ใช้" },
  { key: "/admin/project", icon: <BulbOutlined />, label: "จัดการโปรเจค" },
  { key: "/admin/finance", icon: <BankOutlined />, label: "จัดการการเงิน" },
  { key: "/home", icon: <HomeOutlined />, label: "กลับหน้าแรก" },
  { type: 'divider' },
  { key: "/admin/settings", icon: <SettingOutlined />, label: "ตั้งค่าระบบ" },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export default function AdminSidebar({ collapsed, onCollapse }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // ✨ สร้าง State สำหรับเก็บข้อมูลโปรไฟล์ Admin
  const [adminProfile, setAdminProfile] = useState<Partial<UserProfile>>({});
  const [loadingProfile, setLoadingProfile] = useState(true);

  // ✨ ดึงข้อมูลโปรไฟล์ของ Admin ที่ล็อกอินอยู่
  useEffect(() => {
    const fetchAdminProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData, error } = await supabase
          .from('teams') // หรือ 'profiles' ตามที่คุณใช้
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setAdminProfile(profileData);
        }
      }
      setLoadingProfile(false);
    };

    fetchAdminProfile();
  }, []);

  const handleMenuClick: MenuProps["onClick"] = (e) => router.push(e.key);

  const handleLogout = async () => {
    try {
      await signOut();
      message.success("ออกจากระบบสำเร็จ");
      router.push("/login");
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการออกจากระบบ");
    }
  };

  return (
    <Sider
      collapsible
      trigger={null}
      collapsed={collapsed}
      theme="dark"
      width={250}
      style={{
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* --- ✨ 1. Header (แก้ไขใหม่) --- */}
      <div style={{ padding: '16px', textAlign: 'center', cursor: 'pointer' }} onClick={() => router.push('/admin')}>
        <Space align="center">
          {loadingProfile ? (
            <Skeleton.Avatar active size="large" shape="circle" />
          ) : (
            <Avatar
              size="large"
              src={adminProfile.avatar_url}
              icon={<UserOutlined />}
            />
          )}
          {!collapsed && (
            loadingProfile ? (
              <Skeleton.Input active size="small" style={{ width: 120, marginLeft: 8 }} />
            ) : (
              <Title level={5} style={{ color: "white", margin: 0, marginLeft: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {adminProfile.full_name || 'Admin Panel'}
              </Title>
            )
          )}
        </Space>
      </div>

      {/* --- 2. Main Menu (เหมือนเดิม) --- */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ flex: 1, borderRight: 0, overflowY: 'auto' }}
      />

      {/* --- 3. Footer (เหมือนเดิม) --- */}
      <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Popconfirm
            title="ออกจากระบบ"
            description="คุณแน่ใจหรือไม่?"
            onConfirm={handleLogout}
            okText="ใช่, ออกจากระบบ"
            cancelText="ยกเลิก"
          >
            <Button danger type="primary" icon={<LogoutOutlined />} style={{ width: '100%', marginBottom: 8 }}>
              {!collapsed && "ออกจากระบบ"}
            </Button>
          </Popconfirm>
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => onCollapse(!collapsed)} style={{ width: "100%", color: "rgba(255, 255, 255, 0.65)" }}>
            {!collapsed && "ซ่อนเมนู"}
          </Button>
        </Space>
      </div>
    </Sider>
  );
}