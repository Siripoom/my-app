"use client";

import { useState } from "react";
import { Form, Input, Button, Alert, message, Typography } from "antd";
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { sendPasswordResetEmail } from "@/services/authService";
import Link from 'next/link';

const { Title, Paragraph } = Typography;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(values.email);
      setEmailSent(true);
    } catch (e: any) {
      setError(e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        {emailSent ? (
          <div className="text-center">
            <Title level={3}>ตรวจสอบอีเมลของคุณ</Title>
            <Paragraph>เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว กรุณาตรวจสอบในกล่องจดหมาย (และใน Junk Mail)</Paragraph>
            <Link href="/login">
              <Button type="primary" icon={<ArrowLeftOutlined />}>
                กลับไปหน้า Login
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <Title level={3}>ลืมรหัสผ่าน?</Title>
              <Paragraph>ไม่ต้องกังวล! กรอกอีเมลของคุณเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่</Paragraph>
            </div>
            <Form name="forgot_password" onFinish={onFinish}>
              {error && <Alert message={error} type="error" showIcon className="mb-4" />}
              <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'กรุณากรอกอีเมลให้ถูกต้อง' }]}>
                <Input prefix={<MailOutlined />} placeholder="อีเมลของคุณ" size="large" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block size="large">
                  ส่งลิงก์รีเซ็ตรหัสผ่าน
                </Button>
              </Form.Item>
              <div className="text-center">
                <Link href="/login">
                  <Button type="link" icon={<ArrowLeftOutlined />}>
                    กลับไปหน้า Login
                  </Button>
                </Link>
              </div>
            </Form>
          </>
        )}
      </div>
    </div>
  );
}