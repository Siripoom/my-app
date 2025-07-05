"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Layout, Menu, Button, Drawer, Space, Popconfirm, message } from "antd";
import {
  HomeOutlined,
  TeamOutlined,
  MenuOutlined,
  AppstoreOutlined,
  LogoutOutlined,
  UserOutlined, // Import ไอคอน 
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { signOut } from "@/services/authService"; // ✨ Import ฟังก์ชัน signOut

const { Header } = Layout;

type NavItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
};

const menuNavItems: NavItem[] = [
  { key: "/home", label: "หน้าแรก", icon: <HomeOutlined /> },
  { key: "/team", label: "ทีมงาน", icon: <TeamOutlined /> },
  { key: "/profile", label: "โปรไฟล์", icon: <UserOutlined /> },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [drawerVisible, setDrawerVisible] = useState(false);

  // ✨ ฟังก์ชันจัดการ Logout
  const handleLogout = async () => {
    try {
      await signOut();
      message.success("ออกจากระบบสำเร็จ");
      router.push("/"); // Redirect ไปหน้า Login
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการออกจากระบบ");
    }
  };

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    if (e.key === 'logout') {
      // ไม่ต้องทำอะไรที่นี่ เพราะ Popconfirm จะจัดการเอง
    } else {
      router.push(e.key);
    }
    setDrawerVisible(false);
  };

  const showDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  const selectedKey = pathname === "/" ? "/home" : pathname;

  // ✨ สร้าง Items สำหรับเมนูใน Drawer (เพิ่ม Logout)
  const drawerMenuItems: MenuProps['items'] = [
    ...menuNavItems,
    { type: 'divider' },
    {
      key: 'logout',
      label: 'ออกจากระบบ',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout, // ใช้ onClick โดยตรงสำหรับเมนูใน Drawer
    },
  ];

  return (
    <Header
      className="bg-white shadow-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50"
      style={{ height: "64px", lineHeight: "normal" }}
    >
      {/* Logo */}
      <div className="flex items-center cursor-pointer" onClick={() => router.push('/home')}>
        <AppstoreOutlined className="text-2xl text-blue-600 mr-2" />
        <span className="text-xl font-bold text-gray-800 hidden sm:inline">My App</span>
      </div>

      {/* Desktop Menu - แสดงเมนูแบบปกติ + ปุ่ม Logout */}
      <div className="hidden md:flex items-center">
        <Space size="middle">
          {menuNavItems.map((item) => (
            <Button
              key={item.key}
              type={selectedKey === item.key ? "link" : "text"}
              icon={item.icon}
              onClick={() => router.push(item.key)}
              className={`flex items-center text-base font-medium ${selectedKey === item.key ? 'text-blue-600' : 'text-gray-600'}`}
            >
              {item.label}
            </Button>
          ))}
          {/* ✨ ปุ่ม Logout สำหรับ Desktop */}
          <Popconfirm
            title="ออกจากระบบ"
            description="คุณแน่ใจหรือไม่?"
            onConfirm={handleLogout}
            okText="ใช่"
            cancelText="ยกเลิก"
          >
            <Button
              type="text"
              icon={<LogoutOutlined />}
              danger
              className="flex items-center text-base font-medium"
            >
              ออกจากระบบ
            </Button>
          </Popconfirm>
        </Space>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={showDrawer}
        />
      </div>

      {/* Mobile Drawer */}
      <Drawer
        title="เมนู"
        placement="right"
        onClose={closeDrawer}
        open={drawerVisible}
        width={240}
        bodyStyle={{ padding: 0 }}
      >
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={handleMenuClick}
          items={drawerMenuItems} // ✨ ใช้ items ที่มี Logout
          className="border-none"
        />
      </Drawer>
    </Header>
  );
}