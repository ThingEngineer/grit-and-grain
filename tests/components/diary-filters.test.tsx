// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockPush = vi.fn();
const mockGetParam = vi.fn().mockReturnValue(null);
const mockSearchParamsToString = vi.fn().mockReturnValue("");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/diary",
  useSearchParams: () => ({
    get: mockGetParam,
    toString: mockSearchParamsToString,
  }),
}));

// ── Data fixtures ─────────────────────────────────────────────────────────────
const pastures = [
  { id: "p-1", name: "North Field" },
  { id: "p-2", name: "South 40" },
];
const herdGroups = [
  { id: "h-1", name: "Angus Cows" },
  { id: "h-2", name: "Heifer Group A" },
];
const tags = ["rotation", "hay", "herd_health"];

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("DiaryFilters", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockGetParam.mockReturnValue(null);
    mockSearchParamsToString.mockReturnValue("");
  });

  it("renders without crashing", async () => {
    const { DiaryFilters } = await import("@/components/diary-filters");
    render(
      <DiaryFilters
        pastures={pastures}
        herdGroups={herdGroups}
        allTags={tags}
        totalCount={10}
        filteredCount={10}
      />,
    );
  });

  it("renders the search input", async () => {
    const { DiaryFilters } = await import("@/components/diary-filters");
    render(
      <DiaryFilters
        pastures={pastures}
        herdGroups={herdGroups}
        allTags={[]}
        totalCount={5}
        filteredCount={5}
      />,
    );
    expect(screen.getByPlaceholderText("Search entries…")).toBeInTheDocument();
  });

  it("renders pasture options in the select", async () => {
    const { DiaryFilters } = await import("@/components/diary-filters");
    render(
      <DiaryFilters
        pastures={pastures}
        herdGroups={[]}
        allTags={[]}
        totalCount={5}
        filteredCount={5}
      />,
    );
    expect(screen.getByText("North Field")).toBeInTheDocument();
    expect(screen.getByText("South 40")).toBeInTheDocument();
  });

  it("renders herd group options in the select", async () => {
    const { DiaryFilters } = await import("@/components/diary-filters");
    render(
      <DiaryFilters
        pastures={[]}
        herdGroups={herdGroups}
        allTags={[]}
        totalCount={5}
        filteredCount={5}
      />,
    );
    expect(screen.getByText("Angus Cows")).toBeInTheDocument();
    expect(screen.getByText("Heifer Group A")).toBeInTheDocument();
  });

  it("renders tag pills for each tag", async () => {
    const { DiaryFilters } = await import("@/components/diary-filters");
    render(
      <DiaryFilters
        pastures={[]}
        herdGroups={[]}
        allTags={tags}
        totalCount={5}
        filteredCount={5}
      />,
    );
    expect(screen.getByText("rotation")).toBeInTheDocument();
    expect(screen.getByText("hay")).toBeInTheDocument();
    // "herd_health" → rendered as "herd health" (underscores replaced)
    expect(screen.getByText("herd health")).toBeInTheDocument();
  });

  it("does not show Clear all button when no filters are active", async () => {
    const { DiaryFilters } = await import("@/components/diary-filters");
    render(
      <DiaryFilters
        pastures={[]}
        herdGroups={[]}
        allTags={[]}
        totalCount={5}
        filteredCount={5}
      />,
    );
    expect(screen.queryByText("Clear all")).not.toBeInTheDocument();
  });

  it("shows Clear all button when a filter is active", async () => {
    mockGetParam.mockImplementation((key: string) =>
      key === "q" ? "cattle" : null,
    );
    const { DiaryFilters } = await import("@/components/diary-filters");
    render(
      <DiaryFilters
        pastures={[]}
        herdGroups={[]}
        allTags={[]}
        totalCount={5}
        filteredCount={3}
      />,
    );
    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });

  it("calls router.push when a tag pill is clicked", async () => {
    const { DiaryFilters } = await import("@/components/diary-filters");
    render(
      <DiaryFilters
        pastures={[]}
        herdGroups={[]}
        allTags={["rotation"]}
        totalCount={5}
        filteredCount={5}
      />,
    );
    fireEvent.click(screen.getByText("rotation"));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("rotation"));
  });

  it("calls router.push when Clear all is clicked", async () => {
    mockGetParam.mockImplementation((key: string) =>
      key === "pasture" ? "p-1" : null,
    );
    const { DiaryFilters } = await import("@/components/diary-filters");
    render(
      <DiaryFilters
        pastures={pastures}
        herdGroups={[]}
        allTags={[]}
        totalCount={5}
        filteredCount={2}
      />,
    );
    fireEvent.click(screen.getByText("Clear all"));
    expect(mockPush).toHaveBeenCalledWith("/diary");
  });

  it("shows filtered count when filters are active", async () => {
    mockGetParam.mockImplementation((key: string) =>
      key === "q" ? "hay" : null,
    );
    const { DiaryFilters } = await import("@/components/diary-filters");
    render(
      <DiaryFilters
        pastures={[]}
        herdGroups={[]}
        allTags={[]}
        totalCount={20}
        filteredCount={4}
      />,
    );
    expect(screen.getByText("4 of 20 entries")).toBeInTheDocument();
  });
});
