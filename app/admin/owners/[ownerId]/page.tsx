import { AdminOwnerDetailsPage } from "@/components/admin/modules/AdminOwnerDetailsPage";

interface OwnerDetailsPageProps {
  params: Promise<{ ownerId: string }>;
}

export default async function Page({ params }: OwnerDetailsPageProps) {
  const { ownerId } = await params;
  return <AdminOwnerDetailsPage ownerId={ownerId} />;
}
