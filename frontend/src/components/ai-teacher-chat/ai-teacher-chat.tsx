import { cn } from "~/lib/utils";

type AITeacherChatProps = React.HTMLAttributes<HTMLDivElement>;

export function AITeacherChat({ className }: AITeacherChatProps) {
  return <div className={cn("h-screen bg-card", className)}></div>;
}
