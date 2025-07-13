"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import { SignInButton } from "./sign-in-button";
import { SignUpButton } from "./sign-up-button";
import { UserButton } from "./user-button";

export function AuthGuard() {
  return (
    <>
      <SignedOut>
        <div className="flex gap-2">
          <SignInButton variant="outline" />
          <SignUpButton />
        </div>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </>
  );
} 