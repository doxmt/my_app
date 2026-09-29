import { LoginView } from "@/components/views/login-view";
import { safeNextPath } from "@/lib/auth/safe-next";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return <LoginView next={safeNextPath(next, "/me")} failed={error !== undefined} />;
}
