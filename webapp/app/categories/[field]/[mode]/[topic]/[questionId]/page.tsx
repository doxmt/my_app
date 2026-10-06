import { redirect } from "next/navigation";
import { QuestionDetailView } from "@/components/views/question-detail-view";
import { parsePracticeMode } from "@/lib/models";
import { parseRandomScope } from "@/lib/random-pick";

export default async function QuestionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ field: string; mode: string; topic: string; questionId: string }>;
  searchParams: Promise<{ random?: string | string[] }>;
}) {
  const { field, mode, topic, questionId } = await params;
  const { random } = await searchParams;
  const practiceMode = parsePracticeMode(mode);
  if (!practiceMode) redirect(`/categories/${field}`);
  return (
    <QuestionDetailView
      fieldSlug={field}
      mode={practiceMode}
      topicSlug={topic}
      questionId={questionId}
      randomScope={parseRandomScope(random)}
    />
  );
}
