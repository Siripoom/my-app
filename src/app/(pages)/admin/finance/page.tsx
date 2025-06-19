import AdminLayout from "@/components/AdminLayout";

export default function FinancePage() {
  return (
    <AdminLayout
      title="จัดการการเงิน"
      breadcrumbs={[{ title: "Admin" }, { title: "จัดการการเงิน" }]}
    >
      <div>
        <h1>จัดการการเงิน</h1>
        <p>นี่คือหน้าจัดการการเงินสำหรับผู้ดูแลระบบ</p>
      </div>
    </AdminLayout>
  );
}
