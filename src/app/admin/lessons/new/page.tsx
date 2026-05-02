import { AdminLessonEditorPage } from "@/components/admin/AdminLessonEditorPage";
import { RouteGuard } from "@/components/auth/RouteGuard";

export default function Page() {
  return (
    <RouteGuard requireAdmin title="Админ хэсэгт нэвтрэх эрх хэрэгтэй">
      <AdminLessonEditorPage />
    </RouteGuard>
  );
}
