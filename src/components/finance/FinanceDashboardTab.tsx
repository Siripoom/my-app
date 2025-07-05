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
  InputNumber,
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
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  WalletOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import AdminLayout from "@/components/AdminLayout";
import {
  getFinances,
  createFinance,
  updateFinance,
  deleteFinance,
  getFinanceStats,
  getFinanceTypes,
  getUniqueCategories,
  type Finance,
  type FinanceFilters,
  type FinanceStats,
} from "@/services/financeService";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;
const { RangePicker } = DatePicker;

const typeConfig = {
  income: { color: "success", label: "รายรับ", icon: <RiseOutlined /> },
  expense: { color: "error", label: "รายจ่าย", icon: <FallOutlined /> },
};

export default function FinanceDashboardTab() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [finances, setFinances] = useState<Finance[]>([]);
  const [stats, setStats] = useState<FinanceStats>({
    totalIncome: 0,
    totalExpense: 0,
    netAmount: 0,
    totalTransactions: 0,
    monthlyData: [],
  });
  const [categories, setCategories] = useState<string[]>([]);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingFinance, setEditingFinance] = useState<Finance | null>(null);
  const [viewingFinance, setViewingFinance] = useState<Finance | null>(null);

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState<string | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined
  >();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Load finances data
  const loadFinances = async () => {
    try {
      setLoading(true);
      const filters: FinanceFilters = {
        search: searchText || undefined,
        type: selectedType as "income" | "expense" | undefined,
        category: selectedCategory,
        start_date: dateRange?.[0]?.format("YYYY-MM-DD"),
        end_date: dateRange?.[1]?.format("YYYY-MM-DD"),
        page: pagination.current,
        limit: pagination.pageSize,
      };

      const result = await getFinances(filters);
      setFinances(result.data);
      setPagination((prev) => ({
        ...prev,
        total: result.count,
      }));
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการโหลดข้อมูลการเงิน");
      console.error("Load finances error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      const [statsData, categoriesData] = await Promise.all([
        getFinanceStats(),
        getUniqueCategories(),
      ]);

      setStats(statsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  useEffect(() => {
    loadFinances();
  }, [
    searchText,
    selectedType,
    selectedCategory,
    dateRange,
    pagination.current,
    pagination.pageSize,
  ]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // Handle filter changes
  const handleTypeChange = (value: string | undefined) => {
    setSelectedType(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleCategoryChange = (value: string | undefined) => {
    setSelectedCategory(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
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
  const openModal = (finance?: Finance) => {
    setEditingFinance(finance || null);
    setModalVisible(true);

    if (finance) {
      form.setFieldsValue({
        ...finance,
        transaction_date: finance.transaction_date
          ? dayjs(finance.transaction_date)
          : null,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        type: "expense",
        transaction_date: dayjs(),
      });
    }
  };

  // Open view modal
  const openViewModal = (finance: Finance) => {
    setViewingFinance(finance);
    setViewModalVisible(true);
  };

  // Close modals
  const closeModal = () => {
    setModalVisible(false);
    setEditingFinance(null);
    form.resetFields();
  };

  const closeViewModal = () => {
    setViewModalVisible(false);
    setViewingFinance(null);
  };

  // Handle form submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // ✨✨✨ ส่วนที่แก้ไข ✨✨✨
      // แปลงค่า category ถ้ามันเป็น Array ให้เป็น String ตัวแรก
      // (เพราะ mode="tags" และ maxTagCount={1} ทำให้มีได้อย่างมากแค่ 1 ค่า)
      const categoryValue = Array.isArray(values.category)
        ? values.category[0]
        : values.category;

      const financeData = {
        ...values,
        transaction_date: values.transaction_date.format("YYYY-MM-DD"),
        category: categoryValue, // ใช้ค่าที่แปลงแล้ว
      };

      if (editingFinance) {
        await updateFinance(editingFinance.id!, financeData);
        message.success("อัพเดทข้อมูลการเงินสำเร็จ");
      } else {
        await createFinance(financeData);
        message.success("เพิ่มข้อมูลการเงินใหม่สำเร็จ");
      }

      closeModal();
      loadFinances();
      loadDashboardData();
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
      await deleteFinance(id);
      message.success("ลบข้อมูลการเงินสำเร็จ");
      loadFinances();
      loadDashboardData(); // Refresh stats
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการลบข้อมูล");
      console.error("Delete error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Table columns
  const columns: ColumnsType<Finance> = [
    {
      title: "ชื่อรายการ",
      dataIndex: "title",
      key: "title",
      render: (title: string) => <Text strong>{title}</Text>,
    },
    {
      title: "ประเภท",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type: string) => {
        const config = typeConfig[type as keyof typeof typeConfig];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: "จำนวนเงิน",
      dataIndex: "amount",
      key: "amount",
      width: 130,
      align: "right",
      render: (amount: number, record: Finance) => (
        <Text
          strong
          style={{
            color: record.type === "income" ? "#52c41a" : "#ff4d4f",
          }}
        >
          {record.type === "income" ? "+" : "-"}฿{amount.toLocaleString()}
        </Text>
      ),
    },
    {
      title: "หมวดหมู่",
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (category: string) => <Tag color="blue">{category || "-"}</Tag>,
    },
    {
      title: "วันที่",
      dataIndex: "transaction_date",
      key: "transaction_date",
      width: 120,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "หมายเหตุ",
      dataIndex: "notes",
      key: "notes",
      width: 200,
      render: (notes: string) => (
        <Tooltip title={notes}>
          <Text ellipsis style={{ maxWidth: 180 }}>
            {notes || "-"}
          </Text>
        </Tooltip>
      ),
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
    <div style={{ padding: 24 }}>
      {/* สถิติภาพรวม */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="รายรับทั้งหมด"
              value={stats.totalIncome}
              prefix={<RiseOutlined />}
              formatter={(value) => `฿${Number(value).toLocaleString()}`}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="รายจ่ายทั้งหมด"
              value={stats.totalExpense}
              prefix={<FallOutlined />}
              formatter={(value) => `฿${Number(value).toLocaleString()}`}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="ยอดคงเหลือ"
              value={stats.netAmount}
              prefix={<WalletOutlined />}
              formatter={(value) => `฿${Number(value).toLocaleString()}`}
              valueStyle={{
                color: stats.netAmount >= 0 ? "#52c41a" : "#ff4d4f",
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="รายการทั้งหมด"
              value={stats.totalTransactions}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Net Amount Alert */}
      {stats.netAmount < 0 && (
        <Alert
          message="เตือน: ยอดคงเหลือติดลบ"
          description={`ยอดรายจ่ายมากกว่ารายรับ ${Math.abs(
            stats.netAmount
          ).toLocaleString()} บาท`}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Filters and Actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Search
            placeholder="ค้นหาชื่อรายการหรือหมายเหตุ"
            allowClear
            onSearch={handleSearch}
            style={{ width: "100%" }}
            enterButton={<SearchOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Select
            placeholder="เลือกประเภท"
            allowClear
            onChange={handleTypeChange}
            style={{ width: "100%" }}
          >
            {getFinanceTypes().map((type) => (
              <Option key={type} value={type}>
                {typeConfig[type as keyof typeof typeConfig].label}
              </Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Select
            placeholder="เลือกหมวดหมู่"
            allowClear
            onChange={handleCategoryChange}
            style={{ width: "100%" }}
          >
            {categories.map((category) => (
              <Option key={category} value={category}>
                {category}
              </Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <RangePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            placeholder={["วันที่เริ่ม", "วันที่สิ้นสุด"]}
            onChange={handleDateRangeChange}
          />
        </Col>
        <Col xs={24} sm={24} md={4} style={{ textAlign: "right" }}>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadFinances}
              loading={loading}
            >
              รีเฟรช
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
            >
              เพิ่ม
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Data Table */}
      <Table
        columns={columns}
        dataSource={finances}
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
        title={editingFinance ? "แก้ไขข้อมูลการเงิน" : "เพิ่มข้อมูลการเงินใหม่"}
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
            name="title"
            label="ชื่อรายการ"
            rules={[{ required: true, message: "กรุณากรอกชื่อรายการ" }]}
          >
            <Input placeholder="ชื่อรายการ" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="ประเภท"
                rules={[{ required: true, message: "กรุณาเลือกประเภท" }]}
              >
                <Select placeholder="เลือกประเภท">
                  {getFinanceTypes().map((type) => (
                    <Option key={type} value={type}>
                      {typeConfig[type as keyof typeof typeConfig].label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="จำนวนเงิน (บาท)"
                rules={[
                  { required: true, message: "กรุณากรอกจำนวนเงิน" },
                  {
                    type: "number",
                    min: 0.01,
                    message: "จำนวนเงินต้องมากกว่า 0",
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0.01}
                  step={0.01}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={
                    ((value: string | undefined) =>
                      Number(value?.replace(/\$\s?|(,*)/g, ""))) as any
                  }
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="transaction_date"
                label="วันที่"
                rules={[{ required: true, message: "กรุณาเลือกวันที่" }]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="หมวดหมู่">
                <Select
                  placeholder="เลือกหมวดหมู่"
                  allowClear
                  showSearch
                  mode="tags"
                  maxTagCount={1}
                >
                  {categories.map((category) => (
                    <Option key={category} value={category}>
                      {category}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="หมายเหตุ">
            <TextArea rows={3} placeholder="หมายเหตุเพิ่มเติม" />
          </Form.Item>
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title="รายละเอียดข้อมูลการเงิน"
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
              openModal(viewingFinance!);
            }}
          >
            แก้ไข
          </Button>,
        ]}
        width={700}
      >
        {viewingFinance && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="ชื่อรายการ" span={2}>
              <Text strong>{viewingFinance.title}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="ประเภท">
              <Tag
                color={
                  typeConfig[viewingFinance.type as keyof typeof typeConfig]
                    .color
                }
                icon={
                  typeConfig[viewingFinance.type as keyof typeof typeConfig]
                    .icon
                }
              >
                {
                  typeConfig[viewingFinance.type as keyof typeof typeConfig]
                    .label
                }
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="จำนวนเงิน">
              <Text
                strong
                style={{
                  color:
                    viewingFinance.type === "income" ? "#52c41a" : "#ff4d4f",
                }}
              >
                {viewingFinance.type === "income" ? "+" : "-"}฿
                {viewingFinance.amount.toLocaleString()}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="หมวดหมู่">
              <Tag color="blue">{viewingFinance.category || "-"}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="วันที่">
              {dayjs(viewingFinance.transaction_date).format("DD/MM/YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="วันที่สร้าง">
              {dayjs(viewingFinance.created_at).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="อัพเดทล่าสุด">
              {dayjs(viewingFinance.updated_at).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="หมายเหตุ" span={2}>
              {viewingFinance.notes || "-"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
