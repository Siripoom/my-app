"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Space,
  Row,
  Col,
  Card,
  Statistic,
  Tag,
  Tooltip,
  Popconfirm,
  Typography,
  Descriptions,
  Alert,
  Avatar,
  Transfer,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import AdminLayout from "@/components/AdminLayout";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  getUniqueStatuses,
  getUpcomingDeadlines,
  type Project,
  type ProjectFilters,
  type ProjectStats,
  type ProjectWithTeamDetails,
} from "@/services/projectService";
import { getTeams, type Team } from "@/services/teamService";
import type { ColumnsType } from "antd/es/table";
import type { TransferDirection } from "antd/es/transfer";
import dayjs from "dayjs";

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const statusConfig = {
  todo: { color: "default", label: "รอดำเนินการ" },
  in_progress: { color: "processing", label: "กำลังดำเนินการ" },
  completed: { color: "success", label: "สำเร็จ" },
  cancelled: { color: "error", label: "ยกเลิก" },
};

interface TransferItem {
  key: string;
  title: string;
  description: string;
  position: string;
}

export default function AdminProjectPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectWithTeamDetails[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0,
    todoProjects: 0,
    inProgressProjects: 0,
    completedProjects: 0,
    cancelledProjects: 0,
  });
  const [totalBudget, setTotalBudget] = useState(0);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Project[]>([]);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingProject, setEditingProject] =
    useState<ProjectWithTeamDetails | null>(null);
  const [viewingProject, setViewingProject] =
    useState<ProjectWithTeamDetails | null>(null);

  // Team selection states
  const [transferData, setTransferData] = useState<TransferItem[]>([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Load projects data
  const loadProjects = async () => {
    try {
      setLoading(true);
      const filters: ProjectFilters = {
        search: searchText || undefined,
        status: selectedStatus,
        page: pagination.current,
        limit: pagination.pageSize,
      };

      const result = await getProjects(filters);
      setProjects(result.data);
      //summary buget
      const totalBudget = result.data.reduce(
        (sum, project) => sum + (parseFloat(project.budget) || 0),
        0
      );
      setTotalBudget(totalBudget);
      setPagination((prev) => ({
        ...prev,
        total: result.count,
      }));
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการโหลดข้อมูลโปรเจค");
      console.error("Load projects error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load teams data
  const loadTeams = async () => {
    try {
      const result = await getTeams({ limit: 100 }); // Get all teams
      setTeams(result.data);

      // Prepare transfer data
      const transferItems: TransferItem[] = result.data.map((team) => ({
        key: team.id!,
        title: team.name,
        description: team.position,
        position: team.position,
      }));
      setTransferData(transferItems);
    } catch (error) {
      console.error("Load teams error:", error);
    }
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      const [statsData, deadlines] = await Promise.all([
        getProjectStats(),
        getUpcomingDeadlines(7),
      ]);

      setStats(statsData);
      setUpcomingDeadlines(deadlines);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [searchText, selectedStatus, pagination.current, pagination.pageSize]);

  useEffect(() => {
    loadDashboardData();
    loadTeams();
  }, []);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // Handle filter changes
  const handleStatusChange = (value: string | undefined) => {
    setSelectedStatus(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // Handle table pagination
  const handleTableChange = (page: number, pageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      current: page,
      pageSize: pageSize || 10,
    }));
  };

  // Handle team transfer
  const handleTransferChange = (nextTargetKeys: string[]) => {
    setSelectedTeamMembers(nextTargetKeys);
  };

  // Open modal for create/edit
  const openModal = (project?: ProjectWithTeamDetails) => {
    setEditingProject(project || null);
    setModalVisible(true);

    if (project) {
      form.setFieldsValue({
        ...project,
        start_date: project.start_date ? dayjs(project.start_date) : null,
        end_date: project.end_date ? dayjs(project.end_date) : null,
      });
      setSelectedTeamMembers(project.team_members || []);
    } else {
      form.resetFields();
      setSelectedTeamMembers([]);
    }
  };

  // Open view modal
  const openViewModal = (project: ProjectWithTeamDetails) => {
    setViewingProject(project);
    setViewModalVisible(true);
  };

  // Close modals
  const closeModal = () => {
    setModalVisible(false);
    setEditingProject(null);
    setSelectedTeamMembers([]);
    form.resetFields();
  };

  const closeViewModal = () => {
    setViewModalVisible(false);
    setViewingProject(null);
  };

  // Handle form submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const projectData = {
        ...values,
        start_date: values.start_date
          ? values.start_date.format("YYYY-MM-DD")
          : null,
        end_date: values.end_date ? values.end_date.format("YYYY-MM-DD") : null,
        team_members: selectedTeamMembers,
      };

      if (editingProject) {
        await updateProject(editingProject.id!, projectData);
        message.success("อัพเดทโปรเจคสำเร็จ");
      } else {
        await createProject(projectData);
        message.success("เพิ่มโปรเจคใหม่สำเร็จ");
      }

      closeModal();
      loadProjects();
      loadDashboardData(); // Refresh stats
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await deleteProject(id);
      message.success("ลบโปรเจคสำเร็จ");
      loadProjects();
      loadDashboardData(); // Refresh stats
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการลบข้อมูล");
      console.error("Delete error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Render team members
  const renderTeamMembers = (teamMembers: string[], teamDetails?: any[]) => {
    if (!teamDetails || teamDetails.length === 0) {
      return <Text type="secondary">-</Text>;
    }

    return (
      <Avatar.Group maxCount={3} size="small">
        {teamDetails.map((member) => (
          <Tooltip
            key={member.id}
            title={`${member.name} (${member.position})`}
          >
            <Avatar
              src={member.avatar_url}
              icon={<UserOutlined />}
              style={{ backgroundColor: "#87d068" }}
            >
              {!member.avatar_url && member.name?.charAt(0)}
            </Avatar>
          </Tooltip>
        ))}
      </Avatar.Group>
    );
  };

  // Table columns
  const columns: ColumnsType<ProjectWithTeamDetails> = [
    {
      title: "ชื่อโปรเจค",
      dataIndex: "name",
      key: "name",
      render: (name: string) => <Text strong>{name}</Text>,
      filters: getUniqueStatuses().map((status) => ({
        text: statusConfig[status as keyof typeof statusConfig].label,
        value: status,
      })),
      onFilter: (value, record) => record.status === value,
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "งบประมาณ",
      dataIndex: "budget",
      key: "budget",
      render: (budget: string) => <Text strong>{budget}</Text>,
      filters: getUniqueStatuses().map((status) => ({
        text: statusConfig[status as keyof typeof statusConfig].label,
        value: status,
      })),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",

      render: (status: string) => {
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: "ทีมงาน",
      dataIndex: "team_members",
      key: "team_members",

      render: (teamMembers: string[], record) =>
        renderTeamMembers(teamMembers, record.team_details),
    },
    {
      title: "วันที่เริ่ม",
      dataIndex: "start_date",
      key: "start_date",

      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "วันที่สิ้นสุด",
      dataIndex: "end_date",
      key: "end_date",

      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "การดำเนินการ",
      key: "actions",

      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="ดูรายละเอียด">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openViewModal(record)}
            />
          </Tooltip>
          <Tooltip title="แก้ไข">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openModal(record)}
              type="primary"
            />
          </Tooltip>
          <Popconfirm
            title="คุณแน่ใจหรือไม่?"
            description="การลบข้อมูลนี้ไม่สามารถกู้คืนได้"
            onConfirm={() => handleDelete(record.id!)}
            okText="ลบ"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="ลบ">
              <Button size="small" icon={<DeleteOutlined />} danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout
      title="จัดการโปรเจค"
      breadcrumbs={[{ title: "Admin" }, { title: "จัดการโปรเจค" }]}
    >
      <div style={{ padding: 24 }}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={4}>
            <Card>
              <Statistic
                title="ทั้งหมด"
                value={stats.totalProjects}
                prefix={<BulbOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <Card>
              <Statistic
                title="รอดำเนินการ"
                value={stats.todoProjects}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <Card>
              <Statistic
                title="กำลังดำเนินการ"
                value={stats.inProgressProjects}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: "#13c2c2" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <Card>
              <Statistic
                title="สำเร็จ"
                value={stats.completedProjects}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <Card>
              <Statistic
                title="งบประมาณรวม"
                value={totalBudget}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: "#ff4d4f" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Upcoming Deadlines Alert */}
        {upcomingDeadlines.length > 0 && (
          <Alert
            message="โปรเจคที่ใกล้ครบกำหนด (7 วันข้างหน้า)"
            description={
              <div>
                {upcomingDeadlines.map((project) => (
                  <div key={project.id}>
                    <strong>{project.name}</strong> - ครบกำหนด{" "}
                    {dayjs(project.end_date).format("DD/MM/YYYY")}
                  </div>
                ))}
              </div>
            }
            type="warning"
            showIcon
            icon={<CalendarOutlined />}
            style={{ marginBottom: 24 }}
          />
        )}

        {/* Filters and Actions */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="ค้นหาชื่อหรือคำอธิบาย"
              allowClear
              onSearch={handleSearch}
              style={{ width: "100%" }}
              enterButton={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="เลือกสถานะ"
              allowClear
              onChange={handleStatusChange}
              style={{ width: "100%" }}
            >
              {getUniqueStatuses().map((status) => (
                <Option key={status} value={status}>
                  {statusConfig[status as keyof typeof statusConfig].label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={10} style={{ textAlign: "right" }}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadProjects}
                loading={loading}
              >
                รีเฟรช
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
              >
                เพิ่มโปรเจคใหม่
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Data Table */}
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} จาก ${total} รายการ`,
            onChange: handleTableChange,
            onShowSizeChange: handleTableChange,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          scroll={{ x: 1400 }}
          size="middle"
        />

        {/* Create/Edit Modal */}
        <Modal
          title={editingProject ? "แก้ไขโปรเจค" : "เพิ่มโปรเจคใหม่"}
          open={modalVisible}
          onCancel={closeModal}
          footer={[
            <Button key="cancel" onClick={closeModal}>
              ยกเลิก
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={loading}
              onClick={handleSubmit}
            >
              {editingProject ? "อัพเดท" : "เพิ่ม"}
            </Button>,
          ]}
          width={800}
          destroyOnClose
        >
          <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="ชื่อโปรเจค"
                  rules={[{ required: true, message: "กรุณากรอกชื่อโปรเจค" }]}
                >
                  <Input placeholder="กรอกชื่อโปรเจค" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="status"
                  label="สถานะ"
                  rules={[{ required: true, message: "กรุณาเลือกสถานะ" }]}
                >
                  <Select placeholder="เลือกสถานะ">
                    {getUniqueStatuses().map((status) => (
                      <Option key={status} value={status}>
                        {
                          statusConfig[status as keyof typeof statusConfig]
                            .label
                        }
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="start_date" label="วันที่เริ่ม">
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    placeholder="เลือกวันที่เริ่ม"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="end_date" label="วันที่สิ้นสุด">
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    placeholder="เลือกวันที่สิ้นสุด"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="คำอธิบาย">
              <TextArea rows={4} placeholder="กรอกคำอธิบายโปรเจค" />
            </Form.Item>
            <Form.Item name="budget" label="งบประมาณ">
              <Input rows={4} placeholder="กรอกงบประมาณโปรเจค" />
            </Form.Item>

            <Form.Item label="เลือกทีมงาน">
              <Transfer
                dataSource={transferData}
                titles={["สมาชิกทั้งหมด", "สมาชิกในโปรเจค"]}
                targetKeys={selectedTeamMembers}
                onChange={handleTransferChange}
                render={(item) => (
                  <div>
                    <div style={{ fontWeight: "bold" }}>{item.title}</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {item.description}
                    </div>
                  </div>
                )}
                showSearch
                searchPlaceholder="ค้นหาสมาชิก"
                filterOption={(inputValue, option) =>
                  option.title
                    .toLowerCase()
                    .includes(inputValue.toLowerCase()) ||
                  option.description
                    .toLowerCase()
                    .includes(inputValue.toLowerCase())
                }
                style={{ width: "100%" }}
                listStyle={{
                  width: "45%",
                  height: 300,
                }}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* View Modal */}
        <Modal
          title="รายละเอียดโปรเจค"
          open={viewModalVisible}
          onCancel={closeViewModal}
          footer={[
            <Button key="close" onClick={closeViewModal}>
              ปิด
            </Button>,
            <Button
              key="edit"
              type="primary"
              onClick={() => {
                closeViewModal();
                openModal(viewingProject!);
              }}
            >
              แก้ไข
            </Button>,
          ]}
          width={700}
        >
          {viewingProject && (
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="ชื่อโปรเจค" span={2}>
                <Text strong>{viewingProject.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="สถานะ">
                <Tag
                  color={
                    statusConfig[
                      viewingProject.status as keyof typeof statusConfig
                    ].color
                  }
                >
                  {
                    statusConfig[
                      viewingProject.status as keyof typeof statusConfig
                    ].label
                  }
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="จำนวนทีมงาน">
                <Text>{viewingProject.team_members?.length || 0} คน</Text>
              </Descriptions.Item>
              <Descriptions.Item label="วันที่เริ่ม">
                {viewingProject.start_date
                  ? dayjs(viewingProject.start_date).format("DD/MM/YYYY")
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="วันที่สิ้นสุด">
                {viewingProject.end_date
                  ? dayjs(viewingProject.end_date).format("DD/MM/YYYY")
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="วันที่สร้าง">
                {dayjs(viewingProject.created_at).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label="อัพเดทล่าสุด">
                {dayjs(viewingProject.updated_at).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label="คำอธิบาย" span={2}>
                {viewingProject.description || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="งบประมาณ" span={2}>
                {viewingProject.bugget || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="ทีมงาน" span={2}>
                {viewingProject.team_details &&
                viewingProject.team_details.length > 0 ? (
                  <div>
                    {viewingProject.team_details.map((member) => (
                      <div key={member.id} style={{ marginBottom: 8 }}>
                        <Space>
                          <Avatar
                            src={member.avatar_url}
                            icon={<UserOutlined />}
                            size="small"
                          />
                          <Text strong>{member.name}</Text>
                          <Tag color="blue" size="small">
                            {member.position}
                          </Tag>
                        </Space>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text type="secondary">ยังไม่มีทีมงาน</Text>
                )}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
