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
} from "@/services/projectService";
import type { ColumnsType } from "antd/es/table";
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

export default function AdminProjectPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0,
    todoProjects: 0,
    inProgressProjects: 0,
    completedProjects: 0,
    cancelledProjects: 0,
  });
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Project[]>([]);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

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

  // Open modal for create/edit
  const openModal = (project?: Project) => {
    setEditingProject(project || null);
    setModalVisible(true);

    if (project) {
      form.setFieldsValue({
        ...project,
        start_date: project.start_date ? dayjs(project.start_date) : null,
        end_date: project.end_date ? dayjs(project.end_date) : null,
      });
    } else {
      form.resetFields();
    }
  };

  // Open view modal
  const openViewModal = (project: Project) => {
    setViewingProject(project);
    setViewModalVisible(true);
  };

  // Close modals
  const closeModal = () => {
    setModalVisible(false);
    setEditingProject(null);
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

  // Table columns
  const columns: ColumnsType<Project> = [
    {
      title: "ชื่อโปรเจค",
      dataIndex: "name",
      key: "name",
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: string) => {
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: "วันที่เริ่ม",
      dataIndex: "start_date",
      key: "start_date",
      width: 120,
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "วันที่สิ้นสุด",
      dataIndex: "end_date",
      key: "end_date",
      width: 120,
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },

    {
      title: "การดำเนินการ",
      key: "actions",
      width: 150,
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
        {/* สถิติภาพรวม */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="โปรเจคทั้งหมด"
                value={stats.totalProjects}
                prefix={<BulbOutlined />}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="กำลังดำเนินการ"
                value={stats.inProgressProjects}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="สำเร็จแล้ว"
                value={stats.completedProjects}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="ยกเลิก"
                value={stats.cancelledProjects}
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
          scroll={{ x: 1200 }}
          size="middle"
        />

        {/* Create/Edit Modal */}
        <Modal
          title={editingProject ? "แก้ไขโปรเจค" : "เพิ่มโปรเจคใหม่"}
          open={modalVisible}
          onOk={handleSubmit}
          onCancel={closeModal}
          confirmLoading={loading}
          width={600}
          okText="บันทึก"
          cancelText="ยกเลิก"
        >
          <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
            <Form.Item
              name="name"
              label="ชื่อโปรเจค"
              rules={[{ required: true, message: "กรุณากรอกชื่อโปรเจค" }]}
            >
              <Input placeholder="ชื่อโปรเจค" />
            </Form.Item>

            <Form.Item name="description" label="คำอธิบาย">
              <TextArea rows={3} placeholder="คำอธิบายโปรเจค" />
            </Form.Item>

            <Form.Item name="status" label="สถานะ" initialValue="todo">
              <Select>
                {getUniqueStatuses().map((status) => (
                  <Option key={status} value={status}>
                    {statusConfig[status as keyof typeof statusConfig].label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="start_date" label="วันที่เริ่ม">
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="end_date" label="วันที่สิ้นสุด">
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
            </Row>
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
            </Descriptions>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
