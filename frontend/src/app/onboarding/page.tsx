"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { OnboardingForm } from "~/components/onboarding";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { ONBOARDING_STATUS } from "~/types/auth";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();

  const syncUserMutation = api.user.syncUser.useMutation();
  const completeOnboardingMutation = api.user.completeOnboarding.useMutation();

  useEffect(() => {
    if (user) {
      const onboardingStatus = (
        user.publicMetadata as { onboardingStatus?: string }
      )?.onboardingStatus;

      if (onboardingStatus === ONBOARDING_STATUS.COMPLETED) {
        console.log(
          "[ONBOARDING] User has already completed onboarding, redirecting to dashboard",
        );
        router.push("/courses");
      }
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onboardingStatus = (
    user.publicMetadata as { onboardingStatus?: string }
  )?.onboardingStatus;

  if (onboardingStatus === ONBOARDING_STATUS.COMPLETED) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCompleteOnboarding = async () => {
    try {
      await syncUserMutation.mutateAsync();
      await completeOnboardingMutation.mutateAsync();
      router.push("/courses");
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  // return <OnboardingForm />;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Edu One!</CardTitle>
          <CardDescription>
            Let's get you set up with your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Welcome, {user?.firstName || user?.fullName || "there"}!
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Click the button below to complete your onboarding and start using
              the platform.
            </p>
          </div>

          <Button
            onClick={handleCompleteOnboarding}
            disabled={
              syncUserMutation.isPending || completeOnboardingMutation.isPending
            }
            className="w-full"
          >
            {syncUserMutation.isPending || completeOnboardingMutation.isPending
              ? "Setting up your account..."
              : "Complete Onboarding"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
