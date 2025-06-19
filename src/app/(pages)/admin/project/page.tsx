import AdminLayout from "@/components/AdminLayout";

export default function ProjectPage() {
  return (
    <AdminLayout
      title="จัดการโปรเจค"
      breadcrumbs={[{ title: "Admin" }, { title: "จัดการโปรเจค" }]}
    >
      <div>
        <h1>จัดการโปรเจค</h1>
        <p>นี่คือหน้าจัดการโปรเจคสำหรับผู้ดูแลระบบ</p>
      </div>
    </AdminLayout>
  );
}
