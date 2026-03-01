// Grit & Grain Service Worker
// ─────────────────────────────────────────────────────────────────────────────
// Caching strategies:
//   /_next/static/**   → cache-first               (content-hashed, immutable)
//   /api/**            → network-only              (auth + mutations, never cache)
//   page navigations   → stale-while-revalidate    (instant paint, background refresh)
//   RSC fetches        → network-first, AND proactively cache full HTML page
//   everything else    → stale-while-revalidate
//
// WHY proactive HTML caching for RSC:
//   Next.js App Router does client-side navigation via RSC data fetches
//   (e.g. GET /diary with Next-Router-State-Tree header). These are NOT
//   `mode:"navigate"` requests. Without proactive caching, clicking <Link>
//   while online wouldn't cache the full HTML for that page, so a later
//   hard reload offline would find nothing.
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_NAME = "grit-and-grain-v2";

// Known app page routes — only these get proactively HTML-cached
const PAGE_PATHS = [
  "/dashboard",
  "/diary",
  "/diary/new",
  "/pastures",
  "/herds",
  "/profile",
  "/chat",
  "/review",
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((n) => n.startsWith("grit-and-grain-") && n !== CACHE_NAME)
            .map((n) => caches.delete(n)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept same-origin requests
  if (url.origin !== self.location.origin) return;

  // API routes — always pass through (offline queue handles mutations)
  if (url.pathname.startsWith("/api/")) return;

  // Immutable Next.js static chunks — cache-first
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Skip other _next internal requests (RSC chunks, HMR, etc.)
  if (url.pathname.startsWith("/_next/")) return;

  // Detect RSC client-side navigation:
  // Next.js App Router sends Next-Router-State-Tree on RSC fetches
  const isRsc =
    request.headers.has("Next-Router-State-Tree") ||
    request.headers.has("RSC") ||
    url.searchParams.has("_rsc");

  if (isRsc) {
    // Serve RSC payload via network (don't cache the RSC-specific response)
    event.respondWith(networkFirst(request));
    // Proactively cache the full HTML for this pathname so offline hard-reloads
    // work — fire-and-forget, does not block the RSC response
    proactivelyCacheHtml(url.pathname);
    return;
  }

  // Full-page navigation (hard load, browser reload, direct URL entry)
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNav(request));
    return;
  }

  // Everything else (images, fonts, etc.)
  event.respondWith(staleWhileRevalidate(request));
});

// ─── Strategies ───────────────────────────────────────────────────────────────

/**
 * Stale-while-revalidate for page navigate requests.
 * Serves the cached HTML immediately (zero wait for repeat visitors) and
 * refreshes the cache in the background. Falls back to a network fetch when
 * no cache entry exists yet (first visit).
 * Keyed by pathname only so the same entry is used regardless of query params.
 */
async function networkFirstNav(request) {
  const pathname = new URL(request.url).pathname;
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(pathname);

  // Kick off a background revalidation regardless of cache state
  const revalidate = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(pathname, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    // Serve stale immediately — background fetch updates cache for next visit
    revalidate.catch(() => {});
    return cached;
  }

  // No cache yet — wait for the network (first visit)
  return (
    (await revalidate) ??
    new Response(
      `<!doctype html><html><body style="font-family:sans-serif;padding:2rem">
        <p>You are offline. <a href="/dashboard">Return to dashboard</a></p>
      </body></html>`,
      { status: 503, headers: { "Content-Type": "text/html" } },
    )
  );
}

/** Network-first without caching — used for RSC payloads. */
async function networkFirst(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

/**
 * Fetch and cache the full HTML for a page pathname.
 * Called alongside RSC fetches so offline hard-reloads are covered.
 * Only runs once per pathname (skips if already cached).
 */
async function proactivelyCacheHtml(pathname) {
  if (!PAGE_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return;
  }
  try {
    const cache = await caches.open(CACHE_NAME);
    const existing = await cache.match(pathname);
    if (existing) return; // Already cached — skip the extra request
    const response = await fetch(pathname, {
      headers: { Accept: "text/html" },
      credentials: "same-origin",
    });
    if (response.ok) {
      await cache.put(pathname, response.clone());
    }
  } catch {
    // Best-effort, ignore failures
  }
}

/** Cache-first for immutable assets (/_next/static/**). */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

/** Serve from cache instantly, revalidate in the background. */
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const revalidate = fetch(request)
    .then((response) => {
      if (response.ok) {
        caches
          .open(CACHE_NAME)
          .then((cache) => cache.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => null);
  return (
    cached ?? (await revalidate) ?? new Response("Offline", { status: 503 })
  );
}
