"use client";

import { FileText } from "lucide-react";
import { useRef, useState } from "react";
import { ErrorState, LoadingState, PageTitle } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUserId } from "@/components/user-id-provider";
import { getResumeRepository } from "@/lib/data/repositories";
import type { Resume, ResumeSourceType } from "@/lib/models";
import { extractPdfText, PdfExtractionError } from "@/lib/resume/pdf-client";
import { getBrowserClient } from "@/lib/supabase/client";
import { useAsync } from "@/lib/use-async";

/** 이력서 입력. 텍스트 붙여넣기 또는 PDF 업로드로 채우고 저장한다(비회원은 기기 저장, 회원은 DB). */
export function ResumeView() {
  const { userId, ready } = useUserId();
  const { data, error, loading, reload } = useAsync(ready ? `resume:${userId ?? "guest"}` : null, async () => ({
    resume: await getResumeRepository(userId, getBrowserClient()).fetch(),
  }));

  return (
    <>
      <PageTitle>이력서</PageTitle>
      {loading ? (
        <LoadingState />
      ) : error || !data ? (
        <ErrorState message="이력서를 불러오지 못했습니다." onRetry={reload} />
      ) : (
        <ResumeForm initial={data.resume} />
      )}
    </>
  );
}

function ResumeForm({ initial }: { initial: Resume | null }) {
  const { userId } = useUserId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(initial?.text ?? "");
  const [sourceType, setSourceType] = useState<ResumeSourceType>(initial?.sourceType ?? "paste");
  const [extracting, setExtracting] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

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
    } catch {
      setMessage({ text: "이력서를 저장하지 못했습니다. 다시 시도해주세요.", isError: true });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={16}
        placeholder="이력서 텍스트를 붙여넣으세요."
      />
      {message && (
        <p className={message.isError ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {message.text}
        </p>
      )}
      <input
        ref={fileInput}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(event) => onPickPdf(event.target.files?.[0])}
      />
      <Button variant="outline" disabled={extracting} onClick={() => fileInput.current?.click()}>
        <FileText aria-hidden />
        {extracting ? "PDF에서 텍스트를 추출하는 중..." : "PDF 불러오기"}
      </Button>
      <Button onClick={save}>저장</Button>
    </div>
  );
}
