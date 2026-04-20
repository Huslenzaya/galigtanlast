import { RouteGuard } from "@/components/auth/RouteGuard";
import { WritingPracticePage } from "@/components/lessons/WritingPracticePage";

export default function Page() {
  return (
    <RouteGuard title="Бичих дасгал руу орохын тулд нэвтэрнэ үү">
      <WritingPracticePage />
    </RouteGuard>
  );
}
