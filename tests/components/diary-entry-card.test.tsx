// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DiaryEntryCard } from "@/components/diary-entry-card";

describe("DiaryEntryCard", () => {
  const baseProps = {
    id: "entry-1",
    entryDate: "2026-03-01",
    content:
      "Moved 80 head of Angus cattle to the north pasture this morning. Grass coverage looks good.",
    tags: [] as string[],
  };

  it("renders without crashing", () => {
    render(<DiaryEntryCard {...baseProps} />);
  });

  it("renders the formatted entry date", () => {
    render(<DiaryEntryCard {...baseProps} />);
    // "2026-03-01" should display as "Mar 1, 2026"
    expect(screen.getByText("Mar 1, 2026")).toBeInTheDocument();
  });

  it("renders the content text", () => {
    render(<DiaryEntryCard {...baseProps} />);
    expect(
      screen.getByText(/Moved 80 head of Angus cattle/),
    ).toBeInTheDocument();
  });

  it("truncates content longer than 180 characters and appends ellipsis", () => {
    const longContent = "A".repeat(200);
    render(<DiaryEntryCard {...baseProps} content={longContent} />);
    const text = screen.getByText(/A+\u2026/);
    expect(text.textContent?.length).toBeLessThanOrEqual(184); // 180 + '...' (1 char ellipsis)
  });

  it("does not truncate content that is exactly 180 characters", () => {
    const exactContent = "B".repeat(180);
    render(<DiaryEntryCard {...baseProps} content={exactContent} />);
    const el = screen.getByText(exactContent);
    expect(el).toBeInTheDocument();
    expect(el.textContent).not.toContain("…");
  });

  it("renders pasture badge when pastureName is provided", () => {
    render(<DiaryEntryCard {...baseProps} pastureName="North Field" />);
    expect(screen.getByText("North Field")).toBeInTheDocument();
  });

  it("does not render pasture badge when pastureName is null", () => {
    render(<DiaryEntryCard {...baseProps} pastureName={null} />);
    expect(screen.queryByText("North Field")).not.toBeInTheDocument();
  });

  it("renders herd group badge when herdGroupName is provided", () => {
    render(<DiaryEntryCard {...baseProps} herdGroupName="Angus Cows" />);
    expect(screen.getByText("Angus Cows")).toBeInTheDocument();
  });

  it("does not render herd group badge when herdGroupName is null", () => {
    render(<DiaryEntryCard {...baseProps} herdGroupName={null} />);
    expect(screen.queryByText("Angus Cows")).not.toBeInTheDocument();
  });

  it("renders tags when provided", () => {
    render(
      <DiaryEntryCard {...baseProps} tags={["vaccination", "vet-visit"]} />,
    );
    expect(screen.getByText("vaccination")).toBeInTheDocument();
    expect(screen.getByText("vet-visit")).toBeInTheDocument();
  });

  it("renders no tag elements when tags array is empty", () => {
    render(<DiaryEntryCard {...baseProps} tags={[]} />);
    expect(screen.queryByText("vaccination")).not.toBeInTheDocument();
  });

  it("renders both pasture and herd badges simultaneously", () => {
    render(
      <DiaryEntryCard
        {...baseProps}
        pastureName="South 40"
        herdGroupName="Heifer Group A"
      />,
    );
    expect(screen.getByText("South 40")).toBeInTheDocument();
    expect(screen.getByText("Heifer Group A")).toBeInTheDocument();
  });
});
