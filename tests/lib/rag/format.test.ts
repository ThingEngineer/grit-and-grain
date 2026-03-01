import { describe, it, expect } from "vitest";
import { formatEntryForRag } from "@/lib/rag/format";

describe("formatEntryForRag", () => {
  it("includes date and content always", () => {
    const result = formatEntryForRag({
      entry_date: "2026-03-01",
      content: "Moved 80 head to south pasture.",
    });
    expect(result).toContain("Date: 2026-03-01");
    expect(result).toContain("Notes: Moved 80 head to south pasture.");
  });

  it("includes pasture name when provided", () => {
    const result = formatEntryForRag({
      entry_date: "2026-03-01",
      content: "Check notes.",
      pasture_name: "South 40",
    });
    expect(result).toContain("Pasture: South 40");
  });

  it("includes acres when both pasture_name and acres are provided", () => {
    const result = formatEntryForRag({
      entry_date: "2026-03-01",
      content: "Check notes.",
      pasture_name: "North Field",
      acres: 80,
    });
    expect(result).toContain("Pasture: North Field (80 acres)");
  });

  it("omits acres part when acres is null", () => {
    const result = formatEntryForRag({
      entry_date: "2026-03-01",
      content: "Check notes.",
      pasture_name: "North Field",
      acres: null,
    });
    expect(result).toContain("Pasture: North Field");
    expect(result).not.toContain("acres");
  });

  it("omits Pasture line when pasture_name is null", () => {
    const result = formatEntryForRag({
      entry_date: "2026-03-01",
      content: "Check notes.",
      pasture_name: null,
    });
    expect(result).not.toContain("Pasture:");
  });

  it("includes herd group name when provided", () => {
    const result = formatEntryForRag({
      entry_date: "2026-03-01",
      content: "Check notes.",
      herd_group_name: "Angus Cows",
    });
    expect(result).toContain("Herd: Angus Cows");
  });

  it("includes head count when both herd_group_name and head_count are provided", () => {
    const result = formatEntryForRag({
      entry_date: "2026-03-01",
      content: "Check notes.",
      herd_group_name: "Angus Cows",
      head_count: 120,
    });
    expect(result).toContain("Herd: Angus Cows (120 head)");
  });

  it("omits head count part when head_count is null", () => {
    const result = formatEntryForRag({
      entry_date: "2026-03-01",
      content: "Check notes.",
      herd_group_name: "Angus Cows",
      head_count: null,
    });
    expect(result).toContain("Herd: Angus Cows");
    expect(result).not.toContain("head)");
  });

  it("includes tags line when tags array is non-empty", () => {
    const result = formatEntryForRag({
      entry_date: "2026-03-01",
      content: "Check notes.",
      tags: ["vaccination", "vet-visit"],
    });
    expect(result).toContain("Tags: vaccination, vet-visit");
  });

  it("omits Tags line when tags array is empty", () => {
    const result = formatEntryForRag({
      entry_date: "2026-03-01",
      content: "Check notes.",
      tags: [],
    });
    expect(result).not.toContain("Tags:");
  });

  it("omits Tags line when tags is undefined", () => {
    const result = formatEntryForRag({
      entry_date: "2026-03-01",
      content: "Check notes.",
    });
    expect(result).not.toContain("Tags:");
  });

  it("produces a full canonical block with all fields", () => {
    const result = formatEntryForRag({
      entry_date: "2026-03-01",
      content: "Checked fence line.",
      pasture_name: "West Ridge",
      acres: 200,
      herd_group_name: "Heifer Group A",
      head_count: 45,
      tags: ["fence", "inspection"],
    });

    expect(result).toBe(
      "Date: 2026-03-01\n" +
        "Pasture: West Ridge (200 acres)\n" +
        "Herd: Heifer Group A (45 head)\n" +
        "Tags: fence, inspection\n" +
        "Notes: Checked fence line.",
    );
  });
});
