import { RouteGuard } from "@/components/auth/RouteGuard";
import { ProfilePage } from "@/components/lessons/ProfilePage";

export default function Page() {
  return (
    <RouteGuard title="Профайл харахын тулд нэвтэрнэ үү">
      <ProfilePage />
    </RouteGuard>
  );
}
