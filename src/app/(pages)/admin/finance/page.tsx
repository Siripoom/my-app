// src/app/(pages)/admin/finance/page.tsx
"use client";

import { Tabs, Typography } from "antd";
import { DollarOutlined, SolutionOutlined } from "@ant-design/icons";
import AdminLayout from "@/components/AdminLayout";
import FinanceDashboardTab from "@/components/finance/FinanceDashboardTab";
import SalaryManagementTab from "@/components/finance/SalaryManagementTab";

const { Title } = Typography;

export default function AdminFinancePage() {
  const items = [
    {
      key: "1",
      label: (<span><DollarOutlined /> ภาพรวมการเงิน</span>),
      children: <FinanceDashboardTab />,
    },
    {
      key: "2",
      label: (<span><SolutionOutlined /> ค่าจ้างพนักงาน</span>),
      children: <SalaryManagementTab />,
    },
  ];

  return (
    <AdminLayout
      title="จัดการการเงินและค่าจ้าง"
      breadcrumbs={[{ title: "Admin" }, { title: "การเงินและค่าจ้าง" }]}
    >
      <div style={{ padding: 24 }}>
        <Title level={2} style={{ marginBottom: 24 }}>การเงินและค่าจ้าง</Title>
        <Tabs defaultActiveKey="1" items={items} type="card" />
      </div>
    </AdminLayout>
  );
}