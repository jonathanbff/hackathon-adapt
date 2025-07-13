"use client";

import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { api } from "~/trpc/react";

export default function DashboardPage() {
  const { user } = useUser();
  const { data: userProfile, isLoading } = api.user.getProfile.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{userProfile?.name || user?.fullName || "Not set"}</p>
                  <p className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Username:</span>
                  <span className="text-sm">{userProfile?.username || "Not set"}</span>
                                                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Onboarding:</span>
                  <span className="text-sm">
                    {userProfile?.onboardingCompleted ? "Completed" : "Pending"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clerk Information</CardTitle>
              <CardDescription>Information from Clerk</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Clerk ID:</span>
                <span className="text-sm font-mono">{user?.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">First Name:</span>
                <span className="text-sm">{user?.firstName || "Not set"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Last Name:</span>
                <span className="text-sm">{user?.lastName || "Not set"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Email Verified:</span>
                <span className="text-sm">
                  {user?.emailAddresses[0]?.verification?.status === "verified" ? "Yes" : "No"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 