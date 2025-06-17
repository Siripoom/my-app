// src/app/(pages)/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Row, Col, Card, Statistic, Table, Tag, Avatar } from "antd";
import {
  TeamOutlined,
  UserOutlined,
  RiseOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import AdminLayout from "@/components/AdminLayout";
import { getTeams, Team } from "@/services/teamService";

export default function AdminDashboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalPositions: 0,
    recentTeams: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const result = await getTeams({ limit: 5 });
      setTeams(result.data);

      // Calculate stats
      const positions = new Set(result.data.map((team) => team.position));
      const recentTeams = result.data.filter((team) => {
        const createdAt = new Date(team.created_at!);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdAt > weekAgo;
      }).length;

      setStats({
        totalTeams: result.count,
        totalPositions: positions.size,
        recentTeams,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const recentTeamsColumns = [
    {
      title: "รูปภาพ",
      dataIndex: "avatar_url",
      key: "avatar_url",
      width: 60,
      render: (url: string) => (
        <Avatar src={url} size={32} icon={<UserOutlined />} />
      ),
    },
    {
      title: "ชื่อ",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "ตำแหน่ง",
      dataIndex: "position",
      key: "position",
      render: (position: string) => <Tag color="blue">{position}</Tag>,
    },
    {
      title: "วันที่เพิ่ม",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleDateString("th-TH"),
    },
  ];

  return (
    <AdminLayout
      title="แดชบอร์ด"
      breadcrumbs={[{ title: "Admin" }, { title: "แดชบอร์ด" }]}
    >
      <div style={{ padding: 24 }}>
        {/* สถิติภาพรวม */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="จำนวนทีมทั้งหมด"
                value={stats.totalTeams}
                prefix={<TeamOutlined />}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="ตำแหน่งงาน"
                value={stats.totalPositions}
                prefix={<UserOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="เพิ่มใหม่ (7 วันล่าสุด)"
                value={stats.recentTeams}
                prefix={<RiseOutlined />}
                valueStyle={{ color: "#cf1322" }}
              />
            </Card>
          </Col>
        </Row>

        {/* ทีมล่าสุด */}
        <Card
          title="ทีมล่าสุด"
          extra={<ClockCircleOutlined style={{ color: "#1890ff" }} />}
        >
          <Table
            columns={recentTeamsColumns}
            dataSource={teams}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="small"
          />
        </Card>
      </div>
    </AdminLayout>
  );
}
