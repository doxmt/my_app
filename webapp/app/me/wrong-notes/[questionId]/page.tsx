import { QuestionReviewView } from "@/components/views/question-review-view";

export default async function QuestionReviewPage({ params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = await params;
  return <QuestionReviewView questionId={questionId} />;
}
