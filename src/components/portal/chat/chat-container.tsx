"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ChatMessage } from "@/components/portal/chat/chat-message";
import { ChatInput } from "@/components/portal/chat/chat-input";
import { Card } from "@/components/ui/card";
import { MessageCircle, Sparkles } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type PatientResultContext = {
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
};

type ChatContainerProps = {
  patientContext: {
    patientName: string;
    results: PatientResultContext[];
  };
  initialMessage?: string;
};

const STARTER_PROMPTS = [
  "What does my cholesterol level mean?",
  "How should I prepare for a blood test?",
  "Explain my latest lab results",
  "What is a normal glucose level?",
];

export function ChatContainer({ patientContext, initialMessage }: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const initialSent = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-send initial message if provided (e.g., from result detail page)
  useEffect(() => {
    if (initialMessage && !initialSent.current && messages.length === 0) {
      initialSent.current = true;
      sendMessage(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (isStreaming || !content.trim()) return;

      const userMessage: Message = { role: "user", content: content.trim() };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setIsStreaming(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages,
            patientContext,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          setMessages([
            ...newMessages,
            {
              role: "assistant",
              content:
                errorText ||
                "Sorry, I was unable to process your request. Please try again.",
            },
          ]);
          setIsStreaming(false);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          setMessages([
            ...newMessages,
            {
              role: "assistant",
              content: "Sorry, something went wrong. Please try again.",
            },
          ]);
          setIsStreaming(false);
          return;
        }

        const decoder = new TextDecoder();
        let assistantContent = "";
        setMessages([...newMessages, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  assistantContent += parsed.text;
                  setMessages([
                    ...newMessages,
                    { role: "assistant", content: assistantContent },
                  ]);
                }
              } catch {
                // Skip malformed JSON lines
              }
            }
          }
        }

        // Final update with complete content
        if (assistantContent) {
          setMessages([
            ...newMessages,
            { role: "assistant", content: assistantContent },
          ]);
        }
      } catch {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content:
              "Sorry, I was unable to connect to the server. Please check your connection and try again.",
          },
        ]);
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, messages, patientContext]
  );

  return (
    <Card className="flex flex-1 flex-col overflow-hidden border border-slate-200 rounded-xl shadow-sm">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <span className="flex size-14 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <MessageCircle className="size-7" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-slate-950">
              How can I help you today?
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-slate-500">
              Ask me about your lab results, what tests measure, or how to
              prepare for upcoming tests.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  disabled={isStreaming}
                  className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left text-sm text-slate-600 shadow-sm transition-all hover:border-teal-200 hover:shadow-md disabled:opacity-50"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-100">
                    <Sparkles className="size-4" />
                  </span>
                  <span className="pt-0.5">{prompt}</span>
                </button>
              ))}
            </div>

            <p className="mt-6 max-w-sm text-center text-xs text-slate-400">
              This AI assistant provides general information only. Always consult
              your healthcare provider for personalized medical advice.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                role={message.role}
                content={message.content}
              />
            ))}
            {isStreaming &&
              messages[messages.length - 1]?.role !== "assistant" && (
                <ChatMessage role="assistant" content="" isLoading />
              )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-slate-200 bg-slate-50/50 p-4">
        <ChatInput onSend={sendMessage} disabled={isStreaming} />
        <p className="mt-2 text-center text-xs text-slate-400">
          AI provides general information only. Consult your doctor for medical advice.
        </p>
      </div>
    </Card>
  );
}
