import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/queries";
import { ReviewClient } from "./review-client";
import { PageHeader } from "@/components/page-header";

export default async function ReviewPage() {
  const user = await getUser();
  const supabase = await createClient();

  const { data: previousReviews } = await supabase
    .from("weekly_reviews")
    .select("*")
    .eq("profile_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div>
      <PageHeader
        title="Weekly Review"
        description="AI-generated summaries of your ranch week — key events, rainfall, rotation, hay, and herd health."
      />
      <ReviewClient previousReviews={previousReviews ?? []} />
    </div>
  );
}
