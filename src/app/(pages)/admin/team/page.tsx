// src/app/(pages)/admin/team/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  message,
  Tag,
  Avatar,
  Popconfirm,
  Upload,
  Row,
  Col,
  Typography,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  UploadOutlined,
  GithubOutlined,
  LinkedinOutlined,
  MailOutlined,
  ReloadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile, UploadProps } from "antd/es/upload";
import AdminLayout from "@/components/AdminLayout";
import {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  getUniquePositions,
  uploadAvatar,
  deleteAvatar,
  Team,
} from "@/services/teamService";

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;

export default function AdminTeamPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<
    string | undefined
  >();
  const [positions, setPositions] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Load teams
  const loadTeams = async () => {
    setLoading(true);
    try {
      const result = await getTeams({
        search: searchText,
        position: selectedPosition,
        page: pagination.current,
        limit: pagination.pageSize,
      });

      setTeams(result.data);
      setPagination((prev) => ({
        ...prev,
        total: result.count,
      }));
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      console.error("Load teams error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load positions for filter
  const loadPositions = async () => {
    try {
      const result = await getUniquePositions();
      setPositions(result);
    } catch (error) {
      console.error("Error loading positions:", error);
    }
  };

  useEffect(() => {
    loadTeams();
    loadPositions();
  }, [searchText, selectedPosition, pagination.current, pagination.pageSize]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // Handle position filter
  const handlePositionChange = (value: string | undefined) => {
    setSelectedPosition(value);
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
  const openModal = (team?: Team) => {
    setEditingTeam(team || null);
    setModalVisible(true);

    if (team) {
      form.setFieldsValue({
        ...team,
        skills: team.skills?.join(", ") || "",
      });

      if (team.avatar_url) {
        setFileList([
          {
            uid: "-1",
            name: "avatar.jpg",
            status: "done",
            url: team.avatar_url,
          },
        ]);
      }
    } else {
      form.resetFields();
      setFileList([]);
    }
  };

  // Open view modal
  const openViewModal = (team: Team) => {
    setViewingTeam(team);
    setViewModalVisible(true);
  };

  // Close modals
  const closeModal = () => {
    setModalVisible(false);
    setEditingTeam(null);
    form.resetFields();
    setFileList([]);
  };

  const closeViewModal = () => {
    setViewModalVisible(false);
    setViewingTeam(null);
  };

  // Handle form submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Handle skills array
      const skills = values.skills
        ? values.skills
            .split(",")
            .map((skill: string) => skill.trim())
            .filter(Boolean)
        : [];

      let avatarUrl = editingTeam?.avatar_url;

      // Handle avatar upload
      if (fileList.length > 0 && fileList[0].originFileObj) {
        try {
          const teamId = editingTeam?.id || "temp-" + Date.now();
          avatarUrl = await uploadAvatar(fileList[0].originFileObj, teamId);

          // Delete old avatar if editing
          if (editingTeam?.avatar_url && editingTeam.avatar_url !== avatarUrl) {
            await deleteAvatar(editingTeam.avatar_url);
          }
        } catch (error) {
          message.warning("เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ");
        }
      }

      const teamData = {
        ...values,
        skills,
        avatar_url: avatarUrl,
      };

      if (editingTeam) {
        await updateTeam(editingTeam.id!, teamData);
        message.success("อัพเดทข้อมูลทีมสำเร็จ");
      } else {
        await createTeam(teamData);
        message.success("เพิ่มทีมใหม่สำเร็จ");
      }

      closeModal();
      loadTeams();
      loadPositions(); // Reload positions in case new position was added
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string, avatarUrl?: string) => {
    try {
      setLoading(true);
      console.log(id);
      await deleteTeam(id);

      // Delete avatar if exists
      if (avatarUrl) {
        await deleteAvatar(avatarUrl);
      }

      message.success("ลบทีมสำเร็จ");
      loadTeams();
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการลบข้อมูล");
      console.error("Delete error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Upload props
  const uploadProps: UploadProps = {
    beforeUpload: () => false, // Prevent automatic upload
    fileList,
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    maxCount: 1,
    accept: "image/*",
    listType: "picture",
  };

  // Table columns
  const columns: ColumnsType<Team> = [
    {
      title: "รูปภาพ",
      dataIndex: "avatar_url",
      key: "avatar_url",
      width: 80,
      align: "center",
      render: (url: string) => (
        <Avatar src={url} size={50} icon={<UserOutlined />} />
      ),
    },
    {
      title: "ชื่อ",
      dataIndex: "name",
      key: "name",
      sorter: true,
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: "ตำแหน่ง",
      dataIndex: "position",
      key: "position",
      render: (position: string) => <Tag color="blue">{position}</Tag>,
    },
    {
      title: "คำอธิบาย",
      dataIndex: "description",
      key: "description",
      width: 200,
      render: (description: string) => (
        <Tooltip title={description}>
          <Text ellipsis style={{ maxWidth: 180 }}>
            {description || "-"}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "ทักษะ",
      dataIndex: "skills",
      key: "skills",
      width: 250,
      render: (skills: string[]) => (
        <div>
          {skills?.slice(0, 2).map((skill, index) => (
            <Tag key={index} color="geekblue" style={{ marginBottom: 4 }}>
              {skill}
            </Tag>
          ))}
          {skills?.length > 2 && (
            <Tag color="default">+{skills.length - 2} อื่นๆ</Tag>
          )}
        </div>
      ),
    },
    {
      title: "ติดต่อ",
      key: "contact",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Space>
          {record.email && (
            <Tooltip title="อีเมล">
              <Button
                size="small"
                icon={<MailOutlined />}
                href={`mailto:${record.email}`}
                type="link"
              />
            </Tooltip>
          )}
          {record.github_url && (
            <Tooltip title="GitHub">
              <Button
                size="small"
                icon={<GithubOutlined />}
                href={record.github_url}
                target="_blank"
                type="link"
              />
            </Tooltip>
          )}
          {record.linkedin_url && (
            <Tooltip title="LinkedIn">
              <Button
                size="small"
                icon={<LinkedinOutlined />}
                href={record.linkedin_url}
                target="_blank"
                type="link"
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: "วันที่เพิ่ม",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString("th-TH"),
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
            onConfirm={() => handleDelete(record.id!, record.avatar_url)}
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
      title="จัดการทีมงาน"
      breadcrumbs={[{ title: "Admin" }, { title: "จัดการทีมงาน" }]}
    >
      <div style={{ padding: 24 }}>
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
              placeholder="เลือกตำแหน่ง"
              allowClear
              onChange={handlePositionChange}
              style={{ width: "100%" }}
            >
              {positions.map((position) => (
                <Option key={position} value={position}>
                  {position}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={10} style={{ textAlign: "right" }}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadTeams}
                loading={loading}
              >
                รีเฟรช
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
              >
                เพิ่มทีมใหม่
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Data Table */}
        <Table
          columns={columns}
          dataSource={teams}
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
          title={editingTeam ? "แก้ไขข้อมูลทีม" : "เพิ่มทีมใหม่"}
          open={modalVisible}
          onOk={handleSubmit}
          onCancel={closeModal}
          confirmLoading={loading}
          width={800}
          okText="บันทึก"
          cancelText="ยกเลิก"
          destroyOnClose
        >
          <Form form={form} layout="vertical" requiredMark={false}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="ชื่อ"
                  rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}
                >
                  <Input placeholder="ชื่อสมาชิกทีม" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="position"
                  label="ตำแหน่ง"
                  rules={[{ required: true, message: "กรุณากรอกตำแหน่ง" }]}
                >
                  <Input placeholder="เช่น Frontend Developer" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="คำอธิบาย">
              <Input.TextArea
                rows={3}
                placeholder="คำอธิบายเกี่ยวกับสมาชิกทีม"
              />
            </Form.Item>

            <Form.Item
              name="skills"
              label="ทักษะ"
              help="แยกทักษะด้วยเครื่องหมายจุลภาค เช่น React, Next.js, TypeScript"
            >
              <Input placeholder="React, Next.js, TypeScript" />
            </Form.Item>

            <Form.Item label="รูปภาพ">
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>เลือกรูปภาพ</Button>
              </Upload>
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="email"
                  label="อีเมล"
                  rules={[{ type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" }]}
                >
                  <Input placeholder="example@email.com" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="github_url" label="GitHub URL">
                  <Input placeholder="https://github.com/username" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="linkedin_url" label="LinkedIn URL">
                  <Input placeholder="https://linkedin.com/in/username" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>

        {/* View Details Modal */}
        <Modal
          title="รายละเอียดทีมงาน"
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
                openModal(viewingTeam!);
              }}
            >
              แก้ไข
            </Button>,
          ]}
          width={600}
        >
          {viewingTeam && (
            <div>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={6}>
                  <Avatar
                    src={viewingTeam.avatar_url}
                    size={80}
                    icon={<UserOutlined />}
                  />
                </Col>
                <Col span={18}>
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    {viewingTeam.name}
                  </Typography.Title>
                  <Tag color="blue" style={{ marginTop: 8 }}>
                    {viewingTeam.position}
                  </Tag>
                </Col>
              </Row>

              {viewingTeam.description && (
                <div style={{ marginBottom: 16 }}>
                  <Typography.Text strong>คำอธิบาย:</Typography.Text>
                  <br />
                  <Typography.Text>{viewingTeam.description}</Typography.Text>
                </div>
              )}

              {viewingTeam.skills && viewingTeam.skills.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Typography.Text strong>ทักษะ:</Typography.Text>
                  <br />
                  <div style={{ marginTop: 8 }}>
                    {viewingTeam.skills.map((skill, index) => (
                      <Tag
                        key={index}
                        color="geekblue"
                        style={{ marginBottom: 4 }}
                      >
                        {skill}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <Typography.Text strong>ช่องทางติดต่อ:</Typography.Text>
                <br />
                <Space direction="vertical" style={{ marginTop: 8 }}>
                  {viewingTeam.email && (
                    <div>
                      <MailOutlined /> {viewingTeam.email}
                    </div>
                  )}
                  {viewingTeam.github_url && (
                    <div>
                      <GithubOutlined />
                      <a
                        href={viewingTeam.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {viewingTeam.github_url}
                      </a>
                    </div>
                  )}
                  {viewingTeam.linkedin_url && (
                    <div>
                      <LinkedinOutlined />
                      <a
                        href={viewingTeam.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {viewingTeam.linkedin_url}
                      </a>
                    </div>
                  )}
                </Space>
              </div>

              <div>
                <Typography.Text strong>วันที่เพิ่ม:</Typography.Text>
                <br />
                <Typography.Text>
                  {new Date(viewingTeam.created_at!).toLocaleString("th-TH")}
                </Typography.Text>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
