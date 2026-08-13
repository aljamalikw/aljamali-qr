import { PublicReviewForm } from "@/components/public-menu/PublicReviewForm";
import { fetchOrderForReview } from "@/lib/reviews/reviews";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function PublicReviewPage({ params }: PageProps) {
  const { orderId } = await params;
  const result = await fetchOrderForReview(orderId);

  return (
    <main className="min-h-screen bg-[#0c0b09] px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-lg">
        {!result.ok ? (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center">
            <h1 className="font-serif text-2xl font-bold text-white">
              Review not found
            </h1>
            <p className="mt-2 text-sm text-white/55">{result.message}</p>
          </div>
        ) : (
          <PublicReviewForm order={result.data} />
        )}
      </div>
    </main>
  );
}
