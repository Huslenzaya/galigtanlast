import { AdminLessonEditorPage } from "@/components/admin/AdminLessonEditorPage";
import { RouteGuard } from "@/components/auth/RouteGuard";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <RouteGuard requireAdmin title="Админ хэсэгт нэвтрэх эрх хэрэгтэй">
      <AdminLessonEditorPage lessonId={params.id} />
    </RouteGuard>
  );
}
