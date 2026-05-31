"use client";

import * as React from "react";
import { Loader2, Send, Sparkles, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export type AiAssistatMessage = {
  text: string;
  isUser: boolean;
};

export type AiAssistatProps = {
  title?: string;
  description?: string;
  className?: string;
  messages?: AiAssistatMessage[];
  onSend?: (message: string) => void | Promise<void>;
  isTyping?: boolean;
  onClear?: () => void;
  disabled?: boolean;
  placeholder?: string;
};

const DEFAULT_RESPONSE =
  "Hi there! I'm your AI assistant. How can I help you today?";

function simulateResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  if (lower.includes("hello") || lower.includes("hi")) {
    return "Hello! I'm your friendly AI assistant. What can I do for you?";
  }
  if (lower.includes("help")) {
    return "I'm here to help! You can ask me questions, request information, or just chat.";
  }
  if (lower.includes("thank")) {
    return "You're welcome! Is there anything else you'd like to know?";
  }
  if (lower.includes("who are you")) {
    return "I'm an AI assistant designed to be helpful, harmless, and honest!";
  }
  return DEFAULT_RESPONSE;
}

function AiAssistat({
  title = "AI Assistant",
  description = "Ask me anything and I'll do my best to assist you!",
  className,
  messages: controlledMessages,
  onSend,
  isTyping: controlledIsTyping,
  onClear,
  disabled = false,
  placeholder = "Type your message...",
}: AiAssistatProps) {
  const [input, setInput] = React.useState("");
  const [internalMessages, setInternalMessages] = React.useState<
    AiAssistatMessage[]
  >([]);
  const [internalIsTyping, setInternalIsTyping] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const isControlled = controlledMessages !== undefined;
  const messages = isControlled ? controlledMessages : internalMessages;
  const isTyping = controlledIsTyping ?? internalIsTyping;

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleInternalResponse = (userMessage: string) => {
    setInternalIsTyping(true);
    window.setTimeout(() => {
      setInternalIsTyping(false);
      setInternalMessages((prev) => [
        ...prev,
        { text: simulateResponse(userMessage), isUser: false },
      ]);
    }, 1500);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled || isTyping) return;

    setInput("");

    if (onSend) {
      await onSend(trimmed);
      return;
    }

    setInternalMessages((prev) => [...prev, { text: trimmed, isUser: true }]);
    handleInternalResponse(trimmed);
  };

  const clearChat = () => {
    if (onClear) {
      onClear();
      return;
    }
    setInternalMessages([]);
  };

  return (
    <div
      className={cn(
        "mx-auto flex h-[600px] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-indigo-500/20 bg-gradient-to-br from-slate-900 to-indigo-950 shadow-2xl",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-indigo-500/30 bg-indigo-600/30 p-4 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-indigo-300" />
          <h2 className="font-medium text-white">{title}</h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={clearChat}
          className="text-indigo-200 hover:bg-indigo-500/20 hover:text-white"
          aria-label="Clear chat"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-900/50 p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Sparkles className="mb-4 h-12 w-12 text-indigo-400" />
            <h3 className="mb-2 text-xl text-indigo-200">{title}</h3>
            <p className="max-w-xs text-sm text-slate-400">{description}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={`${index}-${msg.isUser ? "user" : "assistant"}`}
                className={cn("flex", msg.isUser ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl p-3 text-sm animate-fade-in",
                    msg.isUser
                      ? "rounded-tr-none bg-indigo-600 text-white"
                      : "rounded-tl-none border border-slate-600/50 bg-slate-700/60 text-slate-100",
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {isTyping && messages.at(-1)?.isUser && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-tl-none border border-slate-600/50 bg-slate-700/60 p-3 text-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400 [animation-delay:0.2s]" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400 [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className={cn(
          "border-t p-4 transition-colors duration-200",
          isFocused
            ? "border-indigo-500/70 bg-slate-800/80"
            : "border-slate-700/50 bg-slate-800/30",
        )}
      >
        <div className="relative flex items-center">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled || isTyping}
            className="rounded-full border-slate-600/50 bg-slate-700/50 py-3 pl-4 pr-12 text-white placeholder:text-slate-400 focus-visible:border-indigo-500/70 focus-visible:ring-indigo-500/70"
          />
          <Button
            type="submit"
            size="icon"
            disabled={input.trim() === "" || disabled || isTyping}
            className={cn(
              "absolute right-1 rounded-full",
              input.trim() === ""
                ? "cursor-not-allowed bg-slate-700/50 text-slate-500"
                : "bg-indigo-600 text-white hover:bg-indigo-500",
            )}
            aria-label="Send message"
          >
            {isTyping ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AiAssistat;
export { AiAssistat };
