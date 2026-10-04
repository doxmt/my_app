import type { Metadata } from "next";
import { PrivacyView } from "@/components/views/privacy-view";

export const metadata: Metadata = { title: "개인정보처리방침" };

export default function PrivacyPage() {
  return <PrivacyView />;
}
