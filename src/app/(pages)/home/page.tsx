"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/config/supabase";
import { getProjects, updateProject, type Project, type ProjectWithTeamDetails } from "@/services/projectService";
import { getSalaries, type SalaryWithDetails } from "@/services/salaryService";
import {
  Typography, Card, Space, List, Tag, Spin, Empty, Alert, Button, Avatar, Tooltip, Dropdown, MenuProps, message, Table, Row, Col, Statistic,
  Descriptions,
  Modal
} from "antd";
import {
  HomeOutlined,
  ContainerOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  UserOutlined,
  EllipsisOutlined,
  WalletOutlined,
  CloseCircleOutlined,
  HourglassOutlined,
  CarryOutOutlined,
  PaperClipOutlined,
  EditOutlined // ✨ NEW: Import icon for edit button
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { User } from "@supabase/supabase-js";
import type { ColumnsType } from "antd/es/table";

const { Title, Paragraph, Text } = Typography;

const statusConfig = {
  todo: { color: "default", label: "รอดำเนินการ", icon: <ClockCircleOutlined /> },
  in_progress: { color: "processing", label: "กำลังดำเนินการ", icon: <SyncOutlined spin /> },
  completed: { color: "success", label: "สำเร็จ", icon: <CheckCircleOutlined /> },
  cancelled: { color: "error", label: "ยกเลิก", icon: <CloseCircleOutlined /> },
};


export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [allProjects, setAllProjects] = useState<ProjectWithTeamDetails[]>([]);
  const [salaries, setSalaries] = useState<SalaryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewingProject, setViewingProject] = useState<ProjectWithTeamDetails | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        try {
          const [projectsResult, salariesResult] = await Promise.all([
            getProjects({ userId: session.user.id, limit: 1000 }),
            getSalaries({ userId: session.user.id, limit: 100 })
          ]);
          setAllProjects(projectsResult.data);
          setSalaries(salariesResult.data);
        } catch (err) {
          console.error("Error fetching data:", err);
          setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        }
      }
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  const { activeProjects, completedProjects } = useMemo(() => {
    const active = allProjects.filter(p => p.status === 'todo' || p.status === 'in_progress');
    const completed = allProjects.filter(p => p.status === 'completed' || p.status === 'cancelled');
    return { activeProjects: active, completedProjects: completed };
  }, [allProjects]);

  // ✨ MODIFIED: ปรับปรุงฟังก์ชันนี้ให้อัปเดต state ของ Modal ด้วย
  const handleStatusUpdate = async (projectId: string, newStatus: Project['status']) => {
    const originalProjects = [...allProjects];
    const originalViewingProject = viewingProject ? { ...viewingProject } : null;

    // Optimistic Update: อัปเดต UI ทันที
    setAllProjects(prevProjects => prevProjects.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
    // ✨ MODIFIED: อัปเดต state ของ modal ทันทีเพื่อ UI ที่ดี
    if (viewingProject && viewingProject.id === projectId) {
      setViewingProject(prev => ({ ...prev!, status: newStatus }));
    }

    try {
      await updateProject(projectId, { status: newStatus });
      message.success(`อัปเดตสถานะโปรเจคสำเร็จ!`);
    } catch (error) {
      message.error("อัปเดตสถานะไม่สำเร็จ, กรุณาลองใหม่อีกครั้ง");
      // Rollback: หากเกิด error ให้คืนค่า state เดิม
      setAllProjects(originalProjects);
      if (originalViewingProject && originalViewingProject.id === projectId) {
        setViewingProject(originalViewingProject);
      }
    }
  };

  const showProjectDetails = (project: ProjectWithTeamDetails) => {
    setViewingProject(project);
    setIsModalVisible(true);
  };
  const handleCancelModal = () => {
    setIsModalVisible(false);
  };


  const ProjectActionCard = ({ project }: { project: ProjectWithTeamDetails }) => {
    const config = statusConfig[project.status as keyof typeof statusConfig];
    const menuItems: MenuProps['items'] = [
      ...(project.status !== 'in_progress' ? [{ key: 'in_progress', label: 'เริ่มดำเนินการ', icon: <SyncOutlined /> }] : []),
      ...(project.status !== 'completed' ? [{ key: 'completed', label: 'ทำเสร็จแล้ว', icon: <CheckCircleOutlined /> }] : [])
    ];
    const menuProps = { items: menuItems, onClick: (e: any) => handleStatusUpdate(project.id!, e.key as Project['status']) };

    return (
      <Card
        hoverable
        className="shadow-sm"
        bodyStyle={{ cursor: 'pointer' }}
        onClick={() => showProjectDetails(project)}
        title={<Text ellipsis>{project.name}</Text>}
        extra={
          <Dropdown menu={menuProps} trigger={['click']}>
            <Button type="text" shape="circle" icon={<EllipsisOutlined />} onClick={(e) => e.stopPropagation()} />
          </Dropdown>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary" ellipsis={{ rows: 2 }}>{project.description || 'ไม่มีคำอธิบาย'}</Text>
          <Space>
            <Text strong>สถานะ:</Text>
            <Tag icon={config.icon} color={config.color}>{config.label}</Tag>
          </Space>
          {project.team_details && project.team_details.length > 0 && (
            <Avatar.Group maxCount={5} size="small">
              {project.team_details.map(member => (
                <Tooltip key={member.id} title={member.full_name}>
                  <Avatar src={member.avatar_url} icon={<UserOutlined />} />
                </Tooltip>
              ))}
            </Avatar.Group>
          )}
        </Space>
      </Card>
    );
  };

  const RecentPayoutsTable = () => {
    const salaryColumns: ColumnsType<SalaryWithDetails> = [
      {
        title: 'วันที่',
        dataIndex: 'pay_date',
        key: 'pay_date',
        render: (date: string) => dayjs(date).format("DD MMM YYYY")
      },
      {
        title: 'จำนวนเงิน',
        dataIndex: 'amount',
        key: 'amount',
        align: 'right',
        render: (val: number) => `฿${val.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
      },
      {
        title: 'สถานะ',
        dataIndex: 'status',
        key: 'status',
        align: 'center',
        render: (status: 'paid' | 'pending') => {
          if (status === 'paid') {
            return <Tag color="success" icon={<CheckCircleOutlined />}>จ่ายแล้ว</Tag>;
          }
          return <Tag color="warning" icon={<ClockCircleOutlined />}>รอจ่าย</Tag>;
        }
      },
    ];

    return <Table columns={salaryColumns} dataSource={salaries.slice(0, 5)} rowKey="id" pagination={false} size="middle" />;
  };

  const CompletedProjectsTable = () => {
    const completedColumns: ColumnsType<ProjectWithTeamDetails> = [
      { title: 'ชื่อโปรเจค', dataIndex: 'name', key: 'name' },
      { title: 'สถานะ', dataIndex: 'status', key: 'status', render: (status: keyof typeof statusConfig) => <Tag color={statusConfig[status].color}>{statusConfig[status].label}</Tag> },
      { title: 'วันที่สิ้นสุด', dataIndex: 'end_date', key: 'end_date', render: (date: string) => date ? dayjs(date).format("DD/MM/YYYY") : '-' },
    ];
    return <Table columns={completedColumns} dataSource={completedProjects} rowKey="id" pagination={{ pageSize: 5 }} size="middle" />;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
  }
  if (error) {
    return <div className="p-8"><Alert message={error} type="error" showIcon /></div>;
  }

  // ✨ NEW: สร้าง menu items สำหรับ Dropdown ใน Modal
  const modalMenuItems: MenuProps['items'] = viewingProject ? [
    ...(viewingProject.status === 'todo' ? [
      { key: 'in_progress', label: 'เริ่มดำเนินการ', icon: <SyncOutlined /> },
      { key: 'cancelled', label: 'ยกเลิก', icon: <CloseCircleOutlined /> },
    ] : []),
    ...(viewingProject.status === 'in_progress' ? [
      { key: 'completed', label: 'ทำเสร็จแล้ว', icon: <CheckCircleOutlined /> },
      { key: 'cancelled', label: 'ยกเลิก', icon: <CloseCircleOutlined /> },
    ] : []),
    // สามารถเพิ่มเงื่อนไขอื่นๆ ได้ตามต้องการ
  ] : [];

  const modalMenuProps: MenuProps = {
    items: modalMenuItems,
    onClick: (e) => {
      if (viewingProject) {
        handleStatusUpdate(viewingProject.id!, e.key as Project['status']);
      }
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Modal
          title="รายละเอียดโปรเจค"
          open={isModalVisible}
          onCancel={handleCancelModal}
          // ✨ MODIFIED: เพิ่มปุ่ม Dropdown สำหรับเปลี่ยนสถานะใน footer
          footer={[
            (modalMenuItems.length > 0 && (
              <Dropdown menu={modalMenuProps} key="status-update">
                <Button>
                  แก้ไข <EditOutlined />
                </Button>
              </Dropdown>
            )),
            <Button key="close" onClick={handleCancelModal}>ปิด</Button>
          ]}
          width={700}
        >
          {viewingProject && (
            <Descriptions bordered layout="vertical">
              <Descriptions.Item label="ชื่อโปรเจค">{viewingProject.name}</Descriptions.Item>
              {/* ✨ MODIFIED: จัดวาง Tag กับปุ่ม Dropdown ใหม่ แต่เราจะย้ายปุ่มไปที่ footer เพื่อความสะอาด */}
              <Descriptions.Item label="สถานะ">
                <Tag
                  icon={statusConfig[viewingProject.status as keyof typeof statusConfig].icon}
                  color={statusConfig[viewingProject.status as keyof typeof statusConfig].color}
                >
                  {statusConfig[viewingProject.status as keyof typeof statusConfig].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="งบประมาณ">
                {viewingProject.budget ? Number(viewingProject.budget).toLocaleString('th-TH', { style: 'currency', currency: 'THB' }) : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="ช่วงเวลาโปรเจค" span={2}>
                {`${dayjs(viewingProject.start_date).format("DD MMM YYYY")} - ${dayjs(viewingProject.end_date).format("DD MMM YYYY")}`}
              </Descriptions.Item>
              <Descriptions.Item label="คำอธิบาย" span={3}>
                {viewingProject.description || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="ไฟล์แนบ" span={3}>
                {viewingProject.attachment_url ? (
                  <a href={viewingProject.attachment_url} target="_blank" rel="noopener noreferrer">
                    <PaperClipOutlined /> {viewingProject.attachment_url.split('/').pop()}
                  </a>
                ) : <Text type="secondary">ไม่มีไฟล์แนบ</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="ทีมงาน" span={3}>
                {viewingProject.team_details && viewingProject.team_details.length > 0 ? (
                  <Space direction="vertical">
                    {viewingProject.team_details.map((member) => (
                      <div key={member.id}>
                        <Space>
                          <Avatar src={member.avatar_url} icon={<UserOutlined />} />
                          <Text strong>{member.full_name}</Text>
                          <Tag color="blue">{member.role}</Tag>
                        </Space>
                      </div>
                    ))}
                  </Space>
                ) : (<Text type="secondary">ยังไม่มีทีมงาน</Text>)}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        {/* === Header === */}
        <div className="mb-8">
          <Title level={2}>
            <HomeOutlined className="mr-3" />
            My Workspace
          </Title>
          <Paragraph className="text-lg text-gray-600">
            ยินดีต้อนรับกลับมา, {user?.user_metadata?.full_name || user?.email}!
          </Paragraph>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Card><Statistic title="โปรเจคที่กำลังทำ" value={activeProjects.length} prefix={<HourglassOutlined />} /></Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card><Statistic title="โปรเจคที่เสร็จแล้ว" value={completedProjects.length} prefix={<CarryOutOutlined />} /></Card>
            </Col>
          </Row>
        </div>

        {/* === Main Content === */}
        <Row gutter={[24, 24]}>
          {/* --- Left Column: Action Items --- */}
          <Col xs={24} lg={16}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <section>
                <Title level={4}>โปรเจคที่ต้องจัดการ</Title>
                {activeProjects.length > 0 ? (
                  <List
                    grid={{ gutter: 16, xs: 1, sm: 2, md: 2 }}
                    dataSource={activeProjects}
                    renderItem={(project) => <List.Item><ProjectActionCard project={project} /></List.Item>}
                  />
                ) : (
                  <Card><Empty description="เยี่ยม! ไม่มีงานค้างในตอนนี้" /></Card>
                )}
              </section>
              <section>
                <Title level={4}>โปรเจคที่เสร็จสิ้นแล้ว</Title>
                {completedProjects.length > 0 ? <CompletedProjectsTable /> : <Card><Empty description="ยังไม่มีโปรเจคที่ทำเสร็จ" /></Card>}
              </section>
            </Space>
          </Col>

          {/* --- Right Column: Payouts --- */}
          <Col xs={24} lg={8}>
            <section>
              <Title level={4}>รายการค่าจ้างล่าสุด</Title>
              {salaries.length > 0 ? <RecentPayoutsTable /> : <Card><Empty description="ยังไม่มีประวัติการรับค่าจ้าง" /></Card>}
            </section>
          </Col>
        </Row>
      </div>
    </div>
  );
}