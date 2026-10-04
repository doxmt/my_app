"use client";

import { useEffect } from "react";
import { ErrorState, Page } from "@/components/page-state";

/** 화면을 그리다 예상하지 못한 오류가 났을 때의 화면. 상단 내비와 푸터는 그대로 남는다. */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Page>
      <ErrorState message="화면을 불러오는 중 문제가 생겼습니다. 다시 시도해주세요." onRetry={retry} />
    </Page>
  );
}
