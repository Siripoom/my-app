"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, Layout, Button, Drawer, Space } from "antd";
import {
  HomeOutlined,
  TeamOutlined,
  MenuOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";

const { Header } = Layout;

type NavItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
};

const items: NavItem[] = [
  {
    key: "/home",
    label: "หน้าแรก",
    icon: <HomeOutlined />,
  },
  {
    key: "/team",
    label: "ทีมงาน",
    icon: <TeamOutlined />,
  },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    router.push(e.key);
    setDrawerVisible(false);
  };

  const showDrawer = () => {
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  // กำหนด selected key ตาม pathname ปัจจุบัน
  const selectedKey = pathname === "/" ? "/home" : pathname;

  return (
    <Header
      className="bg-white shadow-md px-4 flex items-center justify-between"
      style={{ height: "64px", lineHeight: "normal" }}
    >
      {/* Logo */}
      <div className="flex items-center">
        <AppstoreOutlined className="text-2xl text-blue-600 mr-2" />
        <span className="text-xl font-bold text-gray-800">My App</span>
      </div>

      {/* Desktop Menu - แสดงเมนูแบบปกติ */}
      <div className="hidden md:flex items-center">
        <Space size="large">
          {items.map((item) => (
            <Button
              key={item?.key}
              type={selectedKey === item?.key ? "primary" : "text"}
              icon={item?.icon}
              onClick={() =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                handleMenuClick({ key: item?.key as string } as any)
              }
              className="flex items-center"
            >
              {item?.label}
            </Button>
          ))}
        </Space>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={showDrawer}
          className="text-gray-700"
        />
      </div>

      {/* Mobile Drawer */}
      <Drawer
        title={
          <div className="flex items-center">
            <AppstoreOutlined className="text-xl text-blue-600 mr-2" />
            <span className="font-bold">My App</span>
          </div>
        }
        placement="right"
        onClose={closeDrawer}
        open={drawerVisible}
        width={250}
      >
        <Menu
          mode="vertical"
          selectedKeys={[selectedKey]}
          onClick={handleMenuClick}
          items={items}
          className="border-none"
        />
      </Drawer>
    </Header>
  );
}
