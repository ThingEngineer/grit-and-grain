"use client";

import { useTransition, useRef } from "react";
import {
  createHerdGroup,
  deleteHerdGroup,
} from "@/app/(authenticated)/herds/actions";
import { useOffline } from "@/components/offline-provider";

type HerdGroup = {
  id: string;
  name: string;
  species: string | null;
  head_count: number | null;
  notes: string | null;
};

type HerdFormProps = Readonly<{
  herdGroups: HerdGroup[];
}>;

export function HerdForm({ herdGroups }: HerdFormProps) {
  const { isOnline, enqueue } = useOffline();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const species = formData.get("species") as string;
    const headCountStr = formData.get("head_count") as string;
    const notes = formData.get("notes") as string;

    if (isOnline) {
      startTransition(async () => {
        await createHerdGroup(formData);
      });
    } else {
      await enqueue({
        type: "create_herd",
        data: {
          name,
          species: species || undefined,
          head_count: headCountStr ? parseInt(headCountStr, 10) : undefined,
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
        await deleteHerdGroup(formData);
      });
    } else {
      await enqueue({
        type: "delete_herd",
        data: { id },
      });
    }
  }

  return (
    <>
      {/* Add herd group form */}
      <form
        ref={formRef}
        onSubmit={handleCreateSubmit}
        className="mb-8 rounded-lg border border-border bg-card p-4"
      >
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Add a herd group
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              placeholder="e.g. Main cow herd"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label
              htmlFor="species"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Species
            </label>
            <input
              type="text"
              id="species"
              name="species"
              placeholder="e.g. Cattle"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label
              htmlFor="head_count"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Head count
            </label>
            <input
              type="number"
              id="head_count"
              name="head_count"
              min="0"
              placeholder="e.g. 50"
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
          {isPending ? "Adding…" : "Add herd group"}
        </button>
        {!isOnline && (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
            Saved locally — will sync when you reconnect
          </p>
        )}
      </form>

      {/* Herd groups list */}
      {herdGroups && herdGroups.length > 0 ? (
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
                  Species
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-medium text-foreground"
                >
                  Head count
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
              {herdGroups.map((group) => (
                <tr key={group.id}>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {group.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {group.species ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {group.head_count ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {group.notes ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(group.id)}
                      disabled={isPending}
                      className="text-xs text-destructive hover:text-destructive/80 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-12">
          <p className="text-sm text-muted-foreground">
            No herd groups yet. Add one above to get started.
          </p>
        </div>
      )}
    </>
  );
}
