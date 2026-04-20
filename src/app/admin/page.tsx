import { AdminPage } from "@/components/admin/AdminPage";
import { RouteGuard } from "@/components/auth/RouteGuard";

export default function Page() {
  return (
    <RouteGuard requireAdmin title="Админ хэсэгт нэвтрэх эрх хэрэгтэй">
      <AdminPage />
    </RouteGuard>
  );
}
