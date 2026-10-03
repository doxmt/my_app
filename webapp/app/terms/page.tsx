import type { Metadata } from "next";
import { TermsView } from "@/components/views/terms-view";

export const metadata: Metadata = { title: "이용약관" };

export default function TermsPage() {
  return <TermsView />;
}
