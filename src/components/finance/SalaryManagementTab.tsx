// src/components/tabs/SalaryManagementTab.tsx

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, message, Space, Avatar, Tooltip, Popconfirm, Tag, Switch, Row, Col, Divider, Alert, Typography } from "antd";
import { PlusOutlined, UserOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { getUsers, UserProfile } from "@/services/userService";
// ✨ เปลี่ยนชื่อ service เพื่อความชัดเจน
import { getSalaries, createSalary, updateSalary, deleteSalary, updateSalaryStatus, createMultipleSalaries, SalaryWithDetails } from "@/services/salaryService";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";


const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text: AntText } = Typography;

// --- Main Component ---
export default function SalaryManagementTab() {
  const [form] = Form.useForm();
  const [salaries, setSalaries] = useState<SalaryWithDetails[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [singleModalVisible, setSingleModalVisible] = useState(false);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [editingSalary, setEditingSalary] = useState<SalaryWithDetails | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [salariesResult, usersResult] = await Promise.all([
        getSalaries({ page: pagination.current, limit: pagination.pageSize }),
        getUsers({ limit: 1000 })
      ]);
      setSalaries(salariesResult.data);
      setPagination(prev => ({ ...prev, total: salariesResult.count || 0 }));
      setUsers(usersResult.data);
    } catch (e) {
      message.error("ไม่สามารถโหลดข้อมูลค่าจ้างได้");
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleTableChange = (page: number, pageSize: number) => {
    setPagination(prev => ({ ...prev, current: page, pageSize }));
  };

  const openSingleModal = (salary?: SalaryWithDetails) => {
    setEditingSalary(salary || null);
    if (salary) {
      form.setFieldsValue({
        ...salary,
        pay_date: dayjs(salary.pay_date),
        period: [dayjs(salary.period_start_date), dayjs(salary.period_end_date)],
        // ✨ ตั้งค่าสถานะสำหรับแก้ไข
        status: salary.status === 'paid',
      });
    } else {
      form.resetFields();
      // ✨ ตั้งค่าเริ่มต้นสำหรับสร้างใหม่เป็น "จ่ายแล้ว"
      form.setFieldsValue({ status: true });
    }
    setSingleModalVisible(true);
  };

  const closeSingleModal = () => {
    setSingleModalVisible(false);
    setEditingSalary(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const salaryData = {
        user_id: values.user_id,
        amount: values.amount,
        pay_date: values.pay_date.format('YYYY-MM-DD'),
        period_start_date: values.period[0].format('YYYY-MM-DD'),
        period_end_date: values.period[1].format('YYYY-MM-DD'),
        notes: values.notes,
        // ✨ อ่านค่าสถานะจากฟอร์ม
        status: values.status ? 'paid' : 'pending' as const,
      };

      if (editingSalary) {
        // การแก้ไขยังใช้ updateSalary ปกติ (แต่ service จะถูกปรับปรุง)
        await updateSalary(editingSalary.id!, salaryData);
        message.success("แก้ไขข้อมูลค่าจ้างสำเร็จ!");
      } else {
        // ✨ ใช้ service ใหม่
        await createSalary(salaryData);
        message.success("บันทึกค่าจ้างสำเร็จ!");
      }
      closeSingleModal();
      await loadData();
    } catch (e: any) { message.error(e.message || "บันทึกข้อมูลไม่สำเร็จ"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (salary: SalaryWithDetails) => {
    setLoading(true);
    try {
      await deleteSalary(salary);
      message.success("ลบรายการค่าจ้างสำเร็จ");
      await loadData();
    } catch (e: any) { message.error(e.message || "ลบข้อมูลไม่สำเร็จ"); }
    finally { setLoading(false); }
  };

  // ✨ ฟังก์ชันนี้สำคัญมาก เพราะ service ด้านหลังจะถูกเปลี่ยนให้ซับซ้อนขึ้น
  const handleStatusChange = async (record: SalaryWithDetails, checked: boolean) => {
    const newStatus = checked ? 'paid' : 'pending';
    // อัปเดต UI ชั่วคราวก่อนเพื่อการตอบสนองที่รวดเร็ว
    setSalaries(prev => prev.map(s => s.id === record.id ? { ...s, status: newStatus } : s));

    try {
      // service นี้จะจัดการเรื่องการสร้าง/ลบ finance record เอง
      await updateSalaryStatus(record, newStatus);
      message.success("อัปเดตสถานะสำเร็จ");
      // โหลดข้อมูลใหม่เพื่อให้แน่ใจว่าข้อมูลถูกต้องตรงกัน
      await loadData();
    } catch (error) {
      message.error("อัปเดตสถานะไม่สำเร็จ");
      // หากเกิดข้อผิดพลาด ให้โหลดข้อมูลกลับมาเป็นเหมือนเดิม
      loadData();
    }
  };

  const columns: ColumnsType<SalaryWithDetails> = [
    { title: 'พนักงาน', dataIndex: ['teams', 'full_name'], key: 'user', render: (text, record) => (<Space><Avatar src={record.teams?.avatar_url} icon={<UserOutlined />} />{text || 'N/A'}</Space>) },
    { title: 'จำนวนเงิน (บาท)', dataIndex: 'amount', key: 'amount', align: 'right', render: (val: number) => val.toLocaleString('th-TH', { minimumFractionDigits: 2 }) },
    { title: 'วันที่จ่าย', dataIndex: 'pay_date', key: 'pay_date', render: (date: string) => dayjs(date).format("DD/MM/YYYY") },
    { title: 'สถานะ', dataIndex: 'status', key: 'status', align: 'center', render: (status: 'paid' | 'pending', record) => (<Switch checkedChildren="จ่ายแล้ว" unCheckedChildren="รอจ่าย" checked={status === 'paid'} onChange={(checked) => handleStatusChange(record, checked)} />) },
    { title: 'หมายเหตุ', dataIndex: 'notes', key: 'notes', ellipsis: true },
    {
      title: 'การดำเนินการ', key: 'action', align: 'center', render: (_, record) => (
        <Space size="small">
          <Tooltip title="แก้ไข"><Button icon={<EditOutlined />} onClick={() => openSingleModal(record)} /></Tooltip>
          <Popconfirm title="ลบรายการค่าจ้างนี้?" onConfirm={() => handleDelete(record)} okText="ลบ" cancelText="ยกเลิก" okButtonProps={{ danger: true }}>
            <Tooltip title="ลบ"><Button icon={<DeleteOutlined />} danger /></Tooltip>
          </Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Space>
          <Button onClick={() => setBulkModalVisible(true)}>จ่ายหลายคน</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openSingleModal()}>จ่ายรายคน</Button>
        </Space>
      </div>
      <Table dataSource={salaries} columns={columns} loading={loading} rowKey="id" pagination={{ ...pagination, showSizeChanger: true, onShowSizeChange: handleTableChange, onChange: handleTableChange }} />

      <Modal title={editingSalary ? "แก้ไขรายการค่าจ้าง" : "บันทึกค่าจ้างพนักงาน"} open={singleModalVisible} onOk={handleSubmit} onCancel={closeSingleModal} confirmLoading={loading} okText="บันทึก" destroyOnClose>
        <Form form={form} layout="vertical" initialValues={{ status: true }} style={{ marginTop: 24 }}>
          <Form.Item name="user_id" label="พนักงาน" rules={[{ required: true }]}><Select placeholder="เลือกพนักงาน" showSearch optionFilterProp="children" disabled={!!editingSalary}>{users.map(user => <Option key={user.id} value={(user as any).id}>{(user as any).full_name}</Option>)}</Select></Form.Item>
          <Form.Item name="amount" label="จำนวนเงิน" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} min={0} /></Form.Item>
          <Form.Item name="pay_date" label="วันที่จ่าย" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="period" label="สำหรับงวดวันที่" rules={[{ required: true }]}><RangePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="notes" label="หมายเหตุ"><Input /></Form.Item>
          {/* ✨ เพิ่ม Switch สำหรับเลือกสถานะ */}
          <Form.Item name="status" label="สถานะการจ่ายเงิน" valuePropName="checked">
            <Switch checkedChildren="จ่ายแล้ว (บันทึกรายจ่าย)" unCheckedChildren="รอจ่าย (ยังไม่บันทึกรายจ่าย)" />
          </Form.Item>
        </Form>
      </Modal>

      {bulkModalVisible && <BulkPayModal visible={bulkModalVisible} users={users} onCancel={() => setBulkModalVisible(false)} onFinish={loadData} />}
    </div>
  );
}

// --- Sub-Component: Modal for Bulk Payout (ปรับปรุงใหม่) ---
const BulkPayModal = ({ visible, users, onCancel, onFinish }: any) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const salaryList = Object.entries(values.users || {})
        // กรองเอาเฉพาะคนที่มีการกรอกจำนวนเงิน
        .filter(([, userData]: [string, any]) => userData && typeof userData.amount === 'number' && userData.amount > 0)
        .map(([userId, userData]: [string, any]) => ({
          user_id: userId,
          amount: userData.amount,
          pay_date: values.pay_date.format('YYYY-MM-DD'),
          period_start_date: values.period[0].format('YYYY-MM-DD'),
          period_end_date: values.period[1].format('YYYY-MM-DD'),
          notes: values.notes,
          // ✨ อ่านค่าสถานะจาก Switch ของแต่ละคน (ถ้าไม่มีค่าให้ถือว่าเป็น 'paid')
          status: (userData.paid === false) ? 'pending' : 'paid' as const,
        }));

      if (salaryList.length === 0) {
        message.warning("กรุณากรอกจำนวนเงินอย่างน้อย 1 คน");
        setLoading(false);
        return;
      }

      // ✨ ใช้ service ใหม่
      await createMultipleSalaries(salaryList);
      const paidCount = salaryList.filter(s => s.status === 'paid').length;
      const pendingCount = salaryList.length - paidCount;

      let successMessage = `บันทึกค่าจ้างสำเร็จ ${salaryList.length} คน`;
      if (paidCount > 0 && pendingCount > 0) {
        successMessage += ` (จ่ายแล้ว ${paidCount}, รอจ่าย ${pendingCount})`;
      } else if (paidCount > 0) {
        successMessage += ` (จ่ายแล้วทั้งหมด)`;
      } else if (pendingCount > 0) {
        successMessage += ` (รอจ่ายทั้งหมด)`;
      }

      message.success(successMessage);
      onFinish();
      onCancel();
    } catch (e: any) {
      message.error(e.message || "บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  // ✨ ตั้งค่าเริ่มต้นให้ทุกคนเป็น 'จ่ายแล้ว'
  useEffect(() => {
    if (users.length > 0) {
      const initialValues: any = { users: {} };
      users.forEach((user: UserProfile) => {
        initialValues.users[user.id!] = { paid: true };
      });
      form.setFieldsValue(initialValues);
    }
  }, [users, form]);


  return (
    <Modal title="บันทึกค่าจ้างหลายคนพร้อมกัน" open={visible} onOk={handleSubmit} onCancel={onCancel} confirmLoading={loading} width={800} okText="บันทึกทั้งหมด">
      <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
        <Alert message="กรอกข้อมูลร่วมกันด้านบน และระบุจำนวนเงินพร้อมสถานะสำหรับแต่ละคนที่ต้องการจ่ายด้านล่าง" type="info" showIcon style={{ marginBottom: 16 }} />
        <Row gutter={16}>
          <Col span={8}><Form.Item name="pay_date" label="วันที่จ่าย" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={16}><Form.Item name="period" label="สำหรับงวดวันที่" rules={[{ required: true }]}><RangePicker style={{ width: '100%' }} /></Form.Item></Col>
        </Row>
        <Form.Item name="notes" label="หมายเหตุร่วม"><Input placeholder="เช่น เงินเดือนประจำเดือน..." /></Form.Item>
        <Divider>รายชื่อพนักงาน</Divider>
        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: '6px', padding: '8px' }}>
          <Row align="middle" gutter={8} style={{ marginBottom: 8, padding: '0 8px' }}>
            <Col span={10}><AntText strong>พนักงาน</AntText></Col>
            <Col span={8}><AntText strong>จำนวนเงิน (บาท)</AntText></Col>
            <Col span={6}><AntText strong>สถานะ</AntText></Col>
          </Row>
          {users.map((user: UserProfile) => (
            <Row key={user.id} align="middle" gutter={8} style={{ width: '100%', marginBottom: 8 }}>
              <Col span={10}>
                <AntText>
                  <Avatar size="small" src={user.avatar_url} icon={<UserOutlined />} style={{ marginRight: 8 }} />
                  {user.full_name}
                </AntText>
              </Col>
              <Col span={8}>
                <Form.Item name={['users', user.id!, 'amount']} noStyle>
                  <InputNumber placeholder="จำนวนเงิน" style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} min={0} />
                </Form.Item>
              </Col>
              <Col span={6}>
                {/* ✨ เพิ่ม Switch สำหรับแต่ละคน */}
                <Form.Item name={['users', user.id!, 'paid']} noStyle valuePropName="checked">
                  <Switch size="small" checkedChildren="จ่ายแล้ว" unCheckedChildren="รอจ่าย" />
                </Form.Item>
              </Col>
            </Row>
          ))}
        </div>
        <Alert message="ระบบจะบันทึกรายจ่ายเฉพาะพนักงานที่ตั้งสถานะเป็น 'จ่ายแล้ว' และมีการกรอกจำนวนเงินเท่านั้น" type="warning" showIcon style={{ marginTop: 16 }} />
      </Form>
    </Modal>
  );
};