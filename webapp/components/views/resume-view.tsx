"use client";

import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { MeLayout } from "@/components/me-layout";
import { ErrorState, LoadingState } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUserId } from "@/components/user-id-provider";
import { getResumeRepository } from "@/lib/data/repositories";
import type { Resume, ResumeSourceType } from "@/lib/models";
import { extractPdfText, PdfExtractionError } from "@/lib/resume/pdf-client";
import { resumeReturnPath } from "@/lib/resume/return-path";
import { getBrowserClient } from "@/lib/supabase/client";
import { useAsync } from "@/lib/use-async";

/** 이력서 입력. 텍스트 붙여넣기 또는 PDF 업로드로 채우고 저장한다(비회원은 기기 저장, 회원은 DB). */
export function ResumeView() {
  const { userId, ready } = useUserId();
  const { data, error, loading, reload } = useAsync(ready ? `resume:${userId ?? "guest"}` : null, async () => ({
    resume: await getResumeRepository(userId, getBrowserClient()).fetch(),
  }));

  return (
    <MeLayout title="이력서" description="모의면접 질문은 이 이력서를 바탕으로 만들어집니다.">
      {loading ? (
        <LoadingState rows={1} />
      ) : error || !data ? (
        <ErrorState message="이력서를 불러오지 못했습니다." onRetry={reload} />
      ) : (
        <ResumeForm initial={data.resume} />
      )}
    </MeLayout>
  );
}

function ResumeForm({ initial }: { initial: Resume | null }) {
  const { userId } = useUserId();
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(initial?.text ?? "");
  const [sourceType, setSourceType] = useState<ResumeSourceType>(initial?.sourceType ?? "paste");
  const [extracting, setExtracting] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  async function onPickPdf(file: File | undefined) {
    if (!file) return;
    setExtracting(true);
    setMessage(null);
    try {
      setText(await extractPdfText(file));
      setSourceType("pdf");
    } catch (error) {
      const text = error instanceof PdfExtractionError ? error.message : "PDF에서 텍스트를 추출하지 못했습니다.";
      setMessage({ text, isError: true });
    } finally {
      setExtracting(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function save() {
    try {
      await getResumeRepository(userId, getBrowserClient()).save({
        sourceType,
        text,
        updatedAt: new Date().toISOString(),
      });
      setMessage({ text: "이력서를 저장했습니다.", isError: false });
      // 모의면접에서 넘어온 경우(?next=/interview) 저장 후 그 화면으로 돌아간다.
      const returnPath = resumeReturnPath(window.location.search);
      if (returnPath) router.push(returnPath);
    } catch {
      setMessage({
        text: "이력서를 저장하지 못했습니다. 다시 시도해주세요.",
        isError: true,
      });
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-start">
      <div>
        <label htmlFor="resume-text" className="mb-2 block text-sm font-medium">
          이력서 텍스트
        </label>
        <Textarea
          id="resume-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={20}
          className="min-h-96 bg-card leading-relaxed"
          placeholder="이력서 텍스트를 붙여넣으세요."
        />
      </div>
      <aside aria-label="이력서 작업" className="flex flex-col gap-3 rounded-xl border bg-card p-5 xl:sticky xl:top-24">
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(event) => onPickPdf(event.target.files?.[0])}
        />
        <p className="text-xs text-muted-foreground">텍스트를 직접 붙여넣거나 PDF에서 불러올 수 있습니다.</p>
        <Button variant="outline" size="lg" disabled={extracting} onClick={() => fileInput.current?.click()}>
          <FileText aria-hidden />
          {extracting ? "PDF에서 텍스트를 추출하는 중..." : "PDF 불러오기"}
        </Button>
        <p className="-mt-1 text-xs text-muted-foreground">PDF는 최대 4MB, 20페이지까지 불러올 수 있습니다.</p>
        <Button size="lg" onClick={save}>
          저장
        </Button>
        {message && (
          <p
            role={message.isError ? "alert" : "status"}
            className={message.isError ? "text-sm text-destructive" : "text-sm text-success"}
          >
            {message.text}
          </p>
        )}
      </aside>
    </div>
  );
}
