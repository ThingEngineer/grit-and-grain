import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type OfflineOperation = {
  id: string;
  type:
    | "create_entry"
    | "create_pasture"
    | "delete_pasture"
    | "create_herd"
    | "delete_herd"
    | "update_profile";
  data: Record<string, unknown>;
  timestamp: number;
};

type SyncResult = {
  id: string;
  success: boolean;
  error?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { operations } = (await request.json()) as {
    operations: OfflineOperation[];
  };

  if (!Array.isArray(operations) || operations.length === 0) {
    return NextResponse.json(
      { error: "No operations provided" },
      { status: 400 },
    );
  }

  // Cap batch size to prevent abuse
  if (operations.length > 50) {
    return NextResponse.json(
      { error: "Too many operations (max 50)" },
      { status: 400 },
    );
  }

  const results: SyncResult[] = [];
  const pathsToRevalidate = new Set<string>();

  for (const op of operations) {
    try {
      switch (op.type) {
        case "create_entry": {
          const { entry_date, content, pasture_id, herd_group_id, tags } =
            op.data as {
              entry_date: string;
              content: string;
              pasture_id?: string;
              herd_group_id?: string;
              tags?: string[];
            };

          const { data: newEntry, error } = await supabase
            .from("diary_entries")
            .insert({
              profile_id: user.id,
              entry_date,
              content,
              pasture_id: pasture_id || null,
              herd_group_id: herd_group_id || null,
              tags: tags && tags.length > 0 ? tags : [],
            })
            .select("id")
            .single();

          if (error) throw new Error(error.message);

          // Fire-and-forget embedding generation
          if (newEntry) {
            triggerEmbedding(newEntry.id, request).catch(console.error);
          }

          pathsToRevalidate.add("/dashboard");
          pathsToRevalidate.add("/diary");
          results.push({ id: op.id, success: true });
          break;
        }

        case "create_pasture": {
          const { name, acres, notes } = op.data as {
            name: string;
            acres?: number;
            notes?: string;
          };

          const { error } = await supabase.from("pastures").insert({
            profile_id: user.id,
            name,
            acres: acres ?? null,
            notes: notes || null,
          });

          if (error) throw new Error(error.message);
          pathsToRevalidate.add("/pastures");
          results.push({ id: op.id, success: true });
          break;
        }

        case "delete_pasture": {
          const { id } = op.data as { id: string };

          await supabase
            .from("pastures")
            .delete()
            .eq("id", id)
            .eq("profile_id", user.id);

          pathsToRevalidate.add("/pastures");
          results.push({ id: op.id, success: true });
          break;
        }

        case "create_herd": {
          const { name, species, head_count, notes } = op.data as {
            name: string;
            species?: string;
            head_count?: number;
            notes?: string;
          };

          const { error } = await supabase.from("herd_groups").insert({
            profile_id: user.id,
            name,
            species: species || null,
            head_count: head_count ?? null,
            notes: notes || null,
          });

          if (error) throw new Error(error.message);
          pathsToRevalidate.add("/herds");
          results.push({ id: op.id, success: true });
          break;
        }

        case "delete_herd": {
          const { id } = op.data as { id: string };

          await supabase
            .from("herd_groups")
            .delete()
            .eq("id", id)
            .eq("profile_id", user.id);

          pathsToRevalidate.add("/herds");
          results.push({ id: op.id, success: true });
          break;
        }

        case "update_profile": {
          const { full_name, ranch_name } = op.data as {
            full_name?: string;
            ranch_name?: string;
          };

          const { error } = await supabase
            .from("profiles")
            .update({
              full_name: full_name?.trim() || null,
              ranch_name: ranch_name?.trim() || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

          if (error) throw new Error(error.message);
          pathsToRevalidate.add("/profile");
          pathsToRevalidate.add("/");
          results.push({ id: op.id, success: true });
          break;
        }

        default:
          results.push({
            id: op.id,
            success: false,
            error: `Unknown operation type: ${op.type}`,
          });
      }
    } catch (err) {
      results.push({
        id: op.id,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  // Revalidate all affected paths
  for (const path of pathsToRevalidate) {
    revalidatePath(path);
  }

  return NextResponse.json({ results });
}

/**
 * Trigger embedding generation for a diary entry via the existing embed API route.
 * This reuses the same logic without duplicating the AI SDK setup.
 */
async function triggerEmbedding(entryId: string, originalRequest: Request) {
  const origin = new URL(originalRequest.url).origin;
  const cookieHeader = originalRequest.headers.get("cookie");

  await fetch(`${origin}/api/ai/embed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    body: JSON.stringify({ entryId }),
  });
}
