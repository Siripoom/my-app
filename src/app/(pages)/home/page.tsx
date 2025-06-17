"use client";

import { Typography, Card, Button, Space } from "antd";
import { HomeOutlined, UserOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Title level={1} className="mb-4">
            <HomeOutlined className="mr-2" />
            หน้าแรก
          </Title>
          <Paragraph className="text-lg">
            ยินดีต้อนรับสู่แอปพลิเคชันของเรา
          </Paragraph>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            title="เกี่ยวกับเรา"
            className="shadow-md"
            actions={[
              <Button key="learn-more" type="primary">
                เรียนรู้เพิ่มเติม
              </Button>,
            ]}
          >
            <Paragraph>
              นี่คือแอปพลิเคชันที่สร้างด้วย Next.js และ Ant Design
              พร้อมกับฟีเจอร์ที่ทันสมัยและใช้งานง่าย
            </Paragraph>
          </Card>

          <Card
            title="ทีมงาน"
            className="shadow-md"
            actions={[
              <Button key="view-team" type="default" icon={<UserOutlined />}>
                ดูทีมงาน
              </Button>,
            ]}
          >
            <Paragraph>
              พบกับทีมงานที่มีความเชี่ยวชาญและประสบการณ์
              ในการพัฒนาแอปพลิเคชันที่น่าประทับใจ
            </Paragraph>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Space size="large">
            <Button type="primary" size="large">
              เริ่มต้นใช้งาน
            </Button>
            <Button size="large">ติดต่อเรา</Button>
          </Space>
        </div>
      </div>
    </div>
  );
}
