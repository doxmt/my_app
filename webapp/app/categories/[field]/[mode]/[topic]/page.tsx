import { redirect } from "next/navigation";
import { QuestionListView } from "@/components/views/question-list-view";
import { parsePracticeMode } from "@/lib/models";

export default async function QuestionListPage({
  params,
}: {
  params: Promise<{ field: string; mode: string; topic: string }>;
}) {
  const { field, mode, topic } = await params;
  const practiceMode = parsePracticeMode(mode);
  if (!practiceMode) redirect(`/categories/${field}`);
  return <QuestionListView fieldSlug={field} mode={practiceMode} topicSlug={topic} />;
}
