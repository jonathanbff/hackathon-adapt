import * as React from "react";
import { cn } from "~/lib/utils";
import { Button } from "./button";

const PromptInput = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex min-h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
      className
    )}
    {...props}
  />
));
PromptInput.displayName = "PromptInput";

const PromptInputTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex-1 resize-none bg-transparent placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    rows={1}
    style={{ minHeight: "32px" }}
    {...props}
  />
));
PromptInputTextarea.displayName = "PromptInputTextarea";

const PromptInputActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2 ml-2", className)}
    {...props}
  />
));
PromptInputActions.displayName = "PromptInputActions";

interface PromptInputActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip?: string;
}

const PromptInputAction = React.forwardRef<
  HTMLButtonElement,
  PromptInputActionProps
>(({ className, tooltip, children, ...props }, ref) => (
  <Button
    ref={ref}
    variant="ghost"
    size="sm"
    className={cn("h-8 w-8 p-0", className)}
    title={tooltip}
    {...props}
  >
    {children}
  </Button>
));
PromptInputAction.displayName = "PromptInputAction";

export { PromptInput, PromptInputTextarea, PromptInputActions, PromptInputAction }; 