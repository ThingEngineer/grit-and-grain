// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// ── Helpers ───────────────────────────────────────────────────────────────────
function mockMatchMedia(standalone: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches: standalone,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
}

function setUserAgent(ua: string) {
  Object.defineProperty(navigator, "userAgent", {
    writable: true,
    configurable: true,
    value: ua,
  });
}

const IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("usePwaInstall", () => {
  beforeEach(() => {
    vi.resetModules();
    setUserAgent(DESKTOP_UA);
    mockMatchMedia(false);
    // Ensure MSStream is not set (simulates non-IE)
    delete (window as Window & { MSStream?: unknown }).MSStream;
  });

  it("detects iOS from a mobile Safari user agent", async () => {
    setUserAgent(IOS_UA);
    const { usePwaInstall } = await import("@/hooks/use-pwa-install");
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.isIOS).toBe(true);
  });

  it("does not flag a desktop user agent as iOS", async () => {
    const { usePwaInstall } = await import("@/hooks/use-pwa-install");
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.isIOS).toBe(false);
  });

  it("detects standalone mode via matchMedia", async () => {
    mockMatchMedia(true);
    const { usePwaInstall } = await import("@/hooks/use-pwa-install");
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.isStandalone).toBe(true);
  });

  it("reports not standalone when matchMedia returns false", async () => {
    const { usePwaInstall } = await import("@/hooks/use-pwa-install");
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.isStandalone).toBe(false);
  });

  it("canInstall is true for iOS Safari when not already installed", async () => {
    setUserAgent(IOS_UA);
    const { usePwaInstall } = await import("@/hooks/use-pwa-install");
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.canInstall).toBe(true);
  });

  it("canInstall is false for iOS when already running standalone", async () => {
    setUserAgent(IOS_UA);
    mockMatchMedia(true); // standalone
    const { usePwaInstall } = await import("@/hooks/use-pwa-install");
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.canInstall).toBe(false);
  });

  it("canInstall is false on desktop when no install prompt is captured", async () => {
    // No beforeinstallprompt event fired → canInstallNatively = false
    const { usePwaInstall } = await import("@/hooks/use-pwa-install");
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.canInstall).toBe(false);
    expect(result.current.canInstallNatively).toBe(false);
  });

  it("does not flag iOS when MSStream is present (IE/Edge legacy)", async () => {
    setUserAgent(IOS_UA); // UA contains iPhone, but…
    (window as Window & { MSStream?: boolean }).MSStream = true; // simulates IE
    const { usePwaInstall } = await import("@/hooks/use-pwa-install");
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.isIOS).toBe(false);
  });
});
