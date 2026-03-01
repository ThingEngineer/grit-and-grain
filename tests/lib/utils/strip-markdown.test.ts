import { describe, it, expect } from "vitest";
import { stripMarkdown } from "@/lib/utils/strip-markdown";

describe("stripMarkdown", () => {
  it("returns an empty string unchanged", () => {
    expect(stripMarkdown("")).toBe("");
  });

  it("strips h1–h6 headings", () => {
    expect(stripMarkdown("# Heading One")).toBe("Heading One");
    expect(stripMarkdown("## Heading Two")).toBe("Heading Two");
    expect(stripMarkdown("###### Heading Six")).toBe("Heading Six");
  });

  it("strips bold markers", () => {
    expect(stripMarkdown("**bold text**")).toBe("bold text");
  });

  it("strips italic markers", () => {
    expect(stripMarkdown("*italic text*")).toBe("italic text");
  });

  it("strips bold-italic markers", () => {
    expect(stripMarkdown("***bold italic***")).toBe("bold italic");
  });

  it("strips markdown links and keeps the label", () => {
    expect(stripMarkdown("[click here](https://example.com)")).toBe(
      "click here",
    );
  });

  it("strips unordered list markers (-, *, +)", () => {
    expect(stripMarkdown("- item one")).toBe("item one");
    expect(stripMarkdown("* item two")).toBe("item two");
    expect(stripMarkdown("+ item three")).toBe("item three");
  });

  it("strips blockquote markers", () => {
    expect(stripMarkdown("> quoted text")).toBe("quoted text");
  });

  it("strips inline code backticks", () => {
    expect(stripMarkdown("`some code`")).toBe("");
  });

  it("strips fenced code blocks", () => {
    expect(stripMarkdown("```js\nconsole.log()\n```")).toBe("");
  });

  it("collapses multiple newlines into a single space", () => {
    const input = "line one\n\nline two\n\n\nline three";
    expect(stripMarkdown(input)).toBe("line one line two line three");
  });

  it("replaces single newlines with spaces", () => {
    expect(stripMarkdown("line one\nline two")).toBe("line one line two");
  });

  it("trims leading and trailing whitespace", () => {
    expect(stripMarkdown("  hello world  ")).toBe("hello world");
  });

  it("handles plain text with no markdown", () => {
    expect(stripMarkdown("Just plain text here")).toBe("Just plain text here");
  });

  it("strips mixed markdown in a realistic note", () => {
    const input =
      "## Weekly Update\n\n**Cattle** moved to the *north* pasture. [Vet visit](https://vet.com) scheduled.\n\n- 120 head checked\n- Feed supplement added";
    const result = stripMarkdown(input);
    expect(result).not.toContain("##");
    expect(result).not.toContain("**");
    expect(result).not.toContain("*north*");
    expect(result).not.toContain("[Vet visit]");
    expect(result).not.toContain("-");
    expect(result).toContain("Weekly Update");
    expect(result).toContain("Cattle");
    expect(result).toContain("north");
    expect(result).toContain("Vet visit");
  });
});
