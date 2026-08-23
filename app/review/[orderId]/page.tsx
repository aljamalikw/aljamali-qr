import { RestaurantOrderFeedbackView } from "@/components/dashboard/reviews/RestaurantOrderFeedbackView";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function RestaurantOrderFeedbackPage({ params }: PageProps) {
  const { orderId } = await params;

  return (
    <main className="min-h-screen bg-[#0c0b09] px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-lg">
        <RestaurantOrderFeedbackView orderId={orderId} />
      </div>
    </main>
  );
}
