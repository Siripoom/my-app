"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, Alert, message, Typography } from "antd";
import { LockOutlined } from '@ant-design/icons';
import { supabase } from "@/config/supabase";
import { updateUserPassword } from "@/services/authService";

const { Title, Paragraph } = Typography;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSessionValid, setIsSessionValid] = useState(false);

  // ตรวจสอบว่าผู้ใช้เข้ามาหน้านี้อย่างถูกต้องหรือไม่
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsSessionValid(true);
      } else {
        message.error("เซสชั่นไม่ถูกต้องหรือไม่หมดอายุ กรุณาขอลิงก์ใหม่", 5);
        router.push('/forgot-password');
      }
    };
    checkSession();
  }, [router]);

  const onFinish = async (values: any) => {
    setLoading(true);
    setError(null);
    try {
      await updateUserPassword(values.password);
      message.success("ตั้งรหัสผ่านใหม่สำเร็จ! กรุณาลงชื่อเข้าใช้อีกครั้ง", 5);
      await supabase.auth.signOut(); // บังคับ Logout เพื่อให้ใช้รหัสใหม่
      router.push('/');
    } catch (e: any) {
      setError(e.message || "เกิดข้อผิดพลาดในการตั้งรหัสผ่านใหม่");
    } finally {
      setLoading(false);
    }
  };

  if (!isSessionValid) {
    return null; // หรือแสดงหน้า Loading
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-6">
          <Title level={3}>ตั้งรหัสผ่านใหม่</Title>
          <Paragraph>กรุณาตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ</Paragraph>
        </div>
        <Form name="reset_password" onFinish={onFinish}>
          {error && <Alert message={error} type="error" showIcon className="mb-4" />}
          <Form.Item
            name="password"
            rules={[{ required: true, min: 6, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }]}
            hasFeedback
          >
            <Input.Password prefix={<LockOutlined />} placeholder="รหัสผ่านใหม่" size="large" />
          </Form.Item>
          <Form.Item
            name="confirm"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'กรุณายืนยันรหัสผ่าน' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('รหัสผ่านทั้งสองไม่ตรงกัน!'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="ยืนยันรหัสผ่านใหม่" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              บันทึกรหัสผ่านใหม่
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}