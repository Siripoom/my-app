// src/components/AdminLayoutWrapper.tsx
"use client";

import { useState } from "react";
import { Layout, Breadcrumb, Typography } from "antd";
import AdminSidebar from "./AdminSidebar";

const { Header, Content } = Layout;
const { Title } = Typography;

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: { title: string; href?: string }[];
}

export default function AdminLayoutWrapper({
  children,
  title = "Admin Panel",
  breadcrumbs = [],
}: AdminLayoutWrapperProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AdminSidebar collapsed={collapsed} onCollapse={setCollapsed} />

      <Layout
        style={{
          marginLeft: collapsed ? 80 : 250,
          transition: "margin-left 0.2s",
        }}
      >
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            boxShadow: "0 1px 4px rgba(0,21,41,.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {title}
            </Title>
            {breadcrumbs.length > 0 && (
              <Breadcrumb style={{ marginTop: 4 }}>
                {breadcrumbs.map((crumb, index) => (
                  <Breadcrumb.Item key={index} href={crumb.href}>
                    {crumb.title}
                  </Breadcrumb.Item>
                ))}
              </Breadcrumb>
            )}
          </div>
        </Header>

        <Content
          style={{
            margin: "24px",
            background: "#fff",
            borderRadius: 8,
            minHeight: "calc(100vh - 112px)",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
