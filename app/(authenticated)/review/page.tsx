import { createClient } from "@/lib/supabase/server";
import { ReviewClient } from "./review-client";

export default async function ReviewPage() {
  const supabase = await createClient();

  const { data: previousReviews } = await supabase
    .from("weekly_reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Weekly Review
      </h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        AI-generated summaries of your ranch week — key events, rainfall,
        rotation, hay, and herd health.
      </p>
      <ReviewClient previousReviews={previousReviews ?? []} />
    </div>
  );
}
