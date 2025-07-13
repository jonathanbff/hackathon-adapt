"use client";

import { SignInButton as ClerkSignInButton } from "@clerk/nextjs";
import { Button } from "~/components/ui/button";

interface SignInButtonProps {
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg";
  children?: React.ReactNode;
}

export function SignInButton({ 
  variant = "default", 
  size = "default", 
  children = "Sign In" 
}: SignInButtonProps) {
  return (
    <ClerkSignInButton mode="modal">
      <Button variant={variant} size={size}>
        {children}
      </Button>
    </ClerkSignInButton>
  );
} 