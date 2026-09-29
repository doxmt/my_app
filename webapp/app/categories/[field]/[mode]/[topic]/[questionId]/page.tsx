import { redirect } from "next/navigation";
import { QuestionDetailView } from "@/components/views/question-detail-view";
import { parsePracticeMode } from "@/lib/models";

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ field: string; mode: string; topic: string; questionId: string }>;
}) {
  const { field, mode, topic, questionId } = await params;
  const practiceMode = parsePracticeMode(mode);
  if (!practiceMode) redirect(`/categories/${field}`);
  return (
    <QuestionDetailView fieldSlug={field} mode={practiceMode} topicSlug={topic} questionId={questionId} />
  );
}
