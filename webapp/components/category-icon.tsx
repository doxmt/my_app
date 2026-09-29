import { Bot, Cloud, Cpu, Globe, LayoutGrid, Server, Smartphone, type LucideIcon } from "lucide-react";

/** 분야 slug에 대응하는 아이콘. 알려지지 않은 slug는 기본 아이콘. */
const ICONS: Record<string, LucideIcon> = {
  cs: Cpu,
  frontend: Globe,
  backend: Server,
  ai: Bot,
  mobile: Smartphone,
  devops: Cloud,
};

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = ICONS[slug] ?? LayoutGrid;
  return <Icon className={className} aria-hidden />;
}
