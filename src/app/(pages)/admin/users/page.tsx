"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Space, Input, Select, Modal, Form, message, Tag, Avatar, Popconfirm, Upload, Row, Col, Typography, Tooltip } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UserOutlined, UploadOutlined, ReloadOutlined, EyeOutlined, GithubOutlined, LinkedinOutlined, MailOutlined, BankOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile, UploadProps } from "antd/es/upload";
import AdminLayout from "@/components/AdminLayout";
// ✨ แก้ไข import: เราจะสร้าง getUniquePositions ใน userService
import { getUsers, updateUserProfile, deleteUser, createUser, getUniquePositions, uploadAvatar, deleteAvatar, type UserProfile, type UserFilters } from "@/services/userService";

const { Search } = Input;
const { Option } = Select;
const { Text, Link: AntLink, Title } = Typography;

export default function AdminUserPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<UserFilters>({ page: 1, limit: 10 });
  const [positions, setPositions] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const usersResult = await getUsers(filters);
      setUsers(usersResult.data);
      setPagination(prev => ({ ...prev, total: usersResult.count }));
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // โหลด Positions แค่ครั้งเดียว
  useEffect(() => {
    getUniquePositions().then(setPositions);
  }, []);

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    setFilters(prev => ({ ...prev, page: 1, [key]: value || undefined }));
  };

  const handleTableChange = (newPagination: any) => {
    setFilters(prev => ({ ...prev, page: newPagination.current, limit: newPagination.pageSize }));
    setPagination(newPagination);
  };

  const openModal = (user?: UserProfile) => {
    setEditingUser(user || null);
    setFileList([]);
    if (user) {
      form.setFieldsValue({ ...user, skills: user.skills?.join(', ') || '' });
      if (user.avatar_url) {
        setFileList([{ uid: "-1", name: "avatar.jpg", status: "done", url: user.avatar_url }]);
      }
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const openViewModal = (user: UserProfile) => {
    setViewingUser(user);
    setViewModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setViewModalVisible(false);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const skills = values.skills ? values.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
      const newFile = fileList.length > 0 ? fileList[0] : null;

      if (editingUser) {
        let finalAvatarUrl = editingUser.avatar_url;
        if (newFile && newFile.originFileObj) {
          if (editingUser.avatar_url) await deleteAvatar(editingUser.avatar_url);
          finalAvatarUrl = await uploadAvatar(newFile.originFileObj, editingUser.id);
        } else if (!newFile && editingUser.avatar_url) {
          await deleteAvatar(editingUser.avatar_url);
          finalAvatarUrl = undefined;
        }

        const updateData = { ...values, skills, avatar_url: finalAvatarUrl };
        await updateUserProfile(editingUser.id, updateData);
        message.success("อัปเดตข้อมูลผู้ใช้สำเร็จ");

      } else {
        const createData = { ...values, skills };
        const result: any = await createUser(createData);
        const newUserId = result.userId;

        if (!newUserId) throw new Error("ไม่สามารถสร้างผู้ใช้ได้");

        if (newFile && newFile.originFileObj) {
          const newAvatarUrl = await uploadAvatar(newFile.originFileObj, newUserId);
          await updateUserProfile(newUserId, { avatar_url: newAvatarUrl });
        }
        message.success("สร้างผู้ใช้ใหม่สำเร็จ");
      }

      closeModal();
      await loadData();
    } catch (error: any) {
      message.error(error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user: UserProfile) => {
    setLoading(true);
    try {
      await deleteUser(user.id);
      if (user.avatar_url) await deleteAvatar(user.avatar_url);
      message.success("ลบผู้ใช้สำเร็จ");
      await loadData();
    } catch (error: any) {
      message.error(error.message || "เกิดข้อผิดพลาดในการลบผู้ใช้");
    } finally {
      setLoading(false);
    }
  };

  const uploadProps: UploadProps = { beforeUpload: () => false, fileList, onChange: ({ fileList: newFileList }) => setFileList(newFileList), maxCount: 1, accept: "image/*", listType: "picture" };

  // const columns: ColumnsType<UserProfile> = [
  //   { title: "รูปภาพ", dataIndex: "avatar_url", key: "avatar", render: url => <Avatar src={url} size={40} icon={<UserOutlined />} /> },
  //   { title: "ชื่อ", dataIndex: "full_name", key: "name", render: name => <Text strong>{name}</Text> },
  //   { title: "ตำแหน่ง", dataIndex: "position", key: "position", render: position => <Tag color="cyan">{position || '-'}</Tag> },
  //   { title: "สิทธิ์", dataIndex: "role", key: "role", render: role => <Tag color={role === 'admin' ? 'red' : 'blue'}>{role}</Tag> },
  //   {
  //     title: "การดำเนินการ", key: "actions", align: "center", render: (_, record) => (
  //       <Space size="small">
  //         <Tooltip title="ดูรายละเอียด"><Button size="small" icon={<EyeOutlined />} onClick={() => openViewModal(record)} /></Tooltip>
  //         <Tooltip title="แก้ไข"><Button size="small" icon={<EditOutlined />} onClick={() => openModal(record)} type="primary" /></Tooltip>
  //         <Popconfirm title="ลบผู้ใช้?" description="การกระทำนี้จะลบผู้ใช้ออกจากระบบอย่างถาวร" onConfirm={() => handleDelete(record)} okText="ลบ" cancelText="ยกเลิก" okButtonProps={{ danger: true }}>
  //           <Tooltip title="ลบ"><Button size="small" icon={<DeleteOutlined />} danger /></Tooltip>
  //         </Popconfirm>
  //       </Space>
  //     )
  //   },
  // ];


  const columns: ColumnsType<UserProfile> = [
    { title: "รูปภาพ", dataIndex: "avatar_url", key: "avatar", render: url => <Avatar src={url} size={40} icon={<UserOutlined />} /> },
    { title: "ชื่อ", dataIndex: "full_name", key: "name", render: name => <Text strong>{name}</Text> },
    { title: "ตำแหน่ง", dataIndex: "position", key: "position", render: position => <Tag color="cyan">{position || '-'}</Tag> },
    { title: "สิทธิ์", dataIndex: "role", key: "role", render: role => <Tag color={role === 'admin' ? 'red' : 'blue'}>{role}</Tag> },
    {
      title: "เลขบัญชี",
      dataIndex: "bank_account_number",
      key: "bank_account",
      // ✨ แก้ไข render function ให้แสดงเลขเต็ม
      render: (acc: string) => acc || '-'
    },
    {
      title: "การดำเนินการ", key: "actions", align: "center", render: (_, record) => (
        <Space size="small">
          <Tooltip title="ดูรายละเอียด"><Button size="small" icon={<EyeOutlined />} onClick={() => openViewModal(record)} /></Tooltip>
          <Tooltip title="แก้ไข"><Button size="small" icon={<EditOutlined />} onClick={() => openModal(record)} type="primary" /></Tooltip>
          <Popconfirm title="ลบผู้ใช้?" onConfirm={() => handleDelete(record)}><Tooltip title="ลบ"><Button size="small" icon={<DeleteOutlined />} danger /></Tooltip></Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <AdminLayout title="จัดการผู้ใช้/ทีมงาน" breadcrumbs={[{ title: "Admin" }, { title: "จัดการผู้ใช้" }]}>
      <div style={{ padding: 24 }}>
        {/* ... ส่วน Filter และ Table เหมือนเดิม แต่ใช้ columns ใหม่ ... */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }} justify="space-between" align="middle">
          <Col><Space wrap>
            <Search placeholder="ค้นหาชื่อ" allowClear onSearch={value => handleFilterChange('search', value)} style={{ width: 300 }} />
            <Select
              placeholder="เลือกตำแหน่ง"
              allowClear
              style={{ width: 200 }}
              onChange={value => handleFilterChange('position', value)} // ใช้ onChange และส่ง key เป็น 'position'
            >
              {positions.map(p => <Option key={p} value={p}>{p}</Option>)}
            </Select>
          </Space></Col>
          <Col><Space>
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>รีเฟรช</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>เพิ่มผู้ใช้ใหม่</Button>
          </Space></Col>
        </Row>
        <Table columns={columns} dataSource={users} rowKey="id" loading={loading} pagination={pagination} onChange={handleTableChange} scroll={{ x: 1200 }} />

        {/* ✨ 2. แก้ไข Modal เพิ่มช่อง "เลขที่บัญชี" */}
        <Modal title={editingUser ? "แก้ไขข้อมูลผู้ใช้" : "เพิ่มผู้ใช้ใหม่"} open={modalVisible} onOk={handleSubmit} onCancel={closeModal} confirmLoading={loading} okText="บันทึก" destroyOnClose width={800}>
          <Form form={form} layout="vertical" name="userForm" autoComplete="off" style={{ marginTop: 24 }}>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="full_name" label="ชื่อ-นามสกุล" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="position" label="ตำแหน่ง" rules={[{ required: true }]}><Input /></Form.Item></Col>
            </Row>

            {!editingUser && (
              <Row gutter={16}>
                <Col span={12}><Form.Item name="email" label="อีเมล (สำหรับ Login)" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item></Col>
                <Col span={12}><Form.Item name="password" label="รหัสผ่าน" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item></Col>
              </Row>
            )}

            {editingUser && <Form.Item name="email" label="อีเมล (สำหรับติดต่อ)"><Input /></Form.Item>}

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="role" label="สิทธิ์การเข้าถึง (Role)" rules={[{ required: true }]}>
                  <Select><Option value="admin">Admin</Option><Option value="user">User</Option></Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="bank_account_number" label="เลขที่บัญชีธนาคาร">
                  <Input placeholder="กรอกเลขบัญชี" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="คำอธิบาย"><Input.TextArea rows={2} /></Form.Item>
            <Form.Item name="skills" label="ทักษะ (คั่นด้วยจุลภาค)"><Input /></Form.Item>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="github_url" label="GitHub URL"><Input addonBefore={<GithubOutlined />} /></Form.Item></Col>
              <Col span={12}><Form.Item name="linkedin_url" label="LinkedIn URL"><Input addonBefore={<LinkedinOutlined />} /></Form.Item></Col>
            </Row>
            <Form.Item label="รูปภาพ"><Upload {...uploadProps}><Button icon={<UploadOutlined />}>เลือกรูป</Button></Upload></Form.Item>
          </Form>
        </Modal>

        {/* ✨ 3. แก้ไข View Modal เพิ่มการแสดงผล "เลขที่บัญชี" */}
        <Modal title="รายละเอียดผู้ใช้" open={viewModalVisible} onCancel={closeModal} footer={[<Button key="close" onClick={closeModal}>ปิด</Button>]}>
          {viewingUser && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Avatar size={80} src={viewingUser.avatar_url} icon={<UserOutlined />} />
                <Title level={4} style={{ marginTop: 8, marginBottom: 0 }}>{viewingUser.full_name}</Title>
                <div>
                  <Tag color="cyan" style={{ marginTop: 4 }}>{viewingUser.position}</Tag>
                  <Tag color={viewingUser.role === 'admin' ? 'red' : 'blue'} style={{ marginTop: 4 }}>{viewingUser.role}</Tag>
                </div>
              </div>
              <Text><strong><MailOutlined /> อีเมล:</strong> {viewingUser.email || '-'}</Text>
              <Text><strong><BankOutlined /> เลขที่บัญชี:</strong> {viewingUser.bank_account_number || '-'}</Text>
              <Text><strong>คำอธิบาย:</strong> {viewingUser.description || '-'}</Text>
              <div><strong>ทักษะ:</strong><div style={{ marginTop: 4 }}>{viewingUser.skills?.map((skill, i) => <Tag key={i} color="geekblue">{skill}</Tag>)}</div></div>
              <Text><strong><GithubOutlined /> GitHub:</strong> {viewingUser.github_url ? <AntLink href={viewingUser.github_url} target="_blank">{viewingUser.github_url}</AntLink> : '-'}</Text>
              <Text><strong><LinkedinOutlined /> LinkedIn:</strong> {viewingUser.linkedin_url ? <AntLink href={viewingUser.linkedin_url} target="_blank">{viewingUser.linkedin_url}</AntLink> : '-'}</Text>
            </Space>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}