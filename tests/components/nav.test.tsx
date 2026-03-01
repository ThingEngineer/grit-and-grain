// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme</button>,
}));

vi.mock("@/components/profile-menu", () => ({
  ProfileMenu: ({ userName }: { userName: string }) => (
    <div data-testid="profile-menu">{userName}</div>
  ),
}));

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("Nav", () => {
  it("renders the brand name", async () => {
    const { Nav } = await import("@/components/nav");
    render(<Nav userName="Josh Smith" />);
    expect(screen.getByText("Grit & Grain")).toBeInTheDocument();
  });

  it("renders all nav links", async () => {
    const { Nav } = await import("@/components/nav");
    render(<Nav userName="Josh" />);
    const expectedLinks = [
      "Dashboard",
      "Diary",
      "Pastures",
      "Herds",
      "Farm Memory",
      "Weekly Review",
    ];
    for (const label of expectedLinks) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it("renders the user name via ProfileMenu", async () => {
    const { Nav } = await import("@/components/nav");
    render(<Nav userName="Annie Oakley" />);
    expect(screen.getByTestId("profile-menu")).toHaveTextContent(
      "Annie Oakley",
    );
  });

  it("renders the hamburger button on mobile", async () => {
    const { Nav } = await import("@/components/nav");
    render(<Nav userName="Josh" />);
    const toggleButton = screen.getByRole("button", { name: /toggle menu/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it("opens the mobile menu when hamburger is clicked", async () => {
    const { Nav } = await import("@/components/nav");
    render(<Nav userName="Josh" />);
    const toggleButton = screen.getByRole("button", { name: /toggle menu/i });
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the mobile menu when hamburger is clicked again", async () => {
    const { Nav } = await import("@/components/nav");
    render(<Nav userName="Josh" />);
    const toggleButton = screen.getByRole("button", { name: /toggle menu/i });

    fireEvent.click(toggleButton); // open
    fireEvent.click(toggleButton); // close
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
  });

  it("renders ThemeToggle", async () => {
    const { Nav } = await import("@/components/nav");
    render(<Nav userName="Josh" />);
    expect(screen.getAllByTestId("theme-toggle").length).toBeGreaterThan(0);
  });
});
