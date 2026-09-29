import { Button } from "@/components/ui/button";

export function LoadingState() {
  return <p className="py-16 text-center text-sm text-muted-foreground">불러오는 중...</p>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-sm">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="py-16 text-center text-sm text-muted-foreground">{message}</p>;
}

export function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-4 text-xl font-semibold">{children}</h1>;
}
