import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedPage = createRouteMatcher(["/upload(.*)", "/me(.*)"]);
const isProtectedApi = createRouteMatcher([
  "/api/upload(.*)",
  "/api/projects(.*)",
  "/api/users(.*)",
]);
const isPublicApi = createRouteMatcher(["/api/webhooks(.*)"]);

export default clerkMiddleware((auth, req) => {
  if (isPublicApi(req)) return;

  if (isProtectedPage(req)) {
    auth().protect();
  } else if (isProtectedApi(req) && req.method !== "GET") {
    auth().protect();
  } else if (req.nextUrl.pathname.startsWith("/api/users")) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
