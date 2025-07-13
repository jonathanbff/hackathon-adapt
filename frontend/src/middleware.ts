import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { clerkClient } from "~/lib/auth";
import { ONBOARDING_STATUS } from "~/types/auth";

const isOnboardingRoute = createRouteMatcher(["/onboarding"]);
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in",
  "/sign-up",
  "/api/trpc/(.*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (userId && isOnboardingRoute(req)) {
    try {
      const sessionOnboardingStatus = sessionClaims?.metadata?.onboardingStatus;
      
      if (sessionOnboardingStatus === ONBOARDING_STATUS.COMPLETED) {
        console.log(`[MIDDLEWARE] User has completed onboarding (session check), redirecting from onboarding page to dashboard`);
        const dashboardUrl = new URL("/dashboard", req.url);
        return NextResponse.redirect(dashboardUrl);
      }
      
      const clerkUser = await clerkClient.users.getUser(userId);
      const backendOnboardingStatus = (clerkUser.publicMetadata as { onboardingStatus?: string })?.onboardingStatus;
      
      if (backendOnboardingStatus === ONBOARDING_STATUS.COMPLETED) {
        console.log(`[MIDDLEWARE] User has completed onboarding (backend check), redirecting from onboarding page to dashboard`);
        const dashboardUrl = new URL("/dashboard", req.url);
        return NextResponse.redirect(dashboardUrl);
      }
      
      console.log(`[MIDDLEWARE] User has not completed onboarding, allowing access to onboarding page`);
      return NextResponse.next();
    } catch (error) {
      console.error(`[MIDDLEWARE] Error checking onboarding status for onboarding page: ${error}`);
      return NextResponse.next();
    }
  }

  if (!userId && !isPublicRoute(req)) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  if (userId && !isOnboardingRoute(req) && !isPublicRoute(req)) {
    try {
      const sessionOnboardingStatus = sessionClaims?.metadata?.onboardingStatus;
      
      if (sessionOnboardingStatus === ONBOARDING_STATUS.COMPLETED) {
        console.log(`[MIDDLEWARE] User has completed onboarding (session claims check) for route: ${req.nextUrl.pathname}`);
        return NextResponse.next();
      }
      
      console.log(`[MIDDLEWARE] Session claims onboarding status: ${sessionOnboardingStatus}, checking backend for route: ${req.nextUrl.pathname}`);
      
      const clerkUser = await clerkClient.users.getUser(userId);
      const backendOnboardingStatus = (clerkUser.publicMetadata as { onboardingStatus?: string })?.onboardingStatus;
      
      console.log(`[MIDDLEWARE] Backend onboarding status: ${backendOnboardingStatus} for route: ${req.nextUrl.pathname}`);
      
      if (backendOnboardingStatus === ONBOARDING_STATUS.COMPLETED) {
        console.log(`[MIDDLEWARE] User has completed onboarding (backend check) for route: ${req.nextUrl.pathname}`);
        return NextResponse.next();
      }
      
      console.log(`[MIDDLEWARE] Redirecting to onboarding from: ${req.nextUrl.pathname}`);
      const onboardingUrl = new URL("/onboarding", req.url);
      return NextResponse.redirect(onboardingUrl);
    } catch (error) {
      console.error(`[MIDDLEWARE] Error checking onboarding status: ${error}`);
      const onboardingUrl = new URL("/onboarding", req.url);
      return NextResponse.redirect(onboardingUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
}; 