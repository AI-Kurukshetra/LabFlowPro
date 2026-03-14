import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

type ChatMessageProps = {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
};

export function ChatMessage({ role, content, isLoading }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          isUser
            ? "bg-teal-500 text-white"
            : "bg-slate-100 text-slate-600"
        )}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </span>

      {/* Message bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-xl border px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-teal-50 border-teal-200 text-slate-900"
            : "bg-white border-slate-200 text-slate-700"
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-1.5 py-1">
            <span className="size-1.5 animate-pulse rounded-full bg-slate-400" />
            <span className="size-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:150ms]" />
            <span className="size-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:300ms]" />
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{content}</p>
        )}
      </div>
    </div>
  );
}
