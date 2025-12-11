import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  timestamp?: Date;
}

export function ChatMessage({ content, isUser, timestamp }: ChatMessageProps) {
  return (
    <motion.div
      initial={ { opacity: 0, y: 10 } }
      animate={ { opacity: 1, y: 0 } }
      className={ cn("flex gap-3", isUser && "flex-row-reverse") }
    >
      {/* Avatar */ }
      <div
        className={ cn(
          "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center overflow-hidden",
          isUser ? "bg-primary" : "bg-charcoal-dark"
        ) }
      >
        { isUser ? (
          <span className="text-primary-foreground font-semibold text-sm">U</span>
        ) : (
          <img src={ logo } alt="The Piggy" className="w-6 h-6 object-contain" />
        ) }
      </div>

      {/* Message Bubble */ }
      <div
        className={ cn(
          "max-w-[75%] px-4 py-3 rounded-2xl",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-card border border-border rounded-tl-sm shadow-soft"
        ) }
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{ content }</p>
        { timestamp && (
          <span
            className={ cn(
              "text-[10px] mt-1 block",
              isUser ? "text-primary-foreground/60" : "text-muted-foreground"
            ) }
          >
            { timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
          </span>
        ) }
      </div>
    </motion.div>
  );
}
