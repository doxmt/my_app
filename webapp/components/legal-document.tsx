import type { ReactNode } from "react";
import { Page } from "@/components/page-state";

/** 방침·약관 공통 틀. 상단에 초안 안내를 둔다. */
export function LegalDocument({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Page>
      <article className="mx-auto max-w-3xl text-sm leading-7 [&_a]:underline [&_a]:underline-offset-2 [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
        <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">{title}</h1>
        <p
          role="note"
          className="mt-4 rounded-lg border border-amber-500/50 bg-amber-100 px-4 py-3 text-amber-950 dark:bg-amber-400/10 dark:text-amber-200"
        >
          이 문서는 법률 자문이 아닌 초안입니다. 시행일은 2026-10-01 예정이며, 검토를 거쳐 확정되기 전까지 내용이 바뀔 수
          있습니다.
        </p>
        <div className="mt-8 flex flex-col gap-8">{children}</div>
      </article>
    </Page>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold tracking-tight">{heading}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

/** 국외 이전·처리위탁 고지 표. 업체마다 5개 항목(이전 항목 / 국가·시기·방법 / 이전받는 자 / 목적·보유기간 / 거부 방법·효과)을 채운다. */
export function TransferTable({ name, rows }: { name: string; rows: { label: string; value: ReactNode }[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[34rem] border-collapse text-left">
        <caption className="border-b bg-muted px-4 py-2 text-left font-semibold">{name}</caption>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b last:border-b-0 align-top">
              <th scope="row" className="w-40 bg-muted/50 px-4 py-2 font-medium">
                {row.label}
              </th>
              <td className="px-4 py-2">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
