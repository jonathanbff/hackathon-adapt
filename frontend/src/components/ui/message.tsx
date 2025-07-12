import * as React from "react";
import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Badge } from "./badge";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";

interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
  isLoading?: boolean;
  toolCalls?: Array<{
    toolName: string;
    args: any;
    result?: any;
  }>;
}

function preprocessLatexContent(content: string): string {
  let processedContent = content;
  
  const lines = processedContent.split('\n');
  const processedLines = lines.map(line => {
    let processedLine = line;
    
    while (processedLine.includes('( ') && processedLine.includes(' )')) {
      const startIndex = processedLine.indexOf('( ');
      const endIndex = processedLine.indexOf(' )', startIndex);
      
      if (startIndex !== -1 && endIndex !== -1) {
        const beforeMath = processedLine.substring(0, startIndex);
        const mathContent = processedLine.substring(startIndex + 2, endIndex);
        const afterMath = processedLine.substring(endIndex + 2);
        
        if (mathContent.includes('\\') || mathContent.includes('frac') || mathContent.includes('sqrt') || mathContent.includes('pi') || mathContent.includes('neq')) {
          processedLine = beforeMath + '\\(' + mathContent + '\\)' + afterMath;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    
    return processedLine;
  });
  
  return processedLines.join('\n');
}

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ className, role, content, timestamp, isLoading, toolCalls, ...props }, ref) => {
    const processedContent = role === "assistant" ? preprocessLatexContent(content) : content;
    
    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full max-w-full gap-3 p-4",
          role === "user" && "flex-row-reverse",
          className
        )}
        {...props}
      >
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={role === "user" ? "/user-avatar.png" : "/assistant-avatar.png"} />
          <AvatarFallback>
            {role === "user" ? "U" : role === "assistant" ? "A" : "S"}
          </AvatarFallback>
        </Avatar>

        <div className={cn("flex-1 space-y-2", role === "user" && "text-right")}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium capitalize">
              {role === "assistant" ? "Assistant" : role === "user" ? "You" : "System"}
            </span>
            {timestamp && (
              <span className="text-xs text-muted-foreground">
                {timestamp.toLocaleTimeString()}
              </span>
            )}
          </div>

          {toolCalls && toolCalls.length > 0 && (
            <div className="space-y-2">
              {toolCalls.map((toolCall, index) => (
                <div
                  key={index}
                  className="rounded-md border bg-muted/50 p-3 text-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {toolCall.toolName === "vector_search" ? "Document Search" : 
                       toolCall.toolName === "web_search" ? "Web Search" : 
                       toolCall.toolName}
                    </Badge>
                    {toolCall.args.query && (
                      <span className="text-xs text-muted-foreground">
                        "{toolCall.args.query}"
                      </span>
                    )}
                  </div>
                  {toolCall.result && (
                    <div className="text-xs text-muted-foreground">
                      {toolCall.result.message || "Search completed"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div
            className={cn(
              "prose prose-sm max-w-none rounded-lg px-3 py-2",
              role === "user"
                ? "bg-primary text-primary-foreground prose-invert"
                : "bg-muted/50 prose-stone dark:prose-invert",
              isLoading && "animate-pulse"
            )}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-current animate-bounce" />
                <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:0.1s]" />
                <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
              </div>
            ) : role === "user" ? (
              <div className="whitespace-pre-wrap break-words">{content}</div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="mb-2 last:mb-0 list-disc pl-4">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-2 last:mb-0 list-decimal pl-4">{children}</ol>,
                  li: ({ children }) => <li className="mb-1 last:mb-0">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ children, className }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-muted p-3 rounded-md overflow-x-auto">
                        <code className={className}>{children}</code>
                      </pre>
                    );
                  },
                  pre: ({ children }) => <div className="mb-2 last:mb-0">{children}</div>,
                  h1: ({ children }) => <h1 className="text-lg font-semibold mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold mb-2">{children}</h3>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic mb-2 last:mb-0">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {processedContent}
              </ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    );
  }
);
Message.displayName = "Message";

export { Message, type MessageProps }; 