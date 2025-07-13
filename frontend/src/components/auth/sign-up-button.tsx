"use client";

import { SignUpButton as ClerkSignUpButton } from "@clerk/nextjs";
import { Button } from "~/components/ui/button";

interface SignUpButtonProps {
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg";
  children?: React.ReactNode;
}

export function SignUpButton({ 
  variant = "default", 
  size = "default", 
  children = "Sign Up" 
}: SignUpButtonProps) {
  return (
    <ClerkSignUpButton mode="modal">
      <Button variant={variant} size={size}>
        {children}
      </Button>
    </ClerkSignUpButton>
  );
} 