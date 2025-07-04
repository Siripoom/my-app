// src/components/AdminGuard.tsx
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { Spin, Result, Button } from 'antd'; // ✨ แก้ไข import แล้ว

interface AdminGuardProps {
  children: ReactNode;
}

const AdminGuard = ({ children }: AdminGuardProps) => {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user || role !== 'admin') {
      router.replace('/');
    }
  }, [user, role, loading, router]);


  // ✨ แก้ไขส่วน loading แล้ว
  if (loading) {
    return (
      <Spin tip="กำลังตรวจสอบสิทธิ์..." size="large" fullscreen />
    );
  }

  if (user && role === 'admin') {
    return <>{children}</>;
  }

  // ส่วนนี้จะแสดงแค่ชั่วคราวก่อนที่จะถูก redirect
  return (
    <Result
      status="403"
      title="403"
      subTitle="ขออภัย, คุณไม่ได้รับอนุญาตให้เข้าถึงหน้านี้"
      extra={
        <Button type="primary" onClick={() => router.push('/')}>
          กลับไปหน้าแรก
        </Button>
      }
    />
  );
};

export default AdminGuard;