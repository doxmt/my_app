const LABELS: Record<string, { text: string; className: string }> = {
  easy: { text: "쉬움", className: "bg-success/15 text-success" },
  medium: { text: "보통", className: "bg-chart-3/15 text-chart-3" },
  hard: { text: "어려움", className: "bg-destructive/15 text-destructive" },
};

/** 난이도 배지. 알 수 없는 값이나 null이면 아무것도 그리지 않는다. */
export function DifficultyBadge({ difficulty }: { difficulty: string | null }) {
  const entry = difficulty ? LABELS[difficulty] : undefined;
  if (!entry) return null;
  return (
    <span className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-medium ${entry.className}`}>
      {entry.text}
    </span>
  );
}
