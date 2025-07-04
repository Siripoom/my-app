"use client";

import { useState, useEffect, useCallback } from "react";
import { Row, Col, Card, Statistic, Typography, Spin, Alert, List, Tag, Avatar, Space, Tooltip, Empty } from "antd";
import { TeamOutlined, BulbOutlined, BankOutlined, RiseOutlined, FallOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { Pie, Column } from '@ant-design/charts'; // ✨ Import กราฟ
import AdminLayout from "@/components/AdminLayout";
import { getProjectStats, getUpcomingDeadlines, Project } from "@/services/projectService";
import { getUsers } from "@/services/userService";
import { getFinanceStats } from "@/services/financeService";
import dayjs from "dayjs";
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/th';

// ตั้งค่า dayjs ให้ใช้งาน plugin และภาษาไทย
dayjs.extend(relativeTime);
dayjs.locale('th');
// -------------------

const { Title, Text } = Typography;

// --- Main Dashboard Component ---
export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for data
  const [projectStats, setProjectStats] = useState<any>({});
  const [userCount, setUserCount] = useState(0);
  const [financeStats, setFinanceStats] = useState<any>({});
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Project[]>([]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [pStats, usersResult, fStats, deadlines] = await Promise.all([
        getProjectStats(),
        getUsers({ limit: 1 }), // ดึงแค่ count
        getFinanceStats(),
        getUpcomingDeadlines(14) // ดึง deadline ใน 14 วัน
      ]);
      setProjectStats(pStats);
      setUserCount(usersResult.count);
      setFinanceStats(fStats);
      setUpcomingDeadlines(deadlines);
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูลแดชบอร์ด");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return <AdminLayout><div className="flex justify-center items-center h-full"><Spin size="large" /></div></AdminLayout>;
  }
  if (error) {
    return <AdminLayout><div className="p-8"><Alert message={error} type="error" showIcon /></div></AdminLayout>;
  }

  // --- Data for Charts ---
  const projectStatusData = [
    { type: 'รอดำเนินการ', value: projectStats.todoProjects || 0 },
    { type: 'กำลังทำ', value: projectStats.inProgressProjects || 0 },
    { type: 'สำเร็จ', value: projectStats.completedProjects || 0 },
    { type: 'ยกเลิก', value: projectStats.cancelledProjects || 0 },
  ].filter(item => item.value > 0);

  const monthlyFinanceData = financeStats.monthlyData?.slice(0, 6).reverse().map((d: any) => ({
    month: dayjs(d.month).format('MMM'),
    value: d.total_income,
    type: 'รายรับ',
  })).concat(financeStats.monthlyData?.slice(0, 6).reverse().map((d: any) => ({
    month: dayjs(d.month).format('MMM'),
    value: d.total_expense,
    type: 'รายจ่าย',
  }))) || [];

  // --- Chart Configs ---
  const pieConfig = { data: projectStatusData, angleField: 'value', colorField: 'type', radius: 0.8, label: { text: 'value', style: { fontSize: 14 } }, legend: { color: { title: false, position: 'right', rowPadding: 5 } } };
  const columnConfig = { data: monthlyFinanceData, xField: 'month', yField: 'value', colorField: 'type', group: true, color: ['#52c41a', '#ff4d4f'] };

  return (
    <AdminLayout title="แผงควบคุมหลัก (Dashboard)">
      <div style={{ padding: 24 }}>
        {/* --- KPI Cards --- */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}><Card bordered={false}><Statistic title="โปรเจคทั้งหมด" value={projectStats.totalProjects} prefix={<BulbOutlined />} /></Card></Col>
          <Col xs={24} sm={12} md={6}><Card bordered={false}><Statistic title="ทีมงานทั้งหมด" value={userCount} prefix={<TeamOutlined />} /></Card></Col>
          <Col xs={24} sm={12} md={6}><Card bordered={false}><Statistic title="รายรับเดือนนี้" value={financeStats.totalIncome} prefix={<RiseOutlined />} precision={2} suffix="฿" valueStyle={{ color: '#52c41a' }} /></Card></Col>
          <Col xs={24} sm={12} md={6}><Card bordered={false}><Statistic title="รายจ่ายเดือนนี้" value={financeStats.totalExpense} prefix={<FallOutlined />} precision={2} suffix="฿" valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
        </Row>

        <Row gutter={[24, 24]}>
          {/* --- Left Column: Projects & Finance --- */}
          <Col xs={24} lg={16}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card title="ภาพรวมสถานะโปรเจค">
                {projectStatusData.length > 0 ? <Pie {...pieConfig} height={250} /> : <Empty description="ไม่มีข้อมูลโปรเจค" />}
              </Card>
              <Card title="สรุปการเงิน 6 เดือนล่าสุด">
                {monthlyFinanceData.length > 0 ? <Column {...columnConfig} height={250} /> : <Empty description="ไม่มีข้อมูลการเงิน" />}
              </Card>
            </Space>
          </Col>

          {/* --- Right Column: Upcoming Deadlines --- */}
          <Col xs={24} lg={8}>
            <Card title="โปรเจคใกล้ครบกำหนด (14 วัน)">
              {upcomingDeadlines.length > 0 ? (
                <List
                  itemLayout="horizontal"
                  dataSource={upcomingDeadlines}
                  renderItem={item => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<ClockCircleOutlined />} style={{ backgroundColor: '#faad14' }} />}
                        title={<a href={`/admin/projects/${item.id}`}>{item.name}</a>}
                        description={`ครบกำหนด: ${dayjs(item.end_date).format('DD MMM YYYY')} (${dayjs(item.end_date).fromNow()})`}
                      />
                    </List.Item>
                  )}
                />
              ) : <Empty description="ไม่มีโปรเจคใกล้ครบกำหนด" />}
            </Card>
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
}