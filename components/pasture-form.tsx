"use client";

import { useTransition, useRef } from "react";
import {
  createPasture,
  deletePasture,
} from "@/app/(authenticated)/pastures/actions";
import { useOffline } from "@/components/offline-provider";
import { Trash2, MapPin } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

type Pasture = {
  id: string;
  name: string;
  acres: number | null;
  notes: string | null;
};

type PastureFormProps = Readonly<{
  pastures: Pasture[];
}>;

export function PastureForm({ pastures }: PastureFormProps) {
  const { isOnline, enqueue } = useOffline();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const acresStr = formData.get("acres") as string;
    const notes = formData.get("notes") as string;

    if (isOnline) {
      startTransition(async () => {
        await createPasture(formData);
      });
    } else {
      await enqueue({
        type: "create_pasture",
        data: {
          name,
          acres: acresStr ? parseFloat(acresStr) : undefined,
          notes: notes || undefined,
        },
      });
      formRef.current?.reset();
    }
  }

  async function handleDelete(id: string) {
    if (isOnline) {
      const formData = new FormData();
      formData.set("id", id);
      startTransition(async () => {
        await deletePasture(formData);
      });
    } else {
      await enqueue({
        type: "delete_pasture",
        data: { id },
      });
    }
  }

  return (
    <>
      {/* Add pasture form */}
      <form
        ref={formRef}
        onSubmit={handleCreateSubmit}
        className="mb-8 rounded-lg border border-border bg-card p-4"
      >
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Add a pasture
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="e.g. North 40"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label
              htmlFor="acres"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Acres
            </label>
            <input
              type="number"
              id="acres"
              name="acres"
              step="0.1"
              placeholder="e.g. 40"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label
              htmlFor="notes"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Notes
            </label>
            <input
              type="text"
              id="notes"
              name="notes"
              placeholder="Optional notes"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Add pasture"}
        </button>
        {!isOnline && (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
            Saved locally — will sync when you reconnect
          </p>
        )}
      </form>

      {/* Pasture list */}
      {pastures && pastures.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 font-medium text-foreground"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-medium text-foreground"
                >
                  Acres
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-medium text-foreground"
                >
                  Notes
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-medium text-foreground"
                >
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {pastures.map((pasture) => (
                <tr
                  key={pasture.id}
                  className="hover:bg-muted/40 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {pasture.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {pasture.acres ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {pasture.notes ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(pasture.id)}
                      disabled={isPending}
                      title="Delete"
                      className="inline-flex items-center justify-center rounded-md p-1.5 text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Delete {pasture.name}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={MapPin}
          message="No pastures yet. Add one above to get started."
        />
      )}
    </>
  );
}
