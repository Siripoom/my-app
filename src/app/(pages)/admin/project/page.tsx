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
  Upload,
  UploadFile,
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
  PaperClipOutlined,
  UploadOutlined,

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
  uploadProjectAttachment, // ✨ Import ใหม่
  deleteProjectAttachment,
} from "@/services/projectService";
import { getUsers, type UserProfile } from "@/services/userService"; // ✨ ใช้ Service ใหม่
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

interface TransferItem {
  key: string;
  title: string;
  description: string;
}

export default function AdminProjectPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectWithTeamDetails[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]); // ✨ State สำหรับ users
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
  const [editingProject, setEditingProject] = useState<ProjectWithTeamDetails | null>(null);
  const [viewingProject, setViewingProject] = useState<ProjectWithTeamDetails | null>(null);

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

  const [attachmentFileList, setAttachmentFileList] = useState<UploadFile[]>([]);

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

      const totalBudget = result.data.reduce(
        (sum, project) => sum + (Number(project.budget) || 0),
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

  // ✨ Load users data
  const loadUsers = async () => {
    try {
      const result = await getUsers({ limit: 1000 });
      setUsers(result.data);

      const transferItems: TransferItem[] = result.data.map((user) => ({
        key: user.id,
        title: user.full_name,
        description: user.role,
      }));
      setTransferData(transferItems);
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้");
      console.error("Load users error:", error);
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
    loadUsers(); // ✨ เรียกใช้ฟังก์ชันใหม่
  }, []);



  // Handle search and filter
  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleStatusChange = (value: string | undefined) => {
    setSelectedStatus(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // Handle table pagination
  const handleTableChange = (page: number, pageSize: number) => {
    setPagination((prev) => ({ ...prev, current: page, pageSize: pageSize || 10 }));
  };

  // Handle team transfer
  const handleTransferChange = (nextTargetKeys: string[]) => {
    setSelectedTeamMembers(nextTargetKeys);
  };

  // Modal handlers
  const openModal = (project?: ProjectWithTeamDetails) => {
    setEditingProject(project || null);
    setAttachmentFileList([]);
    if (project) {
      form.setFieldsValue({
        ...project,
        start_date: project.start_date ? dayjs(project.start_date) : null,
        end_date: project.end_date ? dayjs(project.end_date) : null,
      });
      setSelectedTeamMembers(project.team_members || []);
      if (project.attachment_url) {
        setAttachmentFileList([{
          uid: '-1',
          name: project.attachment_url.split('/').pop() || 'ไฟล์แนบ',
          status: 'done',
          url: project.attachment_url,
        }]);
      }
    } else {
      form.resetFields();
      setSelectedTeamMembers([]);
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingProject(null);
  };

  const openViewModal = (project: ProjectWithTeamDetails) => {
    setViewingProject(project);
    setViewModalVisible(true);
  };

  const closeViewModal = () => {
    setViewModalVisible(false);
  };

  // Form submission and deletion
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      let attachment_url = editingProject?.attachment_url;
      const newFile = attachmentFileList.length > 0 ? attachmentFileList[0] : null;

      // ✨ Logic จัดการไฟล์แนบ
      if (newFile && newFile.originFileObj) {
        // กรณี: มีการเลือกไฟล์ใหม่
        if (editingProject?.attachment_url) {
          await deleteProjectAttachment(editingProject.attachment_url);
        }
        attachment_url = await uploadProjectAttachment(newFile.originFileObj, editingProject?.id || `new-project-${Date.now()}`);
      } else if (!newFile && editingProject?.attachment_url) {
        // กรณี: ผู้ใช้ลบไฟล์ที่มีอยู่
        await deleteProjectAttachment(editingProject.attachment_url);
        attachment_url = undefined;
      }

      const projectData = {
        ...values,
        start_date: values.start_date ? values.start_date.format("YYYY-MM-DD") : null,
        end_date: values.end_date ? values.end_date.format("YYYY-MM-DD") : null,
        team_members: selectedTeamMembers,
        attachment_url: attachment_url,
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
      loadDashboardData();
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (project: ProjectWithTeamDetails) => { // รับ object project ทั้งหมด
    try {
      setLoading(true);
      await deleteProject(project.id!);
      // ลบไฟล์แนบด้วยถ้ามี
      if (project.attachment_url) {
        await deleteProjectAttachment(project.attachment_url);
      }
      message.success("ลบโปรเจคสำเร็จ");
      loadProjects();
      loadDashboardData();
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการลบข้อมูล");
      console.error("Delete error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✨ Render team members with new data structure
  const renderTeamMembers = (_: string[], record: ProjectWithTeamDetails) => {
    const teamDetails = record.team_details;
    if (!teamDetails || teamDetails.length === 0) {
      return <Text type="secondary">-</Text>;
    }

    return (
      <Avatar.Group maxCount={3} size="small">
        {teamDetails.map((member) => (
          <Tooltip key={member.id} title={`${member.full_name} (${member.role})`}>
            <Avatar src={member.avatar_url} icon={<UserOutlined />} style={{ backgroundColor: "#87d068" }}>
              {!member.avatar_url && member.full_name?.charAt(0)}
            </Avatar>
          </Tooltip>
        ))}
      </Avatar.Group>
    );
  };

  const uploadProps: UploadProps = {
    beforeUpload: () => false,
    fileList: attachmentFileList,
    onChange: ({ fileList: newFileList }) => setAttachmentFileList(newFileList),
    maxCount: 1,
    accept: ".pdf,.doc,.docx,.xls,.xlsx,.zip",
  };


  // Table columns
  const columns: ColumnsType<ProjectWithTeamDetails> = [
    {
      title: "ชื่อโปรเจค",
      dataIndex: "name",
      key: "name",
      render: (name: string) => <Text strong>{name}</Text>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "งบประมาณ",
      dataIndex: "budget",
      key: "budget",
      render: (budget: number) => (budget ? budget.toLocaleString('th-TH', { style: 'currency', currency: 'THB' }) : "-"),
      sorter: (a, b) => (Number(a.budget) || 0) - (Number(b.budget) || 0),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      render: (status: keyof typeof statusConfig) => {
        const config = statusConfig[status];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: "ทีมงาน",
      key: "team_members",
      render: renderTeamMembers,
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
      title: "ไฟล์แนบ",
      dataIndex: "attachment_url",
      key: "attachment",
      align: "center",
      render: (url: string) => {
        if (!url) return <Text type="secondary">-</Text>;
        return (
          <Tooltip title="ดาวน์โหลดไฟล์">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <PaperClipOutlined style={{ fontSize: '18px' }} />
            </a>
          </Tooltip>
        );
      },
    },
    {
      title: "การดำเนินการ",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <Space size="small">
          {/* ✨✨✨ เพิ่ม 2 ปุ่มนี้กลับเข้าไป ✨✨✨ */}
          <Tooltip title="ดูรายละเอียด">
            <Button size="small" icon={<EyeOutlined />} onClick={() => openViewModal(record)} />
          </Tooltip>
          <Tooltip title="แก้ไข">
            <Button size="small" icon={<EditOutlined />} onClick={() => openModal(record)} type="primary" />
          </Tooltip>

          <Popconfirm
            title="คุณแน่ใจหรือไม่?"
            description="การลบข้อมูลนี้ไม่สามารถกู้คืนได้"
            onConfirm={() => handleDelete(record)}
            okText="ลบ"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="ลบ"><Button size="small" icon={<DeleteOutlined />} danger /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];


  return (
    <AdminLayout title="จัดการโปรเจค" breadcrumbs={[{ title: "Admin" }, { title: "จัดการโปรเจค" }]}>
      <div style={{ padding: 24 }}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={4}><Card><Statistic title="ทั้งหมด" value={stats.totalProjects} prefix={<BulbOutlined />} valueStyle={{ color: "#1890ff" }} /></Card></Col>
          <Col xs={24} sm={12} lg={4}><Card><Statistic title="รอดำเนินการ" value={stats.todoProjects} prefix={<ClockCircleOutlined />} valueStyle={{ color: "#faad14" }} /></Card></Col>
          <Col xs={24} sm={12} lg={4}><Card><Statistic title="กำลังดำเนินการ" value={stats.inProgressProjects} prefix={<ClockCircleOutlined />} valueStyle={{ color: "#13c2c2" }} /></Card></Col>
          <Col xs={24} sm={12} lg={4}><Card><Statistic title="สำเร็จ" value={stats.completedProjects} prefix={<CheckCircleOutlined />} valueStyle={{ color: "#52c41a" }} /></Card></Col>
          <Col xs={24} sm={12} lg={8}><Card><Statistic title="งบประมาณรวม (ในหน้านี้)" value={totalBudget} prefix="฿" valueStyle={{ color: "#ff4d4f" }} /></Card></Col>
        </Row>

        {/* Upcoming Deadlines Alert */}
        {upcomingDeadlines.length > 0 && (
          <Alert
            message={`โปรเจคที่ใกล้ครบกำหนด (${upcomingDeadlines.length} รายการ)`}
            description={<div>{upcomingDeadlines.map(p => <div key={p.id}><strong>{p.name}</strong> - ครบกำหนด {dayjs(p.end_date).format("DD/MM/YYYY")}</div>)}</div>}
            type="warning" showIcon icon={<CalendarOutlined />} style={{ marginBottom: 24 }}
          />
        )}

        {/* Filters and Actions */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }} justify="space-between" align="middle">
          <Col xs={24} md={14}>
            <Space>
              <Search placeholder="ค้นหาชื่อหรือคำอธิบาย" allowClear onSearch={handleSearch} style={{ width: 300 }} enterButton />
              <Select placeholder="เลือกสถานะ" allowClear onChange={handleStatusChange} style={{ width: 200 }}>
                {getUniqueStatuses().map((status) => <Option key={status} value={status}>{statusConfig[status as keyof typeof statusConfig].label}</Option>)}
              </Select>
            </Space>
          </Col>
          <Col xs={24} md={10} style={{ textAlign: "right" }}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => { loadProjects(); loadDashboardData(); }} loading={loading}>รีเฟรช</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>เพิ่มโปรเจคใหม่</Button>
            </Space>
          </Col>
        </Row>

        {/* Data Table */}
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={loading}
          pagination={{ ...pagination, showSizeChanger: true, showQuickJumper: true, showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`, onChange: handleTableChange, onShowSizeChange: handleTableChange }}
          scroll={{ x: 1200 }}
          size="middle"
        />

        {/* Create/Edit Modal */}
        <Modal title={editingProject ? "แก้ไขโปรเจค" : "เพิ่มโปรเจคใหม่"} open={modalVisible} onCancel={closeModal} onOk={handleSubmit} okText={editingProject ? "อัพเดท" : "เพิ่ม"} confirmLoading={loading} width={800} destroyOnClose>
          <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="name" label="ชื่อโปรเจค" rules={[{ required: true, message: "กรุณากรอกชื่อโปรเจค" }]}><Input placeholder="กรอกชื่อโปรเจค" /></Form.Item></Col>
              <Col span={12}><Form.Item name="status" label="สถานะ" rules={[{ required: true, message: "กรุณาเลือกสถานะ" }]}><Select placeholder="เลือกสถานะ">{getUniqueStatuses().map(s => <Option key={s} value={s}>{statusConfig[s as keyof typeof statusConfig].label}</Option>)}</Select></Form.Item></Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="start_date" label="วันที่เริ่ม"><DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="เลือกวันที่เริ่ม" /></Form.Item></Col>
              <Col span={12}><Form.Item name="end_date" label="วันที่สิ้นสุด"><DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="เลือกวันที่สิ้นสุด" /></Form.Item></Col>
            </Row>
            <Form.Item name="budget" label="งบประมาณ"><Input type="number" placeholder="กรอกงบประมาณโปรเจค" /></Form.Item>
            <Form.Item name="description" label="คำอธิบาย"><TextArea rows={4} placeholder="กรอกคำอธิบายโปรเจค" /></Form.Item>
            <Form.Item label="เลือกทีมงาน"><Transfer dataSource={transferData} titles={["สมาชิกทั้งหมด", "สมาชิกในโปรเจค"]} targetKeys={selectedTeamMembers} onChange={handleTransferChange} render={item => `${item.title} (${item.description})`} showSearch filterOption={(input, option) => (option?.title.toLowerCase() ?? '').includes(input.toLowerCase())} listStyle={{ width: '45%', height: 300 }} /></Form.Item>
            <Form.Item label="ไฟล์แนบ (ถ้ามี)">
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>เลือกไฟล์</Button>
              </Upload>
            </Form.Item>

          </Form>
        </Modal>

        {/* View Modal */}
        <Modal title="รายละเอียดโปรเจค" open={viewModalVisible} onCancel={closeViewModal} footer={[<Button key="close" onClick={closeViewModal}>ปิด</Button>, <Button key="edit" type="primary" onClick={() => { closeViewModal(); openModal(viewingProject!); }}>แก้ไข</Button>]} width={700}>
          {viewingProject && (
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="ชื่อโปรเจค">{viewingProject.name}</Descriptions.Item>
              <Descriptions.Item label="สถานะ"><Tag color={statusConfig[viewingProject.status as keyof typeof statusConfig].color}>{statusConfig[viewingProject.status as keyof typeof statusConfig].label}</Tag></Descriptions.Item>
              <Descriptions.Item label="งบประมาณ">{viewingProject.budget ? Number(viewingProject.budget).toLocaleString('th-TH', { style: 'currency', currency: 'THB' }) : "-"}</Descriptions.Item>
              <Descriptions.Item label="วันที่เริ่ม">{viewingProject.start_date ? dayjs(viewingProject.start_date).format("DD MMMM YYYY") : "-"}</Descriptions.Item>
              <Descriptions.Item label="วันที่สิ้นสุด">{viewingProject.end_date ? dayjs(viewingProject.end_date).format("DD MMMM YYYY") : "-"}</Descriptions.Item>
              <Descriptions.Item label="คำอธิบาย">{viewingProject.description || "-"}</Descriptions.Item>
              <Descriptions.Item label="ทีมงาน">
                {viewingProject.team_details && viewingProject.team_details.length > 0 ? (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {viewingProject.team_details.map((member) => (
                      <div key={member.id}><Space><Avatar src={member.avatar_url} icon={<UserOutlined />} /><Text strong>{member.full_name}</Text><Tag color="blue">{member.role}</Tag></Space></div>
                    ))}
                  </Space>
                ) : (<Text type="secondary">ยังไม่มีทีมงาน</Text>)}
              </Descriptions.Item>
              <Descriptions.Item label="ไฟล์แนบ">
                {viewingProject.attachment_url ? (
                  <a href={viewingProject.attachment_url} target="_blank" rel="noopener noreferrer">
                    <PaperClipOutlined /> {viewingProject.attachment_url.split('/').pop()}
                  </a>
                ) : <Text type="secondary">ไม่มีไฟล์แนบ</Text>}
              </Descriptions.Item>
            </Descriptions>

          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}