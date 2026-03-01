import type { NextConfig } from "next";

// Build connect-src from env vars so it covers local dev (127.0.0.1:54321)
// and production Supabase without hard-coding either URL.
const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "";
  }
})();

const aiGatewayOrigin =
  process.env.VERCEL_AI_GATEWAY_BASE_URL ?? "https://ai-gateway.vercel.sh";

// Supabase Realtime uses WebSockets on the same host (http→ws, https→wss)
const supabaseWsOrigin = supabaseOrigin
  ? supabaseOrigin.replace(/^http/, "ws")
  : "";

const connectSrc = ["'self'", supabaseOrigin, supabaseWsOrigin, aiGatewayOrigin]
  .filter(Boolean)
  .join(" ");

const ContentSecurityPolicy = [
  "default-src 'self'",
  // Next.js runtime + hydration requires unsafe-inline for inline scripts
  "script-src 'self' 'unsafe-inline'",
  // Tailwind CSS 4 and Next.js inject inline styles
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src ${connectSrc}`,
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  // Prevent clickjacking — page cannot be embedded in an iframe
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limit referrer info sent to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict browser features; allow microphone for voice note capture
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=()",
  },
  // Force HTTPS for 2 years (effective only on production HTTPS)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
