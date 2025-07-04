"use client";

import { useState, useEffect, useCallback } from "react";
import { Form, Input, Button, message, Spin, Alert, Card, Avatar, Upload, Row, Col, Typography, Divider } from "antd";
import { UserOutlined, MailOutlined, EditOutlined, UploadOutlined, GithubOutlined, LinkedinOutlined, BankOutlined } from "@ant-design/icons";
import { supabase } from "@/config/supabase";
import { updateUserProfile, uploadAvatar, deleteAvatar, UserProfile } from "@/services/userService"; // สมมติว่าฟังก์ชันเหล่านี้อยู่ใน userService
import type { UploadFile, UploadProps } from "antd/es/upload";
import type { User } from "@supabase/supabase-js";

const { Title, Text } = Typography;

export default function ProfilePage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // ฟังก์ชันสำหรับดึงข้อมูลโปรไฟล์
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('teams') // ใช้ตาราง 'teams' ตามที่คุณกำหนด
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        form.setFieldsValue({ ...data, skills: data.skills?.join(', ') || '' });
        if (data.avatar_url) {
          setFileList([{ uid: '-1', name: 'avatar.jpg', status: 'done', url: data.avatar_url }]);
        }
      }
    } catch (e: any) {
      setError("ไม่สามารถโหลดข้อมูลโปรไฟล์ได้: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [form]);

  // ดึง session และข้อมูลผู้ใช้เมื่อเปิดหน้า
  useEffect(() => {
    const getSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        // ถ้าไม่มี session ควร redirect ไปหน้า login
        window.location.href = '/';
      }
    };
    getSessionAndProfile();
  }, [fetchProfile]);

  const onFinish = async (values: any) => {
    if (!user || !profile) return;
    setSaving(true);
    try {
      const skills = values.skills ? values.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
      let newAvatarUrl = profile.avatar_url;

      const newFile = fileList.length > 0 ? fileList[0] : null;
      if (newFile && newFile.originFileObj) {
        if (profile.avatar_url) await deleteAvatar(profile.avatar_url);
        newAvatarUrl = await uploadAvatar(newFile.originFileObj, user.id);
      } else if (!newFile && profile.avatar_url) {
        await deleteAvatar(profile.avatar_url);
        newAvatarUrl = undefined;
      }

      const updateData = {
        ...values,
        skills,
        avatar_url: newAvatarUrl,
      };

      // ไม่ควรอัปเดตอีเมลผ่านฟอร์มนี้โดยตรง
      delete updateData.email;

      await updateUserProfile(user.id, updateData);
      message.success("อัปเดตโปรไฟล์สำเร็จ!");
      fetchProfile(user.id); // โหลดข้อมูลใหม่
      window.location.reload();
    } catch (error: any) {
      message.error(error.message || "เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์");
    } finally {
      setSaving(false);
    }
  };

  const uploadProps: UploadProps = { beforeUpload: () => false, fileList, onChange: ({ fileList: newFileList }) => setFileList(newFileList), maxCount: 1, accept: "image/*", listType: "picture-card" };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Spin size="large" /></div>;
  }
  if (error) {
    return <div className="p-8"><Alert message={error} type="error" showIcon /></div>;
  }

  return (

    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <Title level={2} style={{ marginBottom: 24 }}>แก้ไขข้อมูลส่วนตัว</Title>
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={24}>
            <Col xs={24} md={8} className="text-center">
              <Form.Item label="รูปโปรไฟล์">
                <Upload {...uploadProps}>
                  {fileList.length < 1 && <div><PlusOutlined /><div style={{ marginTop: 8 }}>อัปโหลด</div></div>}
                </Upload>
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Form.Item name="full_name" label="ชื่อ-นามสกุล" rules={[{ required: true }]}>
                <Input prefix={<UserOutlined />} placeholder="ชื่อ-นามสกุล" />
              </Form.Item>
              <Form.Item name="email" label="อีเมล (ไม่สามารถแก้ไขได้)">
                <Input prefix={<MailOutlined />} disabled />
              </Form.Item>
              <Form.Item name="position" label="ตำแหน่งงาน">
                <Input placeholder="เช่น Frontend Developer" />
              </Form.Item>
              <Form.Item name="bank_account_number" label="เลขที่บัญชีธนาคาร">
                <Input prefix={<BankOutlined />} placeholder="เลขที่บัญชี" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item name="description" label="คำอธิบายเกี่ยวกับคุณ">
            <Input.TextArea rows={3} placeholder="เล่าเกี่ยวกับตัวคุณสั้นๆ" />
          </Form.Item>

          <Form.Item name="skills" label="ทักษะ (คั่นด้วยจุลภาค)">
            <Input placeholder="เช่น React, TypeScript, Figma" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="github_url" label="GitHub Profile">
                <Input addonBefore={<GithubOutlined />} placeholder="https://github.com/username" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="linkedin_url" label="LinkedIn Profile">
                <Input addonBefore={<LinkedinOutlined />} placeholder="https://linkedin.com/in/username" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving} icon={<EditOutlined />}>
              บันทึกการเปลี่ยนแปลง
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>

  );
}