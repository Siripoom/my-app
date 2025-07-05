"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, Checkbox, Alert } from "antd";
import { MailOutlined, LockOutlined } from '@ant-design/icons';
// 1. Import service ที่สร้างขึ้น
import { login, LoginCredentials } from "@/services/authService";
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2. ปรับ handleLogin ให้สะอาดและอ่านง่ายขึ้น
  const handleLogin = async (values: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      // 3. เรียกใช้ service และรอผลลัพธ์
      const result = await login({
        email: values.email,
        password: values.password,
      });

      // ถ้า service ทำงานสำเร็จ จะได้ผลลัพธ์กลับมา
      // และทำการ redirect ไปยัง path ที่ service กำหนดให้
      router.push(result.redirectPath);

    } catch (e: any) {
      // 4. ดักจับ Error ที่ถูก throw มาจาก service
      // แสดงข้อความ error ที่เป็นมิตรกับผู้ใช้
      setError(e.message || "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง");
      setIsLoading(false);
    }
  };

  // ... ส่วนของ JSX เหมือนเดิมทุกประการ ไม่ต้องแก้ไข ...
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome Back!
          </h1>
          <p className="mt-2 text-gray-600">กรุณาลงชื่อเข้าใช้เพื่อดำเนินการต่อ</p>
        </div>

        <Form
          name="normal_login"
          className="login-form"
          initialValues={{ remember: true }}
          onFinish={handleLogin}
          autoComplete="off"
        >
          {error && (
            <Alert message={error} type="error" showIcon className="mb-4" />
          )}

          <Form.Item
            name="email"
            rules={[
              { required: true, message: "กรุณากรอกอีเมล!" },
              { type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง!' }
            ]}
          >
            <Input
              prefix={<MailOutlined className="site-form-item-icon" />}
              placeholder="Email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "กรุณากรอกรหัสผ่าน!" }]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              type="password"
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>
            <Link href="/forgot-password" className="float-right text-blue-600 hover:text-blue-800">
              ลืมรหัสผ่าน?
            </Link>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full"
              size="large"
              loading={isLoading}
            >
              Log in
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}