import { FieldView } from "@/components/views/field-view";

export default async function FieldPage({ params }: { params: Promise<{ field: string }> }) {
  const { field } = await params;
  return <FieldView fieldSlug={field} />;
}
