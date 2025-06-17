import AdminLayoutWrapper from "./AdminLayoutWrapper";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: { title: string; href?: string }[];
}

export default function AdminLayout(props: AdminLayoutProps) {
  return <AdminLayoutWrapper {...props} />;
}
