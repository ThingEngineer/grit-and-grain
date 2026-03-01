import { createClient } from "@/lib/supabase/server";
import { createPasture, deletePasture } from "./actions";

export default async function PasturesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pastures } = await supabase
    .from("pastures")
    .select("*")
    .eq("profile_id", user!.id)
    .order("name");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Pastures
      </h1>

      {/* Add pasture form */}
      <form
        action={createPasture}
        className="mb-8 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Add a pasture
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="e.g. North 40"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
            />
          </div>
          <div>
            <label
              htmlFor="acres"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Acres
            </label>
            <input
              type="number"
              id="acres"
              name="acres"
              step="0.1"
              placeholder="e.g. 40"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
            />
          </div>
          <div>
            <label
              htmlFor="notes"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Notes
            </label>
            <input
              type="text"
              id="notes"
              name="notes"
              placeholder="Optional notes"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add pasture
        </button>
      </form>

      {/* Pasture list */}
      {pastures && pastures.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  Name
                </th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  Acres
                </th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  Notes
                </th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {pastures.map((pasture) => (
                <tr key={pasture.id}>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    {pasture.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {pasture.acres ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {pasture.notes ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={deletePasture} className="inline">
                      <input type="hidden" name="id" value={pasture.id} />
                      <button
                        type="submit"
                        className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 py-12 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No pastures yet. Add one above to get started.
          </p>
        </div>
      )}
    </div>
  );
}
