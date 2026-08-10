import { CustomerProfilePage } from "@/components/dashboard/customers/CustomerProfilePage";

interface CustomerDetailsPageProps {
  params: Promise<{ customerId: string }>;
}

export default async function Page({ params }: CustomerDetailsPageProps) {
  const { customerId } = await params;
  return <CustomerProfilePage customerId={customerId} />;
}
