import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, Page } from "@/components/page-state";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "페이지를 찾을 수 없습니다" };

/** 없는 주소로 들어왔을 때의 화면. */
export default function NotFound() {
  return (
    <Page>
      <EmptyState
        message="페이지를 찾을 수 없습니다. 주소가 바뀌었거나 삭제되었을 수 있습니다."
        action={
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            홈으로
          </Link>
        }
      />
    </Page>
  );
}
