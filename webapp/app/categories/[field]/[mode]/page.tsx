import { redirect } from "next/navigation";
import { TopicListView } from "@/components/views/topic-list-view";
import { parsePracticeMode } from "@/lib/models";

export default async function TopicListPage({ params }: { params: Promise<{ field: string; mode: string }> }) {
  const { field, mode } = await params;
  const practiceMode = parsePracticeMode(mode);
  if (!practiceMode) redirect(`/categories/${field}`);
  return <TopicListView fieldSlug={field} mode={practiceMode} />;
}
