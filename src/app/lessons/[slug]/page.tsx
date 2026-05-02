import { LessonDetailPage } from "@/components/lessons/LessonDetailPage";

export default function Page({ params }: { params: { slug: string } }) {
  return <LessonDetailPage slug={params.slug} />;
}
