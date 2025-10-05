// src/middleware.ts
import {
  clerkMiddleware,
  createRouteMatcher,
  type ClerkMiddlewareAuth,
} from "@clerk/nextjs/server";

/**
 * 👉 Edit these lists as your app grows.
 *    You can use regex-style `(.*)` suffixes to match subpaths.
 */

// Pages anyone can visit without signing in
const isPublicPage = createRouteMatcher([
  "/",
  "/about",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/access-points/public(.*)",
]);

// API routes that are public (no auth)
const isPublicApi = createRouteMatcher([
  "/api/public(.*)",
  "/api/health",
]);

// Webhook endpoints (ALWAYS unauthenticated; verify inside the route)
const isWebhookRoute = createRouteMatcher([
  "/api/webhooks/(.*)",
]);

// Admin-only dashboard paths
const isAdminPage = createRouteMatcher([
  "/admin(.*)",
]);

/**
 * 🔒 Admin check — replace with your own logic (metadata, org role, etc.)
 */
async function ensureAdmin(auth: ClerkMiddlewareAuth) {
  const { sessionClaims } = await auth();
  // Type assertion to allow access to custom claims
  const isAdmin = Boolean((sessionClaims as any)?.publicMetadata?.isAdmin);
  return isAdmin;
}

export default clerkMiddleware(async (auth, req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // 1️⃣ Skip auth for public pages & public APIs
  if (isPublicPage(req) || isPublicApi(req) || isWebhookRoute(req)) {
    return;
  }

  // 2️⃣ Require auth for everything else
  const authResult = await auth();
  const { userId } = authResult;
  if (!userId) {
    return authResult.redirectToSignIn({ returnBackUrl: req.url });
  }

  // 3️⃣ Optional: gate admin routes
  if (isAdminPage(req)) {
    const ok = await ensureAdmin(auth);
    if (!ok) {
      url.pathname = "/"; // redirect non-admins home or to /403
      return Response.redirect(url);
    }
  }

  // 4️⃣ Optional: redirect signed-in users away from /sign-in or /sign-up
  if (path.startsWith("/sign-in") || path.startsWith("/sign-up")) {
    url.pathname = "/dashboard";
    return Response.redirect(url);
  }

  // 5️⃣ Allow all other routes to continue
  return;
});

/**
 * Matcher:
 * - Runs on all app & API routes
 * - Skips Next.js internals and static assets
 * - Always runs for /api and /trpc
 */
export const config = {
  matcher: [
    "/((?!_next|.*\\..*|favicon.ico).*)",
    "/(api|trpc)(.*)",
  ],
};
