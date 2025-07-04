// src/components/AdminLayout.tsx หรือ Path ที่ไฟล์นี้อยู่

import AdminGuard from "./AdminGuard"; // ✨ 1. Import ยามของเราเข้ามา
import AdminLayoutWrapper from "./AdminLayoutWrapper";


interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: { title: string; href?: string }[];
}

export default function AdminLayout(props: AdminLayoutProps) {
  return (
    // ✨ 2. นำ AdminGuard มาห่อหุ้ม AdminLayoutWrapper
    <AdminGuard>
      <AdminLayoutWrapper {...props} />
    </AdminGuard>
  );
}